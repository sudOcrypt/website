import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '../types/database';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

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
          set({ user: profile, isAuthenticated: true, isLoading: false });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }

      supabase.auth.onAuthStateChange((event, session) => {
        (async () => {
          if (event === 'SIGNED_IN' && session?.user) {
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
                })
                .select()
                .single();

              if (!error && newUser) {
                await supabase.from('login_logs').insert({
                  user_id: session.user.id,
                  user_agent: navigator.userAgent,
                });
                set({ user: newUser, isAuthenticated: true });
              }
            } else {
              await supabase
                .from('users')
                .update({
                  discord_username: discordMeta.full_name || discordMeta.name || existingUser.discord_username,
                  discord_avatar: discordMeta.avatar_url || existingUser.discord_avatar,
                })
                .eq('id', session.user.id);

              await supabase.from('login_logs').insert({
                user_id: session.user.id,
                user_agent: navigator.userAgent,
              });

              const { data: updatedUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

              set({ user: updatedUser, isAuthenticated: true });
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isAuthenticated: false });
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
    set({ user: null, isAuthenticated: false });
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
        set({ user: profile, isAuthenticated: true });
      }
    }
  },
}));
