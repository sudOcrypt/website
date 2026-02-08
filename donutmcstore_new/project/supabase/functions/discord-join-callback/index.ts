import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID')!;
const DISCORD_CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET')!;
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!;
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!;
const DISCORD_ROLE_ID = Deno.env.get('DISCORD_ROLE_ID')!;
const SITE_URL = Deno.env.get('SITE_URL') || 'https://donutmc.store';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const redirectBase = state ? decodeURIComponent(state) : SITE_URL;

    if (error) {
      console.error('Discord OAuth error:', error);
      return Response.redirect(`${redirectBase}?discord_error=${encodeURIComponent(error)}`, 302);
    }

    if (!code) {
      return Response.redirect(`${redirectBase}?discord_error=no_code`, 302);
    }

    const redirectUri = `${url.origin}${url.pathname}`;

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Discord token exchange failed:', errText);
      return Response.redirect(`${redirectBase}?discord_error=token_failed`, 302);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const meRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!meRes.ok) {
      console.error('Discord /users/@me failed');
      return Response.redirect(`${redirectBase}?discord_error=me_failed`, 302);
    }
    const user = await meRes.json();
    const discordUserId = user.id;

    const addMemberRes = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken }),
      }
    );

    if (!addMemberRes.ok && addMemberRes.status !== 204) {
      const errText = await addMemberRes.text();
      console.error('Discord add member failed:', addMemberRes.status, errText);
      return Response.redirect(`${redirectBase}?discord_error=join_failed`, 302);
    }

    const roleRes = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${DISCORD_ROLE_ID}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!roleRes.ok) {
      const errText = await roleRes.text();
      console.error('Discord assign role failed:', roleRes.status, errText);
    }

    return Response.redirect(`${redirectBase}?discord_joined=1`, 302);
  } catch (e) {
    console.error('discord-join-callback error:', e);
    return Response.redirect(`${SITE_URL}?discord_error=server`, 302);
  }
});
