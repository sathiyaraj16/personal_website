import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { GoogleUserAccount, GoogleAuthState } from '../types/google';
import { googleAuthService, GOOGLE_SCOPES } from '../services/googleAuthService';

interface GoogleAuthContextType extends GoogleAuthState {
  clientId: string | null;
  isClientIdConfigured: boolean;
  isTokenExpired: boolean;
  connect: (additionalScopes?: string[]) => Promise<boolean>;
  disconnect: () => Promise<void>;
  getValidAccessToken: () => Promise<string | null>;
  hasScope: (scope: string) => boolean;
  clearError: () => void;
  connectWithManualToken: (token: string, expiresIn?: number, scopes?: string[]) => Promise<boolean>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<GoogleUserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [grantedScopes, setGrantedScopes] = useState<string[]>([]);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);

  const clientId = useMemo(() => googleAuthService.getClientId(), []);
  const isClientIdConfigured = Boolean(clientId);

  const isConnected = Boolean(account && tokenExpiresAt && Date.now() < tokenExpiresAt);
  const isTokenExpired = Boolean(tokenExpiresAt && Date.now() >= tokenExpiresAt);

  // Clear in-memory token on window unload to prevent memory retention across sessions
  useEffect(() => {
    const handleUnload = () => {
      googleAuthService.disconnect();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const connect = useCallback(
    async (additionalScopes: string[] = []): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const scopesToRequest = [
          GOOGLE_SCOPES.DRIVE_READONLY,
          GOOGLE_SCOPES.PHOTOS_PICKER,
          ...additionalScopes,
        ];

        const result = await googleAuthService.requestGoogleAuthorization(scopesToRequest);

        if (result.error) {
          setError(result.error);
          setIsLoading(false);
          return false;
        }

        if (result.account) {
          setAccount(result.account);
          const meta = googleAuthService.getTokenMeta();
          setGrantedScopes(meta.scopes);
          setTokenExpiresAt(meta.expiresAt);
          setIsLoading(false);
          return true;
        }

        setIsLoading(false);
        return false;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'An error occurred during Google authorization.';
        setError(msg);
        setIsLoading(false);
        return false;
      }
    },
    []
  );

  const connectWithManualToken = useCallback(
    async (token: string, expiresInSeconds = 3600, scopes: string[] = []): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const effectiveScopes = scopes.length > 0 ? scopes : [
          GOOGLE_SCOPES.DRIVE_READONLY,
          GOOGLE_SCOPES.PHOTOS_PICKER,
          GOOGLE_SCOPES.PHOTOS_APPCREATED,
        ];

        const userAccount = await googleAuthService.setTokenInMemory(
          token.trim(),
          expiresInSeconds,
          effectiveScopes
        );

        setAccount(userAccount);
        const meta = googleAuthService.getTokenMeta();
        setGrantedScopes(meta.scopes);
        setTokenExpiresAt(meta.expiresAt);
        setIsLoading(false);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect with provided token.');
        setIsLoading(false);
        return false;
      }
    },
    []
  );

  const disconnect = useCallback(async () => {
    setIsLoading(true);
    try {
      await googleAuthService.disconnect();
      setAccount(null);
      setGrantedScopes([]);
      setTokenExpiresAt(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    if (googleAuthService.hasValidToken()) {
      return googleAuthService.getAccessToken();
    }

    if (tokenExpiresAt && Date.now() >= tokenExpiresAt) {
      setError('Google access token has expired. Please re-authenticate your Google Account.');
    }

    return null;
  }, [tokenExpiresAt]);

  const hasScope = useCallback((scope: string): boolean => {
    return googleAuthService.hasScope(scope);
  }, []);

  return (
    <GoogleAuthContext.Provider
      value={{
        account,
        isConnected,
        isLoading,
        error,
        grantedScopes,
        tokenExpiresAt,
        clientId,
        isClientIdConfigured,
        isTokenExpired,
        connect,
        disconnect,
        getValidAccessToken,
        hasScope,
        clearError,
        connectWithManualToken,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = (): GoogleAuthContextType => {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};
