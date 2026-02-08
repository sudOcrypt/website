import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SQUARE_ACCESS_TOKEN = Deno.env.get("SQUARE_ACCESS_TOKEN") || "";
const SQUARE_LOCATION_ID = Deno.env.get("SQUARE_LOCATION_ID") || "";

interface CartItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
}

interface CheckoutRequest {
  items: CartItem[];
  minecraft_username: string;
  success_url: string;
  cancel_url: string;
}

Deno.serve(async (req: Request) => {
  console.log('🔵 create-square-checkout invoked, method:', req.method);
  
  try {
    if (req.method === "OPTIONS") {
      console.log('✅ OPTIONS request - returning CORS headers');
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      console.log('❌ Invalid method:', req.method);
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TEMPORARY: Auth checks removed for debugging
    // TODO: Re-implement proper authentication after migration is complete
    const authHeader = req.headers.get("Authorization");
    console.log('🔑 Auth header present:', !!authHeader);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: CheckoutRequest = await req.json();
    
    // For now, we'll create orders without strict user validation
    // The user_id will be set to a placeholder or extracted from the auth header if available
    let user = null;
    let profile = null;
    
    if (authHeader) {
      const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
      
      if (user) {
        const { data: userProfile } = await supabaseService
          .from("users")
          .select("discord_id, discord_username")
          .eq("id", user.id)
          .single();
        profile = userProfile;
      }
    }
    const { items, minecraft_username, success_url, cancel_url } = body;

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items in cart" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!minecraft_username) {
      return new Response(JSON.stringify({ error: "Minecraft username required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate each item against DB
    const validatedItems: { product_id: string; title: string; price: number; quantity: number }[] = [];
    for (const item of items) {
      const { data: product, error: productError } = await supabaseService
        .from("products")
        .select("id, title, price, is_active, stock")
        .eq("id", item.product_id)
        .single();

      if (productError || !product) {
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.product_id}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!product.is_active) {
        return new Response(
          JSON.stringify({ error: `Product is not available: ${product.title}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (product.stock < item.quantity) {
        return new Response(
          JSON.stringify({ error: `Insufficient stock for ${product.title} (requested: ${item.quantity}, available: ${product.stock})` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      validatedItems.push({
        product_id: product.id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
      });
    }

    const totalAmount = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Enforce $2.00 minimum order
    const MINIMUM_ORDER = 2.00;
    console.log('💰 Total amount:', totalAmount, '| Minimum:', MINIMUM_ORDER);
    if (totalAmount < MINIMUM_ORDER) {
      console.log('❌ Order below minimum');
      return new Response(
        JSON.stringify({ 
          error: `Minimum order amount is $${MINIMUM_ORDER.toFixed(2)}. Your cart total is $${totalAmount.toFixed(2)}` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create order in database
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .insert({
        user_id: user?.id || null, // Allow null for now
        minecraft_username,
        total_amount: totalAmount,
        status: "pending",
        discord_id: profile?.discord_id || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create order:', orderError);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('✅ Order created:', order.id);

    const orderItems = validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    await supabaseService.from("order_items").insert(orderItems);

    // Create Square Checkout Payment Link
    const lineItems = validatedItems.map((item) => ({
      name: item.title,
      quantity: item.quantity.toString(),
      base_price_money: {
        amount: Math.round(item.price * 100), // Convert to cents
        currency: "USD",
      },
    }));

    console.log('🔷 Creating Square checkout with', lineItems.length, 'items');

    const squareResponse = await fetch("https://connect.squareup.com/v2/online-checkout/payment-links", {
      method: "POST",
      headers: {
        "Square-Version": "2024-12-18",
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: order.id, // Use order ID for idempotency
        quick_pay: {
          name: `DonutMC Store Order #${order.id.slice(0, 8).toUpperCase()}`,
          price_money: {
            amount: Math.round(totalAmount * 100),
            currency: "USD",
          },
          location_id: SQUARE_LOCATION_ID,
        },
        checkout_options: {
          redirect_url: `${success_url}?order_id=${order.id}`,
          ask_for_shipping_address: false,
          accepted_payment_methods: {
            apple_pay: true,
            google_pay: true,
          },
        },
        pre_populated_data: {
          buyer_email: user?.email || undefined,
        },
        payment_note: `Order: ${order.id} | Minecraft: ${minecraft_username} | Items: ${validatedItems.map(i => `${i.title} x${i.quantity}`).join(', ')}`,
      }),
    });

    const squareData = await squareResponse.json();
    console.log('🔷 Square response status:', squareResponse.status);

    if (!squareResponse.ok) {
      console.error('❌ Square API error:', squareData);
      // Clean up the order if Square checkout creation failed
      await supabaseService.from("orders").delete().eq("id", order.id);
      return new Response(
        JSON.stringify({ 
          error: squareData.errors?.[0]?.detail || "Failed to create Square checkout" 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const checkoutUrl = squareData.payment_link?.url;
    const paymentLinkId = squareData.payment_link?.id;

    if (!checkoutUrl) {
      console.error('❌ No checkout URL in Square response');
      await supabaseService.from("orders").delete().eq("id", order.id);
      return new Response(JSON.stringify({ error: "No checkout URL received from Square" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update order with Square payment link ID
    await supabaseService
      .from("orders")
      .update({ square_checkout_id: paymentLinkId })
      .eq("id", order.id);

    console.log('✅ Checkout created successfully');

    return new Response(
      JSON.stringify({
        url: checkoutUrl,
        order_id: order.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
