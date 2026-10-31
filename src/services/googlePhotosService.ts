import type {
  GooglePhotosItem,
  GooglePhotosAlbum,
  GooglePickerSession,
} from '../types/google';

const PICKER_API_BASE = 'https://photospicker.googleapis.com/v1';
const LIBRARY_API_BASE = 'https://photoslibrary.googleapis.com/v1';

// In-memory cache for authenticated image Blob URLs to avoid redundant network roundtrips
const _blobUrlCache = new Map<string, string>();

export interface PhotosListResponse {
  items: GooglePhotosItem[];
  nextPageToken?: string;
  error?: string;
  isRestrictedNotice?: boolean;
}

export interface AlbumsListResponse {
  albums: GooglePhotosAlbum[];
  nextPageToken?: string;
  error?: string;
}

export const googlePhotosService = {
  /**
   * Explanation of Google Photos 2024/2025 API Architecture & Privacy Policies
   */
  getPolicyNotice(): string {
    return 'As of Google’s Photos API Policy Update, broad unrestricted library access (photoslibrary.readonly) has been sunset. NEXA integrates with the official Google Photos Picker API (photospicker.mediaitems.readonly), enabling secure, consented selection of albums and photos without exposing your entire personal library.';
  },

  /**
   * Initialize a new Google Photos Picker Session
   * POST https://photospicker.googleapis.com/v1/sessions
   */
  async createPickerSession(
    accessToken: string
  ): Promise<{ session: GooglePickerSession | null; error: string | null }> {
    try {
      const res = await fetch(`${PICKER_API_BASE}/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message =
          errorData.error?.message ||
          `Photos Picker API returned HTTP ${res.status}: ${res.statusText}`;
        return { session: null, error: message };
      }

      const data = await res.json();
      return {
        session: {
          id: data.id,
          pickerUri: data.pickerUri,
          expireTime: data.expireTime,
          mediaItemsSet: Boolean(data.mediaItemsSet),
          pollingConfig: data.pollingConfig,
        },
        error: null,
      };
    } catch (err) {
      return {
        session: null,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to initiate Google Photos Picker session.',
      };
    }
  },

  /**
   * Poll a Google Photos Picker Session to check if user finished selection
   * GET https://photospicker.googleapis.com/v1/sessions/{sessionId}
   */
  async getPickerSession(
    accessToken: string,
    sessionId: string
  ): Promise<{ session: GooglePickerSession | null; error: string | null }> {
    try {
      const res = await fetch(`${PICKER_API_BASE}/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          session: null,
          error:
            errorData.error?.message ||
            `Failed to poll picker session (HTTP ${res.status})`,
        };
      }

      const data = await res.json();
      return {
        session: {
          id: data.id,
          pickerUri: data.pickerUri,
          expireTime: data.expireTime,
          mediaItemsSet: Boolean(data.mediaItemsSet),
          pollingConfig: data.pollingConfig,
        },
        error: null,
      };
    } catch (err) {
      return {
        session: null,
        error: err instanceof Error ? err.message : 'Error polling picker session.',
      };
    }
  },

  /**
   * List media items selected via a Google Photos Picker session
   * GET https://photospicker.googleapis.com/v1/mediaItems?sessionId={sessionId}
   */
  async listPickerMediaItems(
    accessToken: string,
    sessionId: string,
    pageToken?: string
  ): Promise<PhotosListResponse> {
    try {
      const params = new URLSearchParams({
        sessionId,
        pageSize: '50',
      });
      if (pageToken) params.append('pageToken', pageToken);

      const res = await fetch(`${PICKER_API_BASE}/mediaItems?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          items: [],
          error:
            errorData.error?.message ||
            `Failed to list picked media items (HTTP ${res.status})`,
        };
      }

      const data = await res.json();
      const rawItems = data.mediaItems || [];

      // Normalize Picker API media item shape
      const items: GooglePhotosItem[] = rawItems.map((item: any) => ({
        id: item.id,
        filename: item.mediaFile?.filename || item.filename || `Photo_${item.id.slice(0, 8)}.jpg`,
        baseUrl: item.mediaFile?.baseUrl || item.baseUrl || '',
        mimeType: item.mediaFile?.mimeType || item.mimeType || 'image/jpeg',
        createTime: item.createTime,
        type: item.type || 'PHOTO',
        sessionId,
        mediaMetadata: {
          width: item.mediaFile?.mediaFileMetadata?.width,
          height: item.mediaFile?.mediaFileMetadata?.height,
          creationTime: item.createTime,
        },
      }));

      return {
        items,
        nextPageToken: data.nextPageToken,
      };
    } catch (err) {
      return {
        items: [],
        error:
          err instanceof Error
            ? err.message
            : 'Failed to retrieve media items from picker.',
      };
    }
  },

  /**
   * Delete picker session after selection has completed
   */
  async deletePickerSession(accessToken: string, sessionId: string): Promise<void> {
    try {
      await fetch(`${PICKER_API_BASE}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      // Ignore background cleanup failures
    }
  },

  /**
   * Query Library API for app-created media items or legacy albums
   * (Handles Google 403 API restriction gracefully if full library access is requested)
   */
  async listAppCreatedMediaItems(
    accessToken: string,
    pageToken?: string
  ): Promise<PhotosListResponse> {
    try {
      const params = new URLSearchParams({ pageSize: '50' });
      if (pageToken) params.append('pageToken', pageToken);

      const res = await fetch(`${LIBRARY_API_BASE}/mediaItems?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const rawMessage = errorData.error?.message || '';

        // Check if error is due to sunset of photoslibrary.readonly
        const isRestricted =
          res.status === 403 ||
          rawMessage.toLowerCase().includes('insufficient authentication scopes') ||
          rawMessage.toLowerCase().includes('permission denied');

        return {
          items: [],
          error: isRestricted
            ? 'Google Photos Library direct listing is restricted by Google Developer Policy. Use the "Select Photos from Google" button to import your photos via the Google Photos Picker API.'
            : rawMessage || `Google Photos API error (HTTP ${res.status})`,
          isRestrictedNotice: isRestricted,
        };
      }

      const data = await res.json();
      return {
        items: data.mediaItems || [],
        nextPageToken: data.nextPageToken,
      };
    } catch (err) {
      return {
        items: [],
        error: err instanceof Error ? err.message : 'Error communicating with Google Photos Library API.',
      };
    }
  },

  /**
   * List Google Photos Albums (app-created or accessible)
   */
  async listAlbums(
    accessToken: string,
    pageToken?: string
  ): Promise<AlbumsListResponse> {
    try {
      const params = new URLSearchParams({ pageSize: '30' });
      if (pageToken) params.append('pageToken', pageToken);

      const res = await fetch(`${LIBRARY_API_BASE}/albums?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          albums: [],
          error:
            errorData.error?.message ||
            `Google Photos Albums API returned HTTP ${res.status}`,
        };
      }

      const data = await res.json();
      return {
        albums: data.albums || [],
        nextPageToken: data.nextPageToken,
      };
    } catch (err) {
      return {
        albums: [],
        error: err instanceof Error ? err.message : 'Error listing albums.',
      };
    }
  },

  /**
   * Helper to format image thumbnail URL with optimal size parameters
   */
  getImageUrl(baseUrl: string, width = 600, height = 600, crop = true): string {
    if (!baseUrl) return '';
    // Append official Google Photos sizing parameters
    return `${baseUrl}=w${width}-h${height}${crop ? '-c' : ''}`;
  },

  /**
   * Helper to format high-resolution full preview URL
   */
  getFullSizeUrl(baseUrl: string): string {
    if (!baseUrl) return '';
    return `${baseUrl}=w2048-h2048`;
  },

  /**
   * Fetch image bytes with Authorization Bearer header and return an in-memory Blob URL.
   * Resolves the 401 Unauthorized / broken thumbnail issue with the Google Photos Picker API.
   */
  async fetchPhotoImageBlob(
    accessToken: string,
    baseUrl: string,
    width = 600,
    height = 600,
    crop = true
  ): Promise<{ blobUrl: string | null; error: string | null; isExpired?: boolean }> {
    if (!baseUrl) {
      return { blobUrl: null, error: 'No baseUrl provided.' };
    }

    const cacheKey = `${baseUrl}_${width}_${height}_${crop}`;
    if (_blobUrlCache.has(cacheKey)) {
      return { blobUrl: _blobUrlCache.get(cacheKey)!, error: null };
    }

    try {
      const finalUrl = this.getImageUrl(baseUrl, width, height, crop);
      const res = await fetch(finalUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const isExpired = res.status === 401 || res.status === 403 || res.status === 404;
        return {
          blobUrl: null,
          error: isExpired
            ? 'Photo URL expired or authorization required. Re-sync your photos.'
            : `Failed to load photo (HTTP ${res.status})`,
          isExpired,
        };
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      _blobUrlCache.set(cacheKey, objectUrl);

      return { blobUrl: objectUrl, error: null };
    } catch (err) {
      return {
        blobUrl: null,
        error: err instanceof Error ? err.message : 'Network error downloading photo.',
      };
    }
  },

  /**
   * Download a photo file directly using the authenticated Bearer token
   */
  async downloadPhoto(accessToken: string, baseUrl: string, filename: string): Promise<void> {
    try {
      const downloadUrl = `${baseUrl}=d`;
      const res = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Download failed (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = objectUrl;
      tempLink.download = filename;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Failed to download photo:', err);
    }
  },

  /**
   * Revoke all in-memory Blob URLs and clear cache
   */
  revokeBlobCache(): void {
    for (const url of _blobUrlCache.values()) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore revocation errors
      }
    }
    _blobUrlCache.clear();
  },
};
