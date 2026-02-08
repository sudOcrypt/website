import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Square-Signature",
};

const SQUARE_WEBHOOK_SIGNATURE_KEY = Deno.env.get("SQUARE_WEBHOOK_SIGNATURE_KEY") || "";

async function verifySquareSignature(body: string, signature: string, webhookUrl: string): Promise<boolean> {
  const encoder = new TextEncoder();
  
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SQUARE_WEBHOOK_SIGNATURE_KEY),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    // Square webhook signature is base64 encoded
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    
    // Concatenate webhook URL + body (Square's signature scheme)
    const dataToVerify = encoder.encode(webhookUrl + body);
    
    return await crypto.subtle.verify("HMAC", key, signatureBytes, dataToVerify);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

function mapSquareCategory(metadata: Record<string, string> | null): string {
  const category = metadata?.category?.toLowerCase();
  return category || 'items';
}

Deno.serve(async (req: Request) => {
  console.log('🔷 square-webhook invoked, method:', req.method);
  
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

    const signature = req.headers.get("X-Square-Signature");
    if (!signature) {
      console.log('❌ No Square signature header');
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const webhookUrl = req.url;
    
    const isValid = await verifySquareSignature(body, signature, webhookUrl);

    if (!isValid) {
      console.log('❌ Invalid Square signature');
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('✅ Signature verified');

    const event = JSON.parse(body);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📦 Event type:', event.type);

    switch (event.type) {
      case "payment.created": {
        const payment = event.data.object.payment;
        const orderId = payment.note?.match(/Order: ([a-f0-9-]+)/)?.[1];

        console.log('💳 Payment created, order ID:', orderId);

        if (orderId) {
          await supabase
            .from("orders")
            .update({ status: "processing" })
            .eq("id", orderId);
          
          console.log('✅ Order status updated to processing');
        }
        break;
      }

      case "payment.updated": {
        const payment = event.data.object.payment;
        const paymentStatus = payment.status;
        const orderId = payment.note?.match(/Order: ([a-f0-9-]+)/)?.[1];

        console.log('💳 Payment updated, status:', paymentStatus, 'order ID:', orderId);

        if (!orderId) {
          console.log('⚠️ No order ID found in payment note');
          break;
        }

        if (paymentStatus === "COMPLETED") {
          console.log('✅ Payment completed, updating order');

          // Update order to completed and decrement stock (atomic operation)
          const { data: updated } = await supabase
            .from("orders")
            .update({ status: "completed", stock_decremented: true })
            .eq("id", orderId)
            .eq("stock_decremented", false)
            .select("id")
            .maybeSingle();

          if (updated) {
            console.log('✅ Order completed, decrementing stock');

            // Get order items
            const { data: items } = await supabase
              .from("order_items")
              .select("product_id, quantity")
              .eq("order_id", orderId);

            // Decrement stock for each item
            for (const item of items || []) {
              await supabase.rpc("decrement_product_stock", {
                p_product_id: item.product_id,
                p_quantity: item.quantity,
              });
            }

            // Get full order details for notifications
            const { data: order } = await supabase
              .from("orders")
              .select("*, users(discord_username, discord_id, email)")
              .eq("id", orderId)
              .single();

            if (order) {
              // Create admin notification
              await supabase.from("admin_notifications").insert({
                type: "new_order",
                title: "New Order Received",
                message: `Order #${orderId.slice(0, 8).toUpperCase()} from ${order.users?.discord_username || "Unknown"} - $${order.total_amount}`,
                reference_id: orderId,
              });

              const userData = order.users;
              
              // Get order items for Discord/email
              const { data: orderItems } = await supabase
                .from("order_items")
                .select("*, products(title, price)")
                .eq("order_id", orderId);

              // Create Discord ticket
              if (userData?.discord_id) {
                console.log("🎫 Creating Discord ticket");
                try {
                  const ticketResponse = await fetch(`${supabaseUrl}/functions/v1/create-discord-ticket`, {
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
                  
                  if (!ticketResponse.ok) {
                    console.error("❌ Ticket creation failed");
                  } else {
                    console.log("✅ Ticket created");
                  }
                } catch (error) {
                  console.error("Failed to create Discord ticket:", error);
                }

                // Assign customer role
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

                // Send Discord webhook notification
                try {
                  const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
                  if (webhookUrl) {
                    const itemsList = orderItems?.map(item => 
                      `• ${item.products?.title || "Unknown"} x${item.quantity} - $${((item.products?.price || 0) * item.quantity).toFixed(2)}`
                    ).join('\n') || 'No items';

                    await fetch(webhookUrl, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        embeds: [{
                          title: "💰 New Purchase Completed",
                          description: `A new order has been completed via Square!`,
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
                              value: `**$${order.total_amount.toFixed(2)}**`,
                              inline: true,
                            },
                            {
                              name: "🛒 Items Purchased",
                              value: itemsList,
                              inline: false,
                            },
                          ],
                          footer: {
                            text: "DonutMC Store • Powered by Square",
                          },
                          timestamp: new Date().toISOString(),
                        }],
                      }),
                    });
                  }
                } catch (error) {
                  console.error("Failed to send webhook notification:", error);
                }

                // Send email receipt
                if (userData.email) {
                  try {
                    await fetch(
                      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-email`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                        },
                        body: JSON.stringify({
                          to: userData.email,
                          orderData: {
                            orderId: orderId,
                            minecraftUsername: order.minecraft_username,
                            totalAmount: order.total_amount,
                            items: orderItems || [],
                          },
                        }),
                      }
                    );
                  } catch (emailError) {
                    console.error("Failed to send email receipt:", emailError);
                  }
                }
              }
            }
          }
        } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELED") {
          console.log('❌ Payment failed/canceled');
          await supabase
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", orderId);

          await supabase.from("admin_notifications").insert({
            type: "payment_failed",
            title: "Payment Failed",
            message: `Order #${orderId.slice(0, 8).toUpperCase()} payment ${paymentStatus.toLowerCase()}`,
            reference_id: orderId,
          });
        }
        break;
      }

      case "catalog.version.updated": {
        // Optional: Sync catalog changes from Square
        console.log('📋 Catalog updated in Square');
        // You can implement auto-sync here if needed
        break;
      }

      default:
        console.log('⚠️ Unhandled event type:', event.type);
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
