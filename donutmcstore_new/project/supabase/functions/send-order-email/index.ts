import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, orderData } = await req.json();

    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured, skipping email');
      return new Response(
        JSON.stringify({ success: true, message: 'Email system not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%); padding: 32px; text-align: center; }
          .header img { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 16px; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 32px; }
          .order-id { background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center; }
          .order-id span { color: #06b6d4; font-size: 14px; font-weight: bold; }
          .items { background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin: 24px 0; }
          .item { display: flex; justify-between; padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
          .item:last-child { border-bottom: none; }
          .item-name { color: #cbd5e1; }
          .item-price { color: white; font-weight: bold; }
          .total { background: linear-gradient(90deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%); border-radius: 12px; padding: 20px; margin: 24px 0; display: flex; justify-between; align-items: center; }
          .total-label { font-size: 18px; font-weight: bold; color: white; }
          .total-amount { font-size: 24px; font-weight: bold; background: linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .info-box { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0; }
          .info-box h3 { color: #22c55e; margin: 0 0 12px 0; font-size: 16px; }
          .info-box p { color: #cbd5e1; margin: 8px 0; line-height: 1.6; }
          .discord-btn { display: inline-block; background: #5865F2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 24px 0; }
          .footer { background: rgba(15, 23, 42, 0.8); padding: 24px; text-align: center; color: #64748b; font-size: 12px; }
          .security-badges { display: flex; justify-content: center; gap: 16px; margin: 20px 0; }
          .badge { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 8px 16px; border-radius: 8px; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://donutmc.store/logo.png" alt="DonutMC" />
            <h1>Thank You for Your Order!</h1>
          </div>
          
          <div class="content">
            <div class="order-id">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">ORDER ID</p>
              <span>${orderData.orderId.substring(0, 8).toUpperCase()}</span>
            </div>

            <p style="color: #cbd5e1; line-height: 1.6;">
              Hey <strong style="color: white;">${orderData.minecraftUsername}</strong>,
            </p>
            <p style="color: #cbd5e1; line-height: 1.6;">
              Your payment has been processed successfully! Your items will be delivered in-game within 24 hours.
            </p>

            <div class="items">
              <h3 style="color: white; margin: 0 0 16px 0;">Order Details</h3>
              ${orderData.items.map((item: any) => `
                <div class="item">
                  <span class="item-name">${item.title} x${item.quantity}</span>
                  <span class="item-price">$${(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>

            <div class="total">
              <span class="total-label">Total Paid</span>
              <span class="total-amount">$${orderData.totalAmount.toFixed(2)}</span>
            </div>

            <div class="info-box">
              <h3>✅ What Happens Next?</h3>
              <p><strong>1.</strong> Your order is being prepared by our team</p>
              <p><strong>2.</strong> Items will be delivered to your Minecraft account within 24 hours</p>
              <p><strong>3.</strong> You'll receive a Discord notification when it's ready</p>
            </div>

            <p style="color: #cbd5e1; text-align: center;">
              <strong>In-game Username:</strong> <span style="color: #06b6d4;">${orderData.minecraftUsername}</span>
            </p>

            <div style="text-align: center;">
              <a href="https://discord.gg/rtP5YhJFRB" class="discord-btn">Join Our Discord</a>
            </div>

            <div class="security-badges">
              <div class="badge">🔒 SSL Encrypted</div>
              <div class="badge">🛡️ Stripe Secured</div>
              <div class="badge">✓ Verified Store</div>
            </div>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} DonutMC Store. All rights reserved.</p>
            <p style="margin-top: 8px;">Questions? Reply to this email or join our Discord for support.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'DonutMC Store <orders@donutmc.store>',
        to: [to],
        subject: `Order Confirmation - ${orderData.orderId.substring(0, 8).toUpperCase()}`,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      throw new Error(data.message || 'Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Email error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
