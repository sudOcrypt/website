import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature",
};

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

async function verifyStripeSignature(payload: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const parts = signature.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signaturePart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !signaturePart) return false;

  const timestamp = timestampPart.split("=")[1];
  const expectedSignature = signaturePart.split("=")[1];
  const signedPayload = `${timestamp}.${payload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(STRIPE_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const computedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedSignature === expectedSignature;
}

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

    const signature = req.headers.get("Stripe-Signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.text();
    const isValid = await verifyStripeSignature(payload, signature);

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(payload);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.order_id;

        if (orderId) {
          await supabase
            .from("orders")
            .update({ status: "processing" })
            .eq("id", orderId);

          const { data: order } = await supabase
            .from("orders")
            .select("*, users(discord_username)")
            .eq("id", orderId)
            .single();

          if (order) {
            await supabase.from("admin_notifications").insert({
              type: "new_order",
              title: "New Order Received",
              message: `Order #${orderId.slice(0, 8).toUpperCase()} from ${order.users?.discord_username || "Unknown"} - $${order.total_amount}`,
              reference_id: orderId,
            });
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
          await supabase
            .from("orders")
            .update({ status: "processing" })
            .eq("id", orderId);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
          await supabase
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", orderId);

          await supabase.from("admin_notifications").insert({
            type: "payment_failed",
            title: "Payment Failed",
            message: `Order #${orderId.slice(0, 8).toUpperCase()} payment failed`,
            reference_id: orderId,
          });
        }
        break;
      }

      case "product.created":
      case "product.updated": {
        const product = event.data.object;
        const stripeProductId = product.id;
        const isActive = product.active;
        const metadata = product.metadata || {};

        const productData = {
          stripe_product_id: stripeProductId,
          title: product.name,
          description: product.description || "",
          image_url: product.images?.[0] || null,
          category: mapStripeCategory(metadata),
          is_active: isActive,
          stock: parseInt(metadata.stock || "999", 10),
          sort_order: parseInt(metadata.sort_order || "0", 10),
        };

        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("stripe_product_id", stripeProductId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("products")
            .update(productData)
            .eq("stripe_product_id", stripeProductId);
        } else {
          await supabase.from("products").insert({
            ...productData,
            price: 0,
          });
        }
        break;
      }

      case "product.deleted": {
        const product = event.data.object;
        await supabase
          .from("products")
          .update({ is_active: false })
          .eq("stripe_product_id", product.id);
        break;
      }

      case "price.created":
      case "price.updated": {
        const price = event.data.object;
        const stripeProductId = price.product;
        const unitAmount = price.unit_amount || 0;
        const priceInDollars = unitAmount / 100;

        if (price.active) {
          await supabase
            .from("products")
            .update({
              price: priceInDollars,
              stripe_price_id: price.id,
            })
            .eq("stripe_product_id", stripeProductId);
        }
        break;
      }

      case "price.deleted": {
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
