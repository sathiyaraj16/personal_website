import { supabase, isSupabaseConfigured, getSupabaseConfigStatus } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export const authService = {
  /**
   * Check if Supabase authentication is ready to be used
   */
  checkConfiguration(): { configured: boolean; message: string | null } {
    return getSupabaseConfigStatus();
  },

  /**
   * Trigger Google OAuth sign-in with account chooser prompt
   */
  async signInWithGoogle(): Promise<{ error: Error | null }> {
    const status = getSupabaseConfigStatus();
    if (!status.configured) {
      return {
        error: new Error(status.message || 'Supabase credentials are not configured.'),
      };
    }

    try {
      const redirectUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('An unexpected error occurred during Google sign in.'),
      };
    }
  },

  /**
   * Sign in using email and password
   */
  async signInWithEmail(email: string, password: string): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
    const status = getSupabaseConfigStatus();
    if (!status.configured) {
      return {
        user: null,
        session: null,
        error: new Error(status.message || 'Supabase credentials are not configured.'),
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { user: null, session: null, error };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (err: unknown) {
      return {
        user: null,
        session: null,
        error: err instanceof Error ? err : new Error('An unexpected error occurred during email sign in.'),
      };
    }
  },

  /**
   * Send password recovery email via Supabase
   */
  async resetPasswordForEmail(email: string): Promise<{ error: Error | null }> {
    const status = getSupabaseConfigStatus();
    if (!status.configured) {
      return {
        error: new Error(status.message || 'Supabase credentials are not configured.'),
      };
    }

    try {
      const redirectUrl = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('Failed to send password recovery email.'),
      };
    }
  },

  /**
   * Sign out current user session
   */
  async signOut(): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error: error || null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('Failed to sign out.'),
      };
    }
  },

  /**
   * Retrieve active session
   */
  async getSession(): Promise<{ session: Session | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { session: null, error: null };
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      return { session: data.session, error: error || null };
    } catch (err: unknown) {
      return {
        session: null,
        error: err instanceof Error ? err : new Error('Failed to retrieve session.'),
      };
    }
  },

  /**
   * Subscribe to auth changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!isSupabaseConfigured) {
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    }

    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};
