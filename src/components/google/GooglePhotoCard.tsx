import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type { GooglePhotosItem } from '../../types/google';
import { googlePhotosService } from '../../services/googlePhotosService';
import { useGoogleAuth } from '../../context/GoogleAuthContext';

interface GooglePhotoCardProps {
  photo: GooglePhotosItem;
  onClick: () => void;
  onRefresh?: () => void;
}

export const GooglePhotoCard: React.FC<GooglePhotoCardProps> = ({
  photo,
  onClick,
  onRefresh,
}) => {
  const { getValidAccessToken } = useGoogleAuth();

  const [blobUrl, setBlobUrl] = useState<string | null>(photo.blobUrl || null);
  const [loading, setLoading] = useState<boolean>(!photo.blobUrl);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Load authenticated image blob
  const loadImage = async () => {
    if (photo.blobUrl) {
      setBlobUrl(photo.blobUrl);
      setLoading(false);
      return;
    }

    const token = await getValidAccessToken();
    if (!token) {
      setError('Google authorization required');
      setIsExpired(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsExpired(false);

    try {
      const res = await googlePhotosService.fetchPhotoImageBlob(
        token,
        photo.baseUrl,
        500,
        500,
        true
      );

      if (res.error || !res.blobUrl) {
        setError(res.error || 'Failed to load thumbnail');
        setIsExpired(Boolean(res.isExpired));
      } else {
        setBlobUrl(res.blobUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading thumbnail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    if (!photo.blobUrl) {
      loadImage().then(() => {
        if (isCancelled) {
          // Unmounted
        }
      });
    } else {
      setBlobUrl(photo.blobUrl);
      setLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [photo.id, photo.baseUrl, photo.blobUrl]);

  return (
    <div
      onClick={() => {
        if (!error) {
          onClick();
        }
      }}
      className="group relative aspect-square rounded-2xl bg-[#112541] border border-[#263F63] overflow-hidden cursor-pointer shadow-md hover:border-[#3B82F6] hover:shadow-blue-500/10 transition-all duration-200"
    >
      {/* Loading Skeleton */}
      {loading && (
        <div className="absolute inset-0 bg-[#112541] animate-pulse flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 text-[#75A7FF] animate-spin" />
          <span className="text-[10px] text-[#A9BAD4] font-medium">Loading thumbnail...</span>
        </div>
      )}

      {/* Error / Expired Fallback */}
      {error && !loading && (
        <div className="absolute inset-0 bg-[#112541] p-3 flex flex-col items-center justify-center text-center space-y-2">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <p className="text-[11px] text-[#A9BAD4] font-medium leading-tight line-clamp-2">
            {isExpired ? 'URL Expired' : error}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onRefresh) {
                onRefresh();
              } else {
                loadImage();
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-[#162D4D] hover:bg-[#1B365B] text-[10px] font-semibold text-[#75A7FF] hover:text-white border border-[#263F63] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Actual Rendered Photo */}
      {blobUrl && !error && (
        <>
          <img
            src={blobUrl}
            alt={photo.filename}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Hover Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
            <div className="flex justify-end">
              <span className="p-1.5 rounded-lg bg-black/60 text-white backdrop-blur-sm">
                <Maximize2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-white truncate drop-shadow">
                {photo.filename}
              </p>
              {photo.mediaMetadata?.width && (
                <p className="text-[10px] text-slate-300 font-mono">
                  {photo.mediaMetadata.width} × {photo.mediaMetadata.height}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
