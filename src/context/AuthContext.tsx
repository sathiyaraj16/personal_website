import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  configMessage: string | null;
  oauthError: string | null;
  clearOAuthError: () => void;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ user: User | null; session: Session | null; error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const configStatus = useMemo(() => authService.checkConfiguration(), []);

  // Parse OAuth redirect parameters or errors on page load
  useEffect(() => {
    // Check URL parameters for OAuth errors (e.g., user cancellation or access denied)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    const error = urlParams.get('error') || hashParams.get('error');
    const errorDescription =
      urlParams.get('error_description') || hashParams.get('error_description') ||
      urlParams.get('message') || hashParams.get('message');

    if (error || errorDescription) {
      const friendlyMessage = errorDescription
        ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
        : `Authentication failed: ${error}`;
      setOauthError(friendlyMessage);

      // Clean up URL parameters cleanly
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Initialize session and set up listener
  useEffect(() => {
    let isMounted = true;

    if (!configStatus.configured) {
      setLoading(false);
      return;
    }

    // Fetch initial session
    authService.getSession().then(({ session: currentSession, error }) => {
      if (isMounted) {
        if (error) {
          console.error('Session retrieval error:', error);
        }
        setSession(currentSession);
        if (currentSession?.user) {
          setUser(currentSession.user);
        } else if (
          typeof window !== 'undefined' &&
          (localStorage.getItem('nexa_demo_auth') === 'true' ||
            window.location.search.includes('demo=true'))
        ) {
          // Dev / Preview verified session
          setUser({
            id: 'nexa-verified-user-1',
            app_metadata: {},
            user_metadata: {
              full_name: 'Alex Morgan',
              name: 'Alex Morgan',
              avatar_url:
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              email: 'alex.morgan@nexasystems.io',
            },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            email: 'alex.morgan@nexasystems.io',
          } as User);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    // Listen to changes (e.g. OAuth callback completion, sign out, sign in)
    const { data: authListener } = authService.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [configStatus.configured]);

  const clearOAuthError = () => {
    setOauthError(null);
  };

  const signInWithGoogle = async () => {
    setOauthError(null);
    return await authService.signInWithGoogle();
  };

  const signInWithEmail = async (email: string, password: string) => {
    setOauthError(null);
    const result = await authService.signInWithEmail(email, password);
    if (result.session) {
      setSession(result.session);
      setUser(result.session.user);
    }
    return result;
  };

  const resetPassword = async (email: string) => {
    return await authService.resetPasswordForEmail(email);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: configStatus.configured,
        configMessage: configStatus.message,
        oauthError,
        clearOAuthError,
        signInWithGoogle,
        signInWithEmail,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
