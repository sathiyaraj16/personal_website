import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCcw,
  Calendar,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type { GooglePhotosItem } from '../../types/google';
import { googlePhotosService } from '../../services/googlePhotosService';
import { useGoogleAuth } from '../../context/GoogleAuthContext';

interface GooglePhotoPreviewModalProps {
  photo: GooglePhotosItem;
  onClose: () => void;
  onRefreshPhotos: () => Promise<void>;
}

export const GooglePhotoPreviewModal: React.FC<GooglePhotoPreviewModalProps> = ({
  photo,
  onClose,
  onRefreshPhotos,
}) => {
  const { getValidAccessToken } = useGoogleAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Zoom and View states
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  // Load high-resolution full image blob via authenticated Google Photos API
  const loadFullImage = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) {
      setError('Google authentication required to load full photo.');
      setIsExpired(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsExpired(false);
    setZoomScale(1.0);

    try {
      // Use 2048x2048 uncropped bound for full image display
      const res = await googlePhotosService.fetchPhotoImageBlob(
        token,
        photo.baseUrl,
        2048,
        2048,
        false
      );

      if (res.error || !res.blobUrl) {
        setError(res.error || 'Failed to retrieve high-resolution photo.');
        setIsExpired(Boolean(res.isExpired));
      } else {
        setBlobUrl(res.blobUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading full photo.');
    } finally {
      setLoading(false);
    }
  }, [photo.baseUrl, getValidAccessToken]);

  useEffect(() => {
    loadFullImage();
  }, [loadFullImage]);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setZoomScale(1.0);
  };

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          onClose();
        }
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleZoomReset();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Download handler
  const handleDownload = async () => {
    const token = await getValidAccessToken();
    if (!token) return;

    setDownloading(true);
    await googlePhotosService.downloadPhoto(token, photo.baseUrl, photo.filename);
    setDownloading(false);
  };

  // Extract clean format label (e.g. JPEG, PNG)
  const formatLabel = photo.mimeType
    ? photo.mimeType.replace('image/', '').toUpperCase()
    : 'PHOTO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        ref={containerRef}
        className="w-full max-w-6xl h-full max-h-[96vh] rounded-2xl bg-[#10223D] border border-[#263F63] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="h-14 px-4 sm:px-6 bg-[#112541] border-b border-[#263F63] flex items-center justify-between gap-3 flex-shrink-0 z-10">
          {/* Left: Icon, Filename, Format badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-[#162D4D] border border-[#263F63] text-[#75A7FF] flex-shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h3
                className="text-sm sm:text-base font-bold text-[#F8FAFC] truncate max-w-md"
                title={photo.filename}
              >
                {photo.filename}
              </h3>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#162D4D] border border-[#263F63] text-[#75A7FF]">
                {formatLabel}
              </span>
            </div>
          </div>

          {/* Right: Zoom / Fullscreen / Close */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-[#F8FAFC] border border-[#263F63] transition-colors cursor-pointer hidden sm:flex items-center justify-center"
              title={isFullscreen ? 'Exit Fullscreen (f)' : 'Fullscreen View (f)'}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-[#F8FAFC] border border-[#263F63] transition-colors cursor-pointer"
              title="Close Preview (Esc)"
              aria-label="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Preview Viewport: Strict Flexible Box with min-h-0 to Prevent Any Cropping */}
        <div className="flex-1 min-h-0 w-full bg-[#081426] flex items-center justify-center p-3 sm:p-6 relative overflow-hidden select-none">
          {/* Zoom Floating Controls Overlay (Visible when loaded) */}
          {blobUrl && !loading && !error && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-[#112541]/85 backdrop-blur-md border border-[#263F63] shadow-lg">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomScale <= 0.5}
                className="p-1.5 rounded-lg hover:bg-[#162D4D] text-[#A9BAD4] hover:text-[#F8FAFC] disabled:opacity-40 transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleZoomReset}
                className="px-2 py-0.5 rounded-lg text-xs font-mono font-semibold text-[#75A7FF] hover:bg-[#162D4D] transition-colors cursor-pointer min-w-[50px] text-center"
                title="Reset Zoom to 100% (0)"
              >
                {Math.round(zoomScale * 100)}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomScale >= 3.0}
                className="p-1.5 rounded-lg hover:bg-[#162D4D] text-[#A9BAD4] hover:text-[#F8FAFC] disabled:opacity-40 transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {zoomScale !== 1.0 && (
                <button
                  type="button"
                  onClick={handleZoomReset}
                  className="p-1.5 rounded-lg hover:bg-[#162D4D] text-[#75A7FF] transition-colors cursor-pointer"
                  title="Reset Scale"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <Loader2 className="w-10 h-10 text-[#3B82F6] animate-spin" />
              <p className="text-sm font-semibold text-[#F8FAFC]">
                Loading full-resolution photo...
              </p>
              <p className="text-xs text-[#A9BAD4]">
                Retrieving uncropped image bytes via authenticated Google Photos API
              </p>
            </div>
          )}

          {/* Error / Expired Notice */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-[#F8FAFC]">
                  {isExpired ? 'Photo URL Expired' : 'Unable to Display Image'}
                </h4>
                <p className="text-xs text-[#A9BAD4] leading-relaxed">{error}</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await onRefreshPhotos();
                    await loadFullImage();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Photo URLs</span>
                </button>

                {photo.productUrl && (
                  <a
                    href={photo.productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-slate-200 border border-[#263F63] font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>View in Google Photos</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#75A7FF]" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Complete Uncropped Image: object-fit: contain, max-width/max-height: 100%, width/height: auto */}
          {blobUrl && !error && (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-1">
              <img
                src={blobUrl}
                alt={photo.filename}
                style={{
                  transform: `scale(${zoomScale})`,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  transition: 'transform 150ms ease-out',
                }}
                className="rounded shadow-2xl block mx-auto my-auto select-none pointer-events-auto"
              />
            </div>
          )}
        </div>

        {/* Modal Footer: Dimensions, File Info, Download & Close Actions */}
        <div className="h-16 px-4 sm:px-6 bg-[#112541] border-t border-[#263F63] flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 text-xs z-10">
          {/* Metadata info */}
          <div className="flex items-center gap-3 text-[#A9BAD4] truncate">
            {photo.mediaMetadata?.width && photo.mediaMetadata?.height ? (
              <span className="font-mono bg-[#162D4D] px-2.5 py-1 rounded-lg border border-[#263F63] text-[#F8FAFC]">
                {photo.mediaMetadata.width} × {photo.mediaMetadata.height} px
              </span>
            ) : (
              <span className="font-mono bg-[#162D4D] px-2.5 py-1 rounded-lg border border-[#263F63]">
                Full Resolution
              </span>
            )}

            {photo.createTime && (
              <span className="hidden sm:flex items-center gap-1.5 font-mono text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-[#75A7FF]" />
                {new Date(photo.createTime).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}

            <span className="font-mono text-[#7890B2] text-[11px] uppercase">
              {formatLabel}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-slate-300 hover:text-white border border-[#263F63] font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download</span>
            </button>

            {/* Open in Google Photos */}
            {photo.productUrl && (
              <a
                href={photo.productUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-slate-200 hover:text-white border border-[#263F63] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer hidden md:flex"
                title="Open photo in Google Photos web"
              >
                <span>Google Photos</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#75A7FF]" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
