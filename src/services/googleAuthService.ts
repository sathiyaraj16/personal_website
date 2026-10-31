import type { GoogleTokenData, GoogleUserAccount } from '../types/google';

// Official OAuth 2.0 Scopes (Minimum Required)
export const GOOGLE_SCOPES = {
  PROFILE: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
  DRIVE_READONLY: 'https://www.googleapis.com/auth/drive.readonly',
  // Official Photos Picker API scope (Google 2024/2025 modern requirement)
  PHOTOS_PICKER: 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
  // Optional app-created photos library scope for created albums
  PHOTOS_APPCREATED: 'https://www.googleapis.com/auth/photoslibrary.appendonly',
};

// CRITICAL SECURITY REQUIREMENT:
// "Store tokens securely. Do not put access tokens in localStorage."
// Access tokens are stored ONLY in transient memory closure.
let _inMemoryTokenData: GoogleTokenData | null = null;
let _inMemoryUserAccount: GoogleUserAccount | null = null;

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: { type: string; message?: string }) => void;
          }) => GoogleTokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: string | number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

let gisScriptLoadingPromise: Promise<void> | null = null;

/**
 * Dynamically load Google Identity Services script if not present
 */
export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  if (gisScriptLoadingPromise) {
    return gisScriptLoadingPromise;
  }

  gisScriptLoadingPromise = new Promise((resolve, reject) => {
    // Check if script tag already exists
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services script.')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK.'));
    document.head.appendChild(script);
  });

  return gisScriptLoadingPromise;
}

export const googleAuthService = {
  /**
   * Get configured Google Client ID from environment variables
   */
  getClientId(): string | null {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    if (!clientId || clientId.includes('your-google-client-id')) {
      return null;
    }
    return clientId;
  },

  /**
   * Check if a valid, non-expired access token exists in memory
   */
  hasValidToken(): boolean {
    if (!_inMemoryTokenData?.accessToken) return false;
    // Buffer by 30 seconds to avoid edge-of-expiry race conditions
    return Date.now() < _inMemoryTokenData.expiresAt - 30000;
  },

  /**
   * Get active in-memory access token if valid
   */
  getAccessToken(): string | null {
    if (this.hasValidToken()) {
      return _inMemoryTokenData!.accessToken;
    }
    return null;
  },

  /**
   * Get in-memory token metadata (excluding raw token exposure where possible)
   */
  getTokenMeta(): { expiresAt: number | null; scopes: string[] } {
    return {
      expiresAt: _inMemoryTokenData?.expiresAt ?? null,
      scopes: _inMemoryTokenData?.scopes ?? [],
    };
  },

  /**
   * Check if a specific scope is granted
   */
  hasScope(scope: string): boolean {
    if (!_inMemoryTokenData) return false;
    return _inMemoryTokenData.scopes.some((s) => s.toLowerCase() === scope.toLowerCase());
  },

  /**
   * Get connected account info
   */
  getConnectedAccount(): GoogleUserAccount | null {
    return _inMemoryUserAccount;
  },

  /**
   * Set token directly into memory (useful for developer testing or external token exchange)
   */
  async setTokenInMemory(
    accessToken: string,
    expiresInSeconds: number = 3600,
    scopes: string[] = []
  ): Promise<GoogleUserAccount> {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    _inMemoryTokenData = {
      accessToken,
      expiresAt,
      scopes,
    };

    // Fetch user profile info with the token
    const account = await this.fetchUserProfile(accessToken);
    _inMemoryUserAccount = account;
    return account;
  },

  /**
   * Fetch user identity profile from Google UserInfo endpoint
   */
  async fetchUserProfile(token: string): Promise<GoogleUserAccount> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch Google profile (HTTP ${res.status})`);
      }

      const data = await res.json();
      return {
        id: data.sub || `google-${Date.now()}`,
        email: data.email || 'user@gmail.com',
        name: data.name || data.given_name || 'Google User',
        picture: data.picture,
        connectedAt: new Date().toISOString(),
      };
    } catch {
      // Fallback if userinfo endpoint fails or scopes are minimal
      return {
        id: `google-user-${Date.now()}`,
        email: 'Authorized Google Account',
        name: 'Google Workspace Account',
        connectedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Request authorization from Google using Google Identity Services token client
   */
  async requestGoogleAuthorization(scopes: string[]): Promise<{
    account: GoogleUserAccount | null;
    error: string | null;
  }> {
    const clientId = this.getClientId();
    if (!clientId) {
      return {
        account: null,
        error:
          'Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file or use developer credentials.',
      };
    }

    try {
      await loadGoogleIdentityScript();
    } catch (loadErr) {
      return {
        account: null,
        error: loadErr instanceof Error ? loadErr.message : 'Could not initialize Google Identity Services.',
      };
    }

    if (!window.google?.accounts?.oauth2) {
      return {
        account: null,
        error: 'Google OAuth client library could not be loaded.',
      };
    }

    // Always include profile scopes for account identity display
    const mergedScopes = Array.from(
      new Set([
        ...GOOGLE_SCOPES.PROFILE.split(' '),
        ...scopes,
      ])
    ).join(' ');

    return new Promise((resolve) => {
      let isResolved = false;

      const client = window.google!.accounts!.oauth2!.initTokenClient({
        client_id: clientId,
        scope: mergedScopes,
        callback: async (response: GoogleTokenResponse) => {
          if (isResolved) return;
          isResolved = true;

          if (response.error) {
            resolve({
              account: null,
              error: response.error_description || response.error || 'Google authorization was denied.',
            });
            return;
          }

          if (!response.access_token) {
            resolve({
              account: null,
              error: 'No access token received from Google.',
            });
            return;
          }

          const expiresIn = Number(response.expires_in) || 3599;
          const grantedScopes = (response.scope || mergedScopes).split(' ').filter(Boolean);

          try {
            const account = await this.setTokenInMemory(response.access_token, expiresIn, grantedScopes);
            resolve({
              account,
              error: null,
            });
          } catch (profileErr) {
            resolve({
              account: _inMemoryUserAccount,
              error: profileErr instanceof Error ? profileErr.message : null,
            });
          }
        },
        error_callback: (err) => {
          if (isResolved) return;
          isResolved = true;

          if (err.type === 'popup_closed') {
            resolve({
              account: null,
              error: 'OAuth popup was closed before completing authorization.',
            });
            return;
          }

          resolve({
            account: null,
            error: err.message || `Google authorization error (${err.type}).`,
          });
        },
      });

      // Trigger OAuth consent popup
      client.requestAccessToken({ prompt: 'consent' });
    });
  },

  /**
   * Disconnect and revoke token from memory
   */
  async disconnect(): Promise<void> {
    const token = _inMemoryTokenData?.accessToken;
    if (token && window.google?.accounts?.oauth2?.revoke) {
      try {
        await new Promise<void>((resolve) => {
          window.google!.accounts!.oauth2!.revoke(token, () => resolve());
        });
      } catch {
        // Continue clearing local state regardless of revocation network response
      }
    }

    // Wipe token and account strictly from in-memory references
    _inMemoryTokenData = null;
    _inMemoryUserAccount = null;
  },
};
