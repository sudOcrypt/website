# Discord "Join our server" OAuth2 callback

When a user clicks "Discord" in the nav (with join flow enabled), they are sent to Discord OAuth2 with `guilds.join` scope. Discord redirects here with `?code=...`. This function:

1. Exchanges the code for an access token
2. Adds the user to your Discord server (PUT /guilds/{id}/members/{id})
3. Assigns the role (same as assign-discord-role)
4. Redirects back to your site with `?discord_joined=1`

## Required secrets (Supabase Edge Function secrets)

- `DISCORD_CLIENT_ID` – Discord Application (client) ID (same app as the bot)
- `DISCORD_CLIENT_SECRET` – Discord Application client secret (OAuth2)
- `DISCORD_BOT_TOKEN` – Bot token (same as assign-discord-role)
- `DISCORD_GUILD_ID` – Your server ID
- `DISCORD_ROLE_ID` – Role to assign
- `SITE_URL` – (optional) Where to redirect after success, e.g. `https://donutmc.store`

## Discord Developer Portal

1. **Redirects** (OAuth2 → Redirects): add exactly  
   `https://YOUR_PROJECT_REF.supabase.co/functions/v1/discord-join-callback`  
   (replace YOUR_PROJECT_REF with your Supabase project ref, e.g. `shyzfsqvxcbmvrheqkqq`)

2. **Bot** must be in the server with **Manage Roles** (and role above the one you assign).

## Frontend

In your app `.env` set:

- `VITE_DISCORD_APPLICATION_ID` – same as Discord Application (client) ID

If this is set, the "Discord" nav link uses the join flow. Otherwise it falls back to your static invite link.
