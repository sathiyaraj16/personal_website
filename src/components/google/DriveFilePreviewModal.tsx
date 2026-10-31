import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Loader2,
  AlertTriangle,
  FileText,
  FileCode,
  Image as ImageIcon,
  Video,
  File,
  Key,
  Calendar,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { GoogleDriveFile } from '../../types/google';
import { googleDriveService } from '../../services/googleDriveService';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import { DrivePdfViewer } from './DrivePdfViewer';
import { DriveVideoPlayer } from './DriveVideoPlayer';

interface DriveFilePreviewModalProps {
  file: GoogleDriveFile;
  onClose: () => void;
}

export const DriveFilePreviewModal: React.FC<DriveFilePreviewModalProps> = ({ file, onClose }) => {
  const { getValidAccessToken, connect } = useGoogleAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState<boolean>(false);

  // Blob and Blob URL states
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  // Image zoom state
  const [imageScale, setImageScale] = useState<number>(1.0);

  // Track blobUrl in ref to safely revoke on unmount or file changes
  const activeBlobUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Streaming download progress for large files/videos
  const [downloadProgress, setDownloadProgress] = useState<{ loaded: number; total: number } | null>(null);

  // Detect file categories
  const isVideo =
    file.mimeType.startsWith('video/') ||
    file.name.toLowerCase().endsWith('.mp4') ||
    file.name.toLowerCase().endsWith('.webm') ||
    file.name.toLowerCase().endsWith('.ogg') ||
    file.name.toLowerCase().endsWith('.mov') ||
    file.name.toLowerCase().endsWith('.m4v');

  const isPdf =
    file.mimeType === 'application/pdf' ||
    file.mimeType === 'application/vnd.google-apps.document' ||
    file.mimeType === 'application/vnd.google-apps.presentation' ||
    file.mimeType === 'application/vnd.google-apps.spreadsheet';

  const isImage = file.mimeType.startsWith('image/');
  const isText =
    file.mimeType.startsWith('text/') ||
    file.mimeType.includes('json') ||
    file.mimeType.includes('javascript') ||
    file.mimeType.includes('typescript') ||
    file.mimeType.includes('xml') ||
    file.mimeType.includes('csv') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.csv');

  // Revoke Blob URL helper
  const cleanUpBlobUrl = () => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setBlobUrl(null);
    setFileBlob(null);
    setDownloadProgress(null);
  };

  // Fetch file content when modal opens or file changes
  useEffect(() => {
    let isCancelled = false;
    cleanUpBlobUrl();
    setLoading(true);
    setError(null);
    setIsAuthError(false);
    setTextContent(null);
    setImageScale(1.0);
    setDownloadProgress(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const loadContent = async () => {
      const token = await getValidAccessToken();
      if (!token) {
        if (!isCancelled) {
          setError('Google Drive access token is missing or expired. Please authorize Drive.');
          setIsAuthError(true);
          setLoading(false);
        }
        return;
      }

      try {
        if (isText) {
          // Fetch text content
          const textRes = await googleDriveService.getFileText(token, file.id);
          if (isCancelled) return;

          if (textRes.error || textRes.text === null) {
            setError(textRes.error || 'Could not load text file content.');
            setIsAuthError(Boolean(textRes.isAuthError));
          } else {
            setTextContent(textRes.text);
          }
        } else if (isPdf || isImage || isVideo) {
          // Fetch binary stream as blob with stream progress
          const effectiveMimeType = isVideo && !file.mimeType.startsWith('video/')
            ? 'video/mp4'
            : file.mimeType;

          const blobRes = await googleDriveService.getFileBlob(
            token,
            file.id,
            effectiveMimeType,
            (loaded, total) => {
              if (!isCancelled) {
                setDownloadProgress({ loaded, total });
              }
            },
            abortController.signal
          );
          if (isCancelled) return;

          if (blobRes.error || !blobRes.blob) {
            setError(blobRes.error || 'Failed to retrieve file binary content from Google Drive.');
            setIsAuthError(Boolean(blobRes.isAuthError));
          } else {
            const url = URL.createObjectURL(blobRes.blob);
            activeBlobUrlRef.current = url;
            setFileBlob(blobRes.blob);
            setBlobUrl(url);
          }
        }
      } catch (err: any) {
        if (!isCancelled && err?.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Error reading file content from Google Drive.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      isCancelled = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      cleanUpBlobUrl();
    };
  }, [file.id, file.mimeType, isPdf, isImage, isText, isVideo, getValidAccessToken]);

  // Handle immediate safe download
  const handleDownload = () => {
    if (fileBlob) {
      // Trigger download using already fetched blob
      const tempUrl = URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = tempUrl;
      link.download = file.name.endsWith('.pdf') || !isPdf ? file.name : `${file.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(tempUrl);
    } else if (textContent) {
      // Download text blob
      const textBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const tempUrl = URL.createObjectURL(textBlob);
      const link = document.createElement('a');
      link.href = tempUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(tempUrl);
    } else {
      // Fallback to service download
      getValidAccessToken().then((token) => {
        if (token) {
          googleDriveService.downloadFile(token, file);
        }
      });
    }
  };

  // Render proper header icon
  const renderHeaderIcon = () => {
    if (isVideo) return <Video className="w-5 h-5 text-purple-400 flex-shrink-0" />;
    if (isPdf) return <FileCode className="w-5 h-5 text-rose-400 flex-shrink-0" />;
    if (isImage) return <ImageIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
    if (isText) return <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />;
    return <File className="w-5 h-5 text-[#75A7FF] flex-shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[92vh] max-h-[92vh] rounded-2xl bg-[#10223D] border border-[#263F63] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="h-14 px-4 sm:px-6 bg-[#112541] border-b border-[#263F63] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center">
              {renderHeaderIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC] truncate" title={file.name}>
                {file.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-[#F8FAFC] border border-[#263F63] transition-colors cursor-pointer"
              aria-label="Close Preview"
              title="Close Preview (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-hidden bg-[#081426] relative flex flex-col">
          {loading ? (
            // Loading State
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center max-w-sm mx-auto">
              <Loader2 className="w-9 h-9 text-[#3B82F6] animate-spin" />
              <div className="space-y-1 w-full">
                <p className="text-sm font-semibold text-[#F8FAFC]">
                  {isVideo ? 'Buffering Video Stream...' : 'Retrieving file from Google Drive...'}
                </p>
                <p className="text-xs text-[#A9BAD4]">
                  Downloading authenticated binary stream via Drive API v3
                </p>

                {downloadProgress && downloadProgress.total > 0 && (
                  <div className="space-y-1.5 pt-3">
                    <div className="w-full bg-[#162D4D] rounded-full h-2 overflow-hidden border border-[#263F63]">
                      <div
                        className="bg-[#3B82F6] h-full rounded-full transition-all duration-150"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((downloadProgress.loaded / downloadProgress.total) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-[#75A7FF]">
                      <span>
                        {Math.min(
                          100,
                          Math.round((downloadProgress.loaded / downloadProgress.total) * 100)
                        )}
                        %
                      </span>
                      <span>
                        {googleDriveService.formatFileSize(downloadProgress.loaded)} /{' '}
                        {googleDriveService.formatFileSize(downloadProgress.total)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : error ? (
            // Error / Auth Notice
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-[#F8FAFC]">
                  {isAuthError ? 'Permission or Authentication Required' : 'Unable to Preview File'}
                </h4>
                <p className="text-xs text-[#A9BAD4] leading-relaxed">{error}</p>
              </div>

              {isAuthError && (
                <button
                  type="button"
                  onClick={() => connect()}
                  className="px-4 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>Re-authorize Google Drive Access</span>
                </button>
              )}

              {file.webViewLink && (
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#75A7FF] hover:underline"
                >
                  <span>Open directly in Google Drive web</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : isPdf && fileBlob && blobUrl ? (
            // In-App PDF Viewer
            <DrivePdfViewer blob={fileBlob} blobUrl={blobUrl} fileName={file.name} />
          ) : isImage && blobUrl ? (
            // In-App Image Viewer
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Image zoom toolbar */}
              <div className="h-10 bg-[#112541] border-b border-[#263F63] px-4 flex items-center justify-between text-xs">
                <span className="text-[#A9BAD4] font-mono text-[11px]">
                  Format: {file.mimeType.replace('image/', '').toUpperCase()}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setImageScale((s) => Math.max(s - 0.25, 0.5))}
                    className="p-1 rounded bg-[#162D4D] text-[#A9BAD4] hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[#75A7FF] text-xs px-1.5">
                    {Math.round(imageScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setImageScale((s) => Math.min(s + 0.25, 3.0))}
                    className="p-1 rounded bg-[#162D4D] text-[#A9BAD4] hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageScale(1.0)}
                    className="px-2 py-0.5 rounded bg-[#162D4D] text-[#A9BAD4] hover:text-white text-[11px]"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Image Viewport */}
              <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
                <img
                  src={blobUrl}
                  alt={file.name}
                  style={{ transform: `scale(${imageScale})` }}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-100"
                />
              </div>
            </div>
          ) : isVideo && blobUrl ? (
            // In-App Video Player
            <DriveVideoPlayer
              blobUrl={blobUrl}
              fileName={file.name}
              mimeType={file.mimeType}
              webViewLink={file.webViewLink}
              onDownload={handleDownload}
            />
          ) : isText && textContent !== null ? (
            // In-App Text / Code Viewer
            <div className="flex-1 overflow-auto p-4 sm:p-6 font-mono text-xs text-slate-200 bg-[#081426] leading-relaxed">
              <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
            </div>
          ) : (
            // Unsupported Format
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#112541] border border-[#263F63] flex items-center justify-center text-[#75A7FF]">
                <File className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#F8FAFC]">
                  No In-App Preview Available
                </h4>
                <p className="text-xs text-[#A9BAD4] leading-relaxed">
                  Files of type <span className="font-mono text-[#75A7FF]">{file.mimeType}</span> cannot be rendered inline. You can download the file directly to your system.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-16 px-4 sm:px-6 bg-[#112541] border-t border-[#263F63] flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 text-xs">
          {/* Metadata */}
          <div className="flex items-center gap-3 text-[#A9BAD4] truncate">
            <span className="font-mono bg-[#162D4D] px-2.5 py-1 rounded-lg border border-[#263F63] text-[11px]">
              {googleDriveService.formatFileSize(file.size)}
            </span>
            {file.modifiedTime && (
              <span className="hidden sm:flex items-center gap-1.5 font-mono text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-[#75A7FF]" />
                {googleDriveService.formatDate(file.modifiedTime)}
              </span>
            )}
            <span className="font-mono text-[#7890B2] text-[11px] truncate max-w-xs">
              {file.mimeType}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            {file.webViewLink && (
              <a
                href={file.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-slate-200 hover:text-white border border-[#263F63] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open file in Google Drive in a new tab"
              >
                <span>Open in Drive</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#75A7FF]" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
