import type { GoogleDriveFile, DriveFilterType } from '../types/google';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

export interface ListFilesResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string;
  error?: string;
}

export const googleDriveService = {
  /**
   * Build the search query string for Google Drive v3 API
   */
  buildDriveQuery(options: {
    folderId?: string;
    searchQuery?: string;
    filterType?: DriveFilterType;
  }): string {
    const parts: string[] = ['trashed = false'];

    if (options.searchQuery?.trim()) {
      const sanitized = options.searchQuery.trim().replace(/['\\]/g, '');
      parts.push(`name contains '${sanitized}'`);
    } else {
      const parentId = options.folderId || 'root';
      parts.push(`'${parentId}' in parents`);
    }

    if (options.filterType && options.filterType !== 'all') {
      switch (options.filterType) {
        case 'folders':
          parts.push("mimeType = 'application/vnd.google-apps.folder'");
          break;
        case 'documents':
          parts.push(
            "(mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/pdf' or mimeType contains 'text/' or mimeType contains 'msword' or mimeType contains 'wordprocessingml')"
          );
          break;
        case 'spreadsheets':
          parts.push(
            "(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType contains 'spreadsheet' or mimeType contains 'sheet' or mimeType contains 'excel')"
          );
          break;
        case 'presentations':
          parts.push(
            "(mimeType = 'application/vnd.google-apps.presentation' or mimeType contains 'presentation' or mimeType contains 'powerpoint')"
          );
          break;
        case 'pdfs':
          parts.push("mimeType = 'application/pdf'");
          break;
        case 'images':
          parts.push("mimeType contains 'image/'");
          break;
        case 'videos':
          parts.push("mimeType contains 'video/'");
          break;
      }
    }

    return parts.join(' and ');
  },

  /**
   * List files and folders from Google Drive API v3
   */
  async listFiles(
    accessToken: string,
    options: {
      folderId?: string;
      searchQuery?: string;
      filterType?: DriveFilterType;
      pageSize?: number;
      pageToken?: string;
    } = {}
  ): Promise<ListFilesResponse> {
    try {
      const query = this.buildDriveQuery(options);
      const fields =
        'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink, webContentLink, iconLink, thumbnailLink, parents, owners, starred, shared, fileExtension)';
      const pageSize = options.pageSize || 30;

      const params = new URLSearchParams({
        q: query,
        fields,
        pageSize: pageSize.toString(),
        orderBy: 'folder,name asc',
        spaces: 'drive',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
      });

      if (options.pageToken) {
        params.append('pageToken', options.pageToken);
      }

      const res = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message =
          errorData.error?.message || `Google Drive API error (HTTP ${res.status}): ${res.statusText}`;
        return { files: [], error: message };
      }

      const data = await res.json();
      return {
        files: data.files || [],
        nextPageToken: data.nextPageToken,
      };
    } catch (err) {
      return {
        files: [],
        error: err instanceof Error ? err.message : 'Failed to communicate with Google Drive API.',
      };
    }
  },

  /**
   * Fetch a single file or folder metadata
   */
  async getFileMetadata(
    accessToken: string,
    fileId: string
  ): Promise<{ file: GoogleDriveFile | null; error: string | null }> {
    try {
      const fields =
        'id, name, mimeType, modifiedTime, size, webViewLink, webContentLink, iconLink, thumbnailLink, parents, owners, starred, shared, fileExtension';
      const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?fields=${fields}&supportsAllDrives=true`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          file: null,
          error: errorData.error?.message || `Failed to fetch file details (HTTP ${res.status})`,
        };
      }

      const file = await res.json();
      return { file, error: null };
    } catch (err) {
      return {
        file: null,
        error: err instanceof Error ? err.message : 'Error retrieving file metadata.',
      };
    }
  },

  /**
   * Retrieve file binary content as a Blob using authenticated Google Drive API
   */
  async getFileBlob(
    accessToken: string,
    fileId: string,
    mimeType: string,
    onProgress?: (loaded: number, total: number) => void,
    signal?: AbortSignal
  ): Promise<{ blob: Blob | null; error: string | null; isAuthError?: boolean }> {
    try {
      let downloadUrl = `${DRIVE_API_BASE}/files/${fileId}?alt=media&supportsAllDrives=true`;

      // If Google Docs/Sheets/Slides, use export endpoint to retrieve PDF
      if (
        mimeType === 'application/vnd.google-apps.document' ||
        mimeType === 'application/vnd.google-apps.spreadsheet' ||
        mimeType === 'application/vnd.google-apps.presentation'
      ) {
        downloadUrl = `${DRIVE_API_BASE}/files/${fileId}/export?mimeType=application/pdf`;
      }

      const res = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const rawMessage = errorData.error?.message || '';

        const isAuthError =
          res.status === 401 ||
          res.status === 403 ||
          rawMessage.toLowerCase().includes('insufficient') ||
          rawMessage.toLowerCase().includes('permission');

        return {
          blob: null,
          error:
            rawMessage ||
            `Failed to load file content from Google Drive (HTTP ${res.status}: ${res.statusText})`,
          isAuthError,
        };
      }

      // If onProgress is supplied and streaming is available, stream with progress
      if (onProgress && res.body) {
        const contentLength = res.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let loaded = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.length;
            onProgress(loaded, total);
          }
        }

        const blob = new Blob(chunks as unknown as BlobPart[], { type: mimeType });
        return { blob, error: null };
      }

      const blob = await res.blob();
      return { blob, error: null };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { blob: null, error: 'Request was cancelled.' };
      }
      return {
        blob: null,
        error: err instanceof Error ? err.message : 'Network error downloading file stream.',
      };
    }
  },

  /**
   * Retrieve text file content for code / txt / csv preview
   */
  async getFileText(
    accessToken: string,
    fileId: string
  ): Promise<{ text: string | null; error: string | null; isAuthError?: boolean }> {
    try {
      const { blob, error, isAuthError } = await this.getFileBlob(accessToken, fileId, 'text/plain');
      if (error || !blob) {
        return { text: null, error: error || 'Failed to retrieve text content.', isAuthError };
      }
      const text = await blob.text();
      return { text, error: null };
    } catch (err) {
      return {
        text: null,
        error: err instanceof Error ? err.message : 'Error reading file text content.',
      };
    }
  },

  /**
   * Download a file from Google Drive upon explicit user action
   */
  async downloadFile(
    accessToken: string,
    file: GoogleDriveFile
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Determine if file is a native Google Doc/Sheet/Slide or standard binary file
      let downloadUrl = `${DRIVE_API_BASE}/files/${file.id}?alt=media`;
      let downloadFilename = file.name;

      if (file.mimeType === 'application/vnd.google-apps.document') {
        downloadUrl = `${DRIVE_API_BASE}/files/${file.id}/export?mimeType=application/pdf`;
        if (!downloadFilename.toLowerCase().endsWith('.pdf')) {
          downloadFilename += '.pdf';
        }
      } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
        downloadUrl = `${DRIVE_API_BASE}/files/${file.id}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
        if (!downloadFilename.toLowerCase().endsWith('.xlsx')) {
          downloadFilename += '.xlsx';
        }
      } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
        downloadUrl = `${DRIVE_API_BASE}/files/${file.id}/export?mimeType=application/pdf`;
        if (!downloadFilename.toLowerCase().endsWith('.pdf')) {
          downloadFilename += '.pdf';
        }
      }

      const res = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `Download failed (HTTP ${res.status})`,
        };
      }

      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = objectUrl;
      tempLink.download = downloadFilename;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(objectUrl);

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to download file.',
      };
    }
  },

  /**
   * Format bytes to readable string (e.g. 1.2 MB)
   */
  formatFileSize(bytes?: string | number): string {
    if (!bytes) return '—';
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(num) || num === 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(num) / Math.log(1024));
    return `${(num / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  },

  /**
   * Format ISO date string to user-friendly format
   */
  formatDate(isoDate?: string): string {
    if (!isoDate) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoDate));
    } catch {
      return isoDate;
    }
  },

  /**
   * Determine icon / badge type based on mimeType
   */
  getFileTypeCategory(mimeType: string): DriveFilterType {
    if (mimeType === 'application/vnd.google-apps.folder') return 'folders';
    if (mimeType.includes('image/')) return 'images';
    if (mimeType.includes('video/')) return 'videos';
    if (mimeType === 'application/pdf') return 'pdfs';
    if (
      mimeType.includes('spreadsheet') ||
      mimeType.includes('sheet') ||
      mimeType.includes('excel') ||
      mimeType === 'application/vnd.google-apps.spreadsheet'
    ) {
      return 'spreadsheets';
    }
    if (
      mimeType.includes('presentation') ||
      mimeType.includes('powerpoint') ||
      mimeType === 'application/vnd.google-apps.presentation'
    ) {
      return 'presentations';
    }
    if (
      mimeType.includes('document') ||
      mimeType.includes('word') ||
      mimeType.includes('text/') ||
      mimeType === 'application/vnd.google-apps.document'
    ) {
      return 'documents';
    }
    return 'all';
  },
};
