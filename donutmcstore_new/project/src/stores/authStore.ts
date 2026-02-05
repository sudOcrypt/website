import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '../types/database';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isBanned: boolean;
  initialize: () => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkBanStatus: (userId: string, discordId: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isBanned: false,

  checkBanStatus: async (userId: string, discordId: string) => {
    try {
      const { data: bans, error } = await supabase
        .from('bans')
        .select('*')
        .in('ban_value', [userId, discordId])
        .or('expires_at.is.null,expires_at.gt.now()');

      if (error) {
        console.error('Error checking ban status:', error);
        return false;
      }

      return (bans && bans.length > 0) || false;
    } catch (error) {
      console.error('Error checking ban status:', error);
      return false;
    }
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          const banned = await get().checkBanStatus(profile.id, profile.discord_id);
          set({ user: profile, isAuthenticated: true, isLoading: false, isBanned: banned });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false, isBanned: false });
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false, isBanned: false });
      }

      supabase.auth.onAuthStateChange((event, session) => {
        (async () => {
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
            const discordMeta = session.user.user_metadata;

            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (!existingUser) {
              const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                  id: session.user.id,
                  discord_id: discordMeta.provider_id || discordMeta.sub,
                  discord_username: discordMeta.full_name || discordMeta.name || discordMeta.custom_claims?.global_name || 'Unknown',
                  discord_avatar: discordMeta.avatar_url,
                  email: session.user.email || null,
                })
                .select()
                .single();

              if (!error && newUser) {
                let ipAddress = null;
                let isVpnSuspected = false;
                let ispOrg = null;
                try {
                  const ipResponse = await fetch('https://api.ipify.org?format=json');
                  const ipData = await ipResponse.json();
                  ipAddress = ipData.ip;
                } catch (error) {
                }

                await supabase.from('login_logs').insert({
                  user_id: session.user.id,
                  ip_address: ipAddress,
                  user_agent: navigator.userAgent,
                  is_vpn_suspected: isVpnSuspected,
                  isp_org: ispOrg,
                });

                await supabase.from('users').update({
                  last_ip_address: ipAddress,
                  last_login_at: new Date().toISOString(),
                  is_vpn_user: isVpnSuspected,
                  isp_organization: ispOrg,
                }).eq('id', session.user.id);
                
                try {
                  await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assign-discord-role`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                    body: JSON.stringify({ discord_id: newUser.discord_id }),
                  });
                } catch (error) {
                }
                
                const banned = await get().checkBanStatus(newUser.id, newUser.discord_id);
                set({ user: newUser, isAuthenticated: true, isBanned: banned });
              }
            } else {
              await supabase
                .from('users')
                .update({
                  discord_username: discordMeta.full_name || discordMeta.name || existingUser.discord_username,
                  discord_avatar: discordMeta.avatar_url || existingUser.discord_avatar,
                  email: session.user.email ?? existingUser.email,
                })
                .eq('id', session.user.id);

              let ipAddress = null;
              let isVpnSuspected = false;
              let ispOrg = null;
              try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                ipAddress = ipData.ip;
              } catch (error) {
              }

                await supabase.from('login_logs').insert({
                  user_id: session.user.id,
                  ip_address: ipAddress,
                  user_agent: navigator.userAgent,
                  is_vpn_suspected: isVpnSuspected,
                  isp_org: ispOrg,
                });

                await supabase.from('users').update({
                  last_ip_address: ipAddress,
                  last_login_at: new Date().toISOString(),
                  is_vpn_user: isVpnSuspected,
                  isp_organization: ispOrg,
                }).eq('id', session.user.id);

              const { data: updatedUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

              const banned = await get().checkBanStatus(updatedUser.id, updatedUser.discord_id);
              set({ user: updatedUser, isAuthenticated: true, isBanned: banned });
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isAuthenticated: false, isBanned: false });
          }
        })();
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  signInWithDiscord: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin,
      },
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isBanned: false });
  },

  refreshUser: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        const banned = await get().checkBanStatus(profile.id, profile.discord_id);
        set({ user: profile, isAuthenticated: true, isBanned: banned });
      }
    }
  },
}));
