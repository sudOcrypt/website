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
  // Return the category as-is if provided, otherwise default to 'items'
  return category || 'items';
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
          const { data: updated } = await supabase
            .from("orders")
            .update({ status: "completed", stock_decremented: true })
            .eq("id", orderId)
            .eq("stock_decremented", false)
            .select("id")
            .maybeSingle();

          if (updated) {
            const { data: items } = await supabase
              .from("order_items")
              .select("product_id, quantity")
              .eq("order_id", orderId);

            for (const item of items || []) {
              await supabase.rpc("decrement_product_stock", {
                p_product_id: item.product_id,
                p_quantity: item.quantity,
              });
            }

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

              const { data: userData } = await supabase
                .from("users")
                .select("discord_id, discord_username")
                .eq("id", order.user_id)
                .single();

              const { data: orderItems } = await supabase
                .from("order_items")
                .select("*, products(title, price)")
                .eq("order_id", orderId);

              if (userData?.discord_id) {
                try {
                  await fetch(`${supabaseUrl}/functions/v1/create-discord-ticket`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "apikey": supabaseServiceKey,
                    },
                    body: JSON.stringify({
                      discord_id: userData.discord_id,
                      username: userData.discord_username || "customer",
                      order_id: orderId,
                      items: orderItems?.map(item => ({
                        name: item.products?.title || "Unknown",
                        quantity: item.quantity,
                        price: item.products?.price || 0,
                      })) || [],
                      total: order.total_amount,
                    }),
                  });
                } catch (error) {
                  console.error("Failed to create Discord ticket:", error);
                }

                try {
                  const customerRoleId = Deno.env.get("DISCORD_CUSTOMER_ROLE_ID");
                  const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
                  const guildId = Deno.env.get("DISCORD_GUILD_ID");

                  if (customerRoleId && botToken && guildId) {
                    await fetch(
                      `https://discord.com/api/v10/guilds/${guildId}/members/${userData.discord_id}/roles/${customerRoleId}`,
                      {
                        method: "PUT",
                        headers: {
                          "Authorization": `Bot ${botToken}`,
                          "Content-Type": "application/json",
                        },
                      }
                    );
                  }
                } catch (error) {
                  console.error("Failed to assign customer role:", error);
                }

                try {
                  const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
                  if (webhookUrl) {
                    const itemsList = orderItems?.map(item => 
                      `• ${item.products?.title || "Unknown"} x${item.quantity} - $${((item.products?.price || 0) * item.quantity / 100).toFixed(2)}`
                    ).join('\n') || 'No items';

                    await fetch(webhookUrl, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        embeds: [{
                          title: "💰 New Purchase Completed",
                          description: `A new order has been completed!`,
                          color: 0x57F287,
                          fields: [
                            {
                              name: "👤 Customer",
                              value: `<@${userData.discord_id}> (${userData.discord_username})`,
                              inline: true,
                            },
                            {
                              name: "📦 Order ID",
                              value: `\`${orderId.slice(0, 8).toUpperCase()}\``,
                              inline: true,
                            },
                            {
                              name: "💵 Total Amount",
                              value: `**$${(order.total_amount / 100).toFixed(2)}**`,
                              inline: true,
                            },
                            {
                              name: "🛒 Items Purchased",
                              value: itemsList,
                              inline: false,
                            },
                          ],
                          footer: {
                            text: "DonutMC Store",
                          },
                          timestamp: new Date().toISOString(),
                        }],
                      }),
                    });
                  }
                } catch (error) {
                  console.error("Failed to send webhook notification:", error);
                }
              }
            }
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
          const { data: updated } = await supabase
            .from("orders")
            .update({ status: "completed", stock_decremented: true })
            .eq("id", orderId)
            .eq("stock_decremented", false)
            .select("id")
            .maybeSingle();

          if (updated) {
            const { data: items } = await supabase
              .from("order_items")
              .select("product_id, quantity")
              .eq("order_id", orderId);

            for (const item of items || []) {
              await supabase.rpc("decrement_product_stock", {
                p_product_id: item.product_id,
                p_quantity: item.quantity,
              });
            }
          }
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
        const metadata = product.metadata || {};

        const isActiveFromMeta = metadata.is_active;
        const resolvedActive = isActiveFromMeta !== undefined && isActiveFromMeta !== null
          ? (isActiveFromMeta === "true" || isActiveFromMeta === true)
          : product.active;

        const newStock = Math.max(0, parseInt(metadata.stock || "999", 10));

        const productData = {
          stripe_product_id: stripeProductId,
          title: product.name,
          description: product.description || "",
          image_url: product.images?.[0] || null,
          category: mapStripeCategory(metadata),
          is_active: resolvedActive,
          stock: newStock,
          sort_order: parseInt(metadata.sort_order || "0", 10),
        };

        const { data: existing } = await supabase
          .from("products")
          .select("id, stock, title, image_url")
          .eq("stripe_product_id", stripeProductId)
          .maybeSingle();

        let shouldNotify = false;
        let isNewProduct = false;

        if (existing) {
          if (newStock > existing.stock) {
            shouldNotify = true;
          }
          await supabase
            .from("products")
            .update(productData)
            .eq("stripe_product_id", stripeProductId);
        } else {
          isNewProduct = true;
          shouldNotify = resolvedActive;
          await supabase.from("products").insert({
            ...productData,
            price: 0,
          });
        }

        if (shouldNotify) {
          try {
            const restockWebhookUrl = Deno.env.get("DISCORD_RESTOCK_WEBHOOK_URL");
            if (restockWebhookUrl) {
              const { data: productWithPrice } = await supabase
                .from("products")
                .select("*")
                .eq("stripe_product_id", stripeProductId)
                .single();

              if (productWithPrice) {
                await fetch(restockWebhookUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    embeds: [{
                      title: isNewProduct ? "🆕 New Product Available!" : "📦 Product Restocked!",
                      description: productWithPrice.title,
                      color: isNewProduct ? 0x5865F2 : 0x57F287,
                      fields: [
                        {
                          name: "💵 Price",
                          value: `**$${productWithPrice.price.toFixed(2)}**`,
                          inline: true,
                        },
                        {
                          name: "📊 Stock",
                          value: isNewProduct 
                            ? `**${newStock} available**`
                            : `**${existing.stock} → ${newStock}** (+${newStock - existing.stock})`,
                          inline: true,
                        },
                        {
                          name: "🏷️ Category",
                          value: productWithPrice.category,
                          inline: true,
                        },
                        ...(productWithPrice.description ? [{
                          name: "📝 Description",
                          value: productWithPrice.description.slice(0, 200),
                          inline: false,
                        }] : []),
                      ],
                      thumbnail: productWithPrice.image_url ? {
                        url: productWithPrice.image_url,
                      } : undefined,
                      footer: {
                        text: "DonutMC Store",
                      },
                      timestamp: new Date().toISOString(),
                    }],
                  }),
                });
              }
            }
          } catch (error) {
            console.error("Failed to send restock notification:", error);
          }
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
        const stripeProductId = typeof price.product === "string" ? price.product : price.product?.id;
        if (!stripeProductId) break;

        const unitAmount = price.unit_amount || 0;
        const priceInDollars = unitAmount / 100;

        if (price.active) {
          // Check if product exists first
          const { data: existingProduct } = await supabase
            .from("products")
            .select("id")
            .eq("stripe_product_id", stripeProductId)
            .maybeSingle();

          if (existingProduct) {
            // Product exists, update the price
            await supabase
              .from("products")
              .update({
                price: priceInDollars,
                stripe_price_id: price.id,
              })
              .eq("stripe_product_id", stripeProductId);
          } else {
            // Product doesn't exist yet, create it with the price
            // This handles the edge case where price.created fires before product.created
            await supabase.from("products").insert({
              stripe_product_id: stripeProductId,
              title: "Pending Product", // Will be updated when product.created fires
              description: "",
              category: "items",
              price: priceInDollars,
              stripe_price_id: price.id,
              is_active: false, // Will be updated when product.created fires
              stock: 0,
              sort_order: 0,
            });
          }
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
