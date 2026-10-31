export interface GoogleUserAccount {
  id: string;
  email: string;
  name: string;
  picture?: string;
  connectedAt: string;
}

export interface GoogleTokenData {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
  scopes: string[];
}

export interface GoogleAuthState {
  account: GoogleUserAccount | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  grantedScopes: string[];
  tokenExpiresAt: number | null;
}

// Google Drive API v3 Types
export interface GoogleDriveOwner {
  displayName?: string;
  emailAddress?: string;
  photoLink?: string;
  me?: boolean;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  owners?: GoogleDriveOwner[];
  starred?: boolean;
  shared?: boolean;
  fileExtension?: string;
}

export type DriveFilterType =
  | 'all'
  | 'folders'
  | 'documents'
  | 'spreadsheets'
  | 'presentations'
  | 'pdfs'
  | 'images'
  | 'videos';

// Google Photos API Types (Picker API & Library API)
export interface GooglePhotosMediaMetadata {
  width?: string | number;
  height?: string | number;
  creationTime?: string;
  photo?: {
    cameraMake?: string;
    cameraModel?: string;
    focalLength?: number;
    apertureFNumber?: number;
    isoEquivalent?: number;
  };
}

export interface GooglePhotosItem {
  id: string;
  filename: string;
  baseUrl: string;
  mimeType: string;
  createTime?: string;
  mediaMetadata?: GooglePhotosMediaMetadata;
  type?: 'PHOTO' | 'VIDEO';
  productUrl?: string;
  description?: string;
  sessionId?: string;
  blobUrl?: string;
}

export interface GooglePhotosAlbum {
  id: string;
  title: string;
  productUrl?: string;
  mediaItemsCount?: string;
  coverPhotoBaseUrl?: string;
  coverPhotoMediaItemId?: string;
}

export interface GooglePickerSession {
  id: string;
  pickerUri: string;
  expireTime: string;
  mediaItemsSet: boolean;
  pollingConfig?: {
    pollInterval: string;
    timeoutIn: string;
  };
}
