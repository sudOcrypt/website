import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

function mapStripeCategory(metadata: Record<string, string> | null): string {
  const category = metadata?.category?.toLowerCase();
  if (category === 'coins' || category === 'items' || category === 'bases') {
    return category;
  }
  return 'items';
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseService = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabaseService
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const products = await stripe.products.list({ limit: 100, active: true });
    const prices = await stripe.prices.list({ limit: 100, active: true });

    const priceMap = new Map<string, Stripe.Price>();
    for (const price of prices.data) {
      const productId = typeof price.product === 'string' ? price.product : price.product.id;
      if (!priceMap.has(productId) || price.created > (priceMap.get(productId)?.created || 0)) {
        priceMap.set(productId, price);
      }
    }

    let synced = 0;
    let created = 0;
    let updated = 0;

    for (const product of products.data) {
      const price = priceMap.get(product.id);
      const priceInDollars = price ? (price.unit_amount || 0) / 100 : 0;
      const metadata = product.metadata || {};

      const productData = {
        stripe_product_id: product.id,
        stripe_price_id: price?.id || null,
        title: product.name,
        description: product.description || "",
        image_url: product.images?.[0] || null,
        price: priceInDollars,
        category: mapStripeCategory(metadata),
        is_active: product.active,
        stock: parseInt(metadata.stock || "999", 10),
        sort_order: parseInt(metadata.sort_order || "0", 10),
      };

      const { data: existing } = await supabaseService
        .from("products")
        .select("id")
        .eq("stripe_product_id", product.id)
        .maybeSingle();

      if (existing) {
        await supabaseService
          .from("products")
          .update(productData)
          .eq("stripe_product_id", product.id);
        updated++;
      } else {
        await supabaseService.from("products").insert(productData);
        created++;
      }
      synced++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        created,
        updated,
        message: `Synced ${synced} products (${created} created, ${updated} updated)`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to sync products from Stripe" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
