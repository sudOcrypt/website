/**
 * Builds the Discord OAuth2 URL for "Join our Discord" flow.
 * User authorizes with guilds.join, then our Edge Function adds them to the server and assigns the role.
 * Requires VITE_DISCORD_APPLICATION_ID and uses VITE_SUPABASE_URL for redirect.
 */
export function getJoinDiscordUrl(): string | null {
  const clientId = import.meta.env.VITE_DISCORD_APPLICATION_ID;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!clientId || !supabaseUrl) return null;
  const redirectUri = `${supabaseUrl}/functions/v1/discord-join-callback`;
  const state = encodeURIComponent(window.location.origin);
  const scope = encodeURIComponent('identify guilds.join');
  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;
}
