import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!;
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!;
const DISCORD_OWNER_ID = Deno.env.get('DISCORD_OWNER_ID')!;
const DISCORD_TICKET_CATEGORY_ID = Deno.env.get('DISCORD_TICKET_CATEGORY_ID')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { discord_id, username, order_id, items, total } = await req.json();

    if (!discord_id || !username) {
      return new Response(
        JSON.stringify({ error: 'Discord ID and username are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const channelName = `ticket-${username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const createChannelResponse = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/channels`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: channelName,
          type: 0,
          parent_id: DISCORD_TICKET_CATEGORY_ID,
          permission_overwrites: [
            {
              id: DISCORD_GUILD_ID,
              type: 0,
              deny: '1024',
            },
            {
              id: discord_id,
              type: 1,
              allow: '1024',
            },
            {
              id: DISCORD_OWNER_ID,
              type: 1,
              allow: '1024',
            },
          ],
        }),
      }
    );

    if (!createChannelResponse.ok) {
      const error = await createChannelResponse.text();
      console.error('Failed to create channel:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create ticket channel', details: error }),
        { status: createChannelResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const channel = await createChannelResponse.json();

    const itemsList = items?.map((item: any) => 
      `• ${item.name} x${item.quantity} - $${(item.price * item.quantity / 100).toFixed(2)}`
    ).join('\n') || 'No items';

    const embedMessage = {
      embeds: [{
        title: '🎟️ New Order Ticket',
        description: `Thank you for your purchase, <@${discord_id}>!`,
        color: 0x5865F2,
        fields: [
          {
            name: '📦 Order ID',
            value: order_id || 'N/A',
            inline: true,
          },
          {
            name: '💰 Total',
            value: `$${(total / 100).toFixed(2)}`,
            inline: true,
          },
          {
            name: '🛒 Items Purchased',
            value: itemsList,
            inline: false,
          },
        ],
        footer: {
          text: 'A staff member will assist you shortly.',
        },
        timestamp: new Date().toISOString(),
      }],
    };

    await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(embedMessage),
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        channel_id: channel.id,
        channel_name: channelName 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
