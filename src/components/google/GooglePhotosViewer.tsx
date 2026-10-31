import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Image as ImageIcon,
  Search,
  ExternalLink,
  X,
  Loader2,
  Folder,
  Sparkles,
  RefreshCw,
  Info,
  AlertTriangle,
} from 'lucide-react';
import type { GooglePhotosItem, GooglePhotosAlbum, GooglePickerSession } from '../../types/google';
import { googlePhotosService } from '../../services/googlePhotosService';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import { GooglePhotoCard } from './GooglePhotoCard';
import { GooglePhotoPreviewModal } from './GooglePhotoPreviewModal';

export const GooglePhotosViewer: React.FC = () => {
  const { isConnected, getValidAccessToken } = useGoogleAuth();

  const [photos, setPhotos] = useState<GooglePhotosItem[]>([]);
  const [albums, setAlbums] = useState<GooglePhotosAlbum[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [pickerSessionLoading, setPickerSessionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [policyNotice, setPolicyNotice] = useState<string | null>(null);

  // Preview modal state
  const [selectedPhoto, setSelectedPhoto] = useState<GooglePhotosItem | null>(null);

  // Active Picker Session polling state
  const [activeSession, setActiveSession] = useState<GooglePickerSession | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);

  // Clean up in-memory blob cache on unmount
  useEffect(() => {
    return () => {
      googlePhotosService.revokeBlobCache();
    };
  }, []);

  // Initial load when connected
  useEffect(() => {
    if (!isConnected) {
      setPhotos([]);
      setAlbums([]);
      setError(null);
      setPolicyNotice(null);
      return;
    }

    loadInitialPhotos();
  }, [isConnected]);

  // Load app-created photos & albums
  const loadInitialPhotos = async () => {
    const token = await getValidAccessToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    setPolicyNotice(null);

    try {
      const [mediaRes, albumsRes] = await Promise.all([
        googlePhotosService.listAppCreatedMediaItems(token),
        googlePhotosService.listAlbums(token),
      ]);

      if (mediaRes.items && mediaRes.items.length > 0) {
        setPhotos(mediaRes.items);
      }

      if (albumsRes.albums) {
        setAlbums(albumsRes.albums);
      }

      if (mediaRes.isRestrictedNotice) {
        setPolicyNotice(mediaRes.error || googlePhotosService.getPolicyNotice());
      } else if (mediaRes.error && !mediaRes.isRestrictedNotice) {
        setError(mediaRes.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading Google Photos content.');
    } finally {
      setLoading(false);
    }
  };

  // Launch Google Photos Picker API Session
  const handleStartPickerSession = async () => {
    const token = await getValidAccessToken();
    if (!token) {
      setError('Please connect your Google account first to launch the Photos Picker.');
      return;
    }

    setPickerSessionLoading(true);
    setError(null);
    setPollingStatus('Initializing secure Google Photos Picker session...');

    try {
      const { session, error: sessionErr } = await googlePhotosService.createPickerSession(token);

      if (sessionErr || !session) {
        setError(sessionErr || 'Could not create Google Photos Picker session.');
        setPickerSessionLoading(false);
        setPollingStatus(null);
        return;
      }

      setActiveSession(session);
      setPollingStatus('Photos Picker ready. Please select your photos in the opened Google window.');

      // Open Google-hosted Picker UI in popup window
      const pickerWindow = window.open(
        session.pickerUri,
        'GooglePhotosPicker',
        'width=850,height=680,menubar=no,toolbar=no,status=no'
      );

      // Begin polling session status
      pollPickerSession(token, session.id, pickerWindow);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch Google Photos Picker.');
      setPickerSessionLoading(false);
      setPollingStatus(null);
    }
  };

  // Poll session until mediaItemsSet is true
  const pollPickerSession = async (
    token: string,
    sessionId: string,
    pickerWindow: Window | null
  ) => {
    let pollCount = 0;
    const maxPolls = 60; // 5 minutes max
    const intervalMs = 5000;

    const timer = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls || (pickerWindow && pickerWindow.closed && pollCount > 8)) {
        // Continue polling until timeout or success
      }

      const { session, error: pollErr } = await googlePhotosService.getPickerSession(token, sessionId);

      if (pollErr) {
        clearInterval(timer);
        setPickerSessionLoading(false);
        setPollingStatus(null);
        return;
      }

      if (session?.mediaItemsSet) {
        clearInterval(timer);
        setPollingStatus('Retrieving selected photos...');

        // Fetch selected items with active Bearer token
        const listRes = await googlePhotosService.listPickerMediaItems(token, sessionId);

        if (listRes.items.length > 0) {
          // Prepend new picked photos to existing photos
          setPhotos((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newItems = listRes.items.filter((item) => !existingIds.has(item.id));
            return [...newItems, ...prev];
          });
        }

        // NOTE: We do not call deletePickerSession immediately so Google preserves the 7-day session
        // allowing baseUrls to be seamlessly refreshed on demand when they expire!
        setActiveSession(null);
        setPickerSessionLoading(false);
        setPollingStatus(null);
      }
    }, intervalMs);
  };

  // Refresh photos by querying active sessions or reloading library
  const handleRefreshAllPhotos = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    // Clear stale cached blobs so fresh ones are requested
    googlePhotosService.revokeBlobCache();

    try {
      // Find all unique session IDs from existing photos
      const uniqueSessionIds = Array.from(
        new Set(photos.map((p) => p.sessionId).filter(Boolean))
      ) as string[];

      if (uniqueSessionIds.length > 0) {
        const refreshedResults = await Promise.all(
          uniqueSessionIds.map((sid) => googlePhotosService.listPickerMediaItems(token, sid))
        );

        const freshMap = new Map<string, GooglePhotosItem>();
        for (const res of refreshedResults) {
          for (const item of res.items) {
            freshMap.set(item.id, item);
          }
        }

        setPhotos((prev) =>
          prev.map((item) => (freshMap.has(item.id) ? freshMap.get(item.id)! : item))
        );
      } else {
        await loadInitialPhotos();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error refreshing photo URLs.');
    } finally {
      setLoading(false);
    }
  }, [photos, getValidAccessToken]);

  // Filtered photos
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      const matchesSearch =
        searchQuery === '' ||
        photo.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.mimeType.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [photos, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Error or Specific Policy Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start justify-between gap-3 text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-300">Google Photos Notice</p>
              <p className="text-xs text-amber-200/90 leading-relaxed">{policyNotice || error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setPolicyNotice(null);
            }}
            className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2025 Google Photos API Policy Explainer Banner */}
      <div className="p-4 rounded-2xl bg-[#112541] border border-[#263F63] flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF] flex-shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-[#F8FAFC] flex items-center gap-1.5">
              <span>Google Photos API Security Notice</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-[#75A7FF] font-mono">
                Official 2025 Policy
              </span>
            </h4>
            <p className="text-xs text-[#A9BAD4] leading-relaxed max-w-4xl">
              Google permanently deprecated unrestricted third-party photo library crawling (
              <code className="text-[#75A7FF] font-mono">photoslibrary.readonly</code>). In strict adherence with
              Google Developer privacy guidelines, NEXA implements the official{' '}
              <strong className="text-slate-200">Google Photos Picker API</strong> (
              <code className="text-[#75A7FF] font-mono">photospicker.mediaitems.readonly</code>). Click{' '}
              <strong className="text-white">"Select Photos from Google"</strong> to securely choose pictures and
              albums to import into your workspace gallery.
            </p>
          </div>
        </div>
      </div>

      {/* Action Toolbar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#112541] p-3.5 sm:p-4 rounded-2xl border border-[#263F63]">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#75A7FF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search imported photos by filename or format..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#162D4D] border border-[#263F63] text-xs text-[#F8FAFC] placeholder-[#7890B2] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9BAD4] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Picker Trigger & Refresh */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefreshAllPhotos}
            disabled={!isConnected || loading}
            className="p-2.5 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-[#F8FAFC] border border-[#263F63] text-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh gallery and renew photo URLs"
          >
            <RefreshCw className={`w-4 h-4 text-[#75A7FF] ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleStartPickerSession}
            disabled={!isConnected || pickerSessionLoading}
            className="px-4 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-blue-600 active:scale-[0.99] text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pickerSessionLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Waiting for Selection...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Select Photos from Google</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Session Polling Feedback */}
      {pollingStatus && (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-[#75A7FF] animate-spin" />
            <span>{pollingStatus}</span>
          </div>
          {activeSession && (
            <a
              href={activeSession.pickerUri}
              target="_blank"
              rel="noreferrer"
              className="text-[#75A7FF] underline font-semibold flex items-center gap-1"
            >
              Reopen Picker Window <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Album Selector Tabs */}
      {albums.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedAlbumId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              selectedAlbumId === 'all'
                ? 'bg-[#3B82F6] text-white border-blue-400'
                : 'bg-[#112541] text-[#A9BAD4] hover:text-white border-[#263F63]'
            }`}
          >
            All Photos ({photos.length})
          </button>
          {albums.map((album) => (
            <button
              key={album.id}
              onClick={() => setSelectedAlbumId(album.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-1.5 ${
                selectedAlbumId === album.id
                  ? 'bg-[#3B82F6] text-white border-blue-400'
                  : 'bg-[#112541] text-[#A9BAD4] hover:text-white border-[#263F63]'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-[#75A7FF]" />
              <span>{album.title}</span>
              {album.mediaItemsCount && (
                <span className="text-[10px] text-[#A9BAD4]">({album.mediaItemsCount})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Photo Gallery Grid */}
      {loading ? (
        // Loading Skeletons
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-[#112541] border border-[#263F63] animate-pulse flex items-center justify-center"
            >
              <ImageIcon className="w-8 h-8 text-[#263F63]" />
            </div>
          ))}
        </div>
      ) : !isConnected ? (
        // Disconnected Empty State
        <div className="p-12 text-center rounded-2xl bg-[#112541] border border-[#263F63] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF] mx-auto shadow-inner">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-[#F8FAFC]">
              Google Photos Account Not Connected
            </h3>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              Connect your authorized Google account above to browse, import, and organize high-resolution photos in your NEXA workspace.
            </p>
          </div>
        </div>
      ) : filteredPhotos.length === 0 ? (
        // Connected but No Photos Imported Empty State
        <div className="p-12 text-center rounded-2xl bg-[#112541] border border-[#263F63] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF] mx-auto shadow-inner">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-[#F8FAFC]">
              {searchQuery ? 'No Photos Match Your Search' : 'No Photos Imported Yet'}
            </h3>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              {searchQuery
                ? `No photos found matching "${searchQuery}". Clear search or select different media.`
                : 'Click "Select Photos from Google" to choose albums and pictures directly from your Google Photos library.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              type="button"
              onClick={handleStartPickerSession}
              disabled={pickerSessionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4" /> Select Photos from Google
            </button>
          )}
        </div>
      ) : (
        // Grid of Photos Using GooglePhotoCard
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => (
            <GooglePhotoCard
              key={photo.id}
              photo={photo}
              onClick={() => setSelectedPhoto(photo)}
              onRefresh={handleRefreshAllPhotos}
            />
          ))}
        </div>
      )}

      {/* Full-Screen Uncropped Image Preview Modal */}
      {selectedPhoto && (
        <GooglePhotoPreviewModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onRefreshPhotos={handleRefreshAllPhotos}
        />
      )}
    </div>
  );
};
