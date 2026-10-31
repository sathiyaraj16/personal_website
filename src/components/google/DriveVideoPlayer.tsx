import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Loader2,
  AlertCircle,
  ExternalLink,
  Download,
} from 'lucide-react';

interface DriveVideoPlayerProps {
  blobUrl: string;
  fileName: string;
  mimeType: string;
  webViewLink?: string;
  onDownload: () => void;
}

export const DriveVideoPlayer: React.FC<DriveVideoPlayerProps> = ({
  blobUrl,
  fileName,
  mimeType,
  webViewLink,
  onDownload,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<any>(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Controls visibility & seeking interaction
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isDraggingSeek, setIsDraggingSeek] = useState<boolean>(false);
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverSeekPos, setHoverSeekPos] = useState<number>(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);

  const speedOptions = [0.5, 1.0, 1.25, 1.5, 2.0];

  // Format seconds into MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Autohide controls when playing and inactive
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && !isDraggingSeek) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, [isPlaying, isDraggingSeek]);

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Video play error:', err);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Volume & Mute handlers
  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    if (videoRef.current) {
      videoRef.current.volume = clamped;
      videoRef.current.muted = clamped === 0;
    }
    setIsMuted(clamped === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      if (volume === 0) {
        setVolume(0.5);
        videoRef.current.volume = 0.5;
      }
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // Playback speed handler
  const handleSetSpeed = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    resetControlsTimeout();
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
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

  // Time & Buffer update listeners on video element
  const handleTimeUpdate = () => {
    if (!videoRef.current || isDraggingSeek) return;
    setCurrentTime(videoRef.current.currentTime);

    // Update buffered progress
    if (videoRef.current.buffered.length > 0) {
      const end = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBufferedEnd(end);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsBuffering(false);
    }
  };

  // Seek bar interaction (click & drag)
  const calculateSeekTime = (clientX: number): number => {
    if (!progressTrackRef.current || duration <= 0) return 0;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pos * duration;
  };

  const handleSeekStart = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingSeek(true);
    const newTime = calculateSeekTime(e.clientX);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleSeekMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressTrackRef.current || duration <= 0) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverSeekPos(pos * 100);
    setHoverSeekTime(pos * duration);

    if (isDraggingSeek) {
      const newTime = pos * duration;
      setCurrentTime(newTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
    }
  };

  const handleSeekEnd = () => {
    setIsDraggingSeek(false);
    resetControlsTimeout();
  };

  // Keyboard shortcut controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(volume + 0.1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(volume - 0.1);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, volume, duration]);

  // Video error handler
  const handleVideoError = () => {
    setIsBuffering(false);
    setPlaybackError(
      `Your browser could not decode this video format (${mimeType}). It may use an unsupported codec (e.g. HEVC or non-standard AAC).`
    );
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none group"
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={blobUrl}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setShowControls(true);
        }}
        onError={handleVideoError}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Top Title Overlay */}
      <div
        className={`absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 z-20 pointer-events-none flex items-center justify-between ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="text-xs sm:text-sm font-semibold text-white drop-shadow truncate max-w-lg">
          {fileName}
        </span>
      </div>

      {/* Buffering Indicator Overlay */}
      {isBuffering && !playbackError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none z-20">
          <Loader2 className="w-12 h-12 text-[#3B82F6] animate-spin drop-shadow-lg" />
        </div>
      )}

      {/* Video Decode Error State */}
      {playbackError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#081426]/95 text-center space-y-4 z-30">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h4 className="text-base font-bold text-[#F8FAFC]">Video Playback Notice</h4>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">{playbackError}</p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onDownload}
              className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Video</span>
            </button>
            {webViewLink && (
              <a
                href={webViewLink}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-slate-200 border border-[#263F63] font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Play in Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#75A7FF]" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Centered Play / Pause Button for Quick Interaction */}
      {!isPlaying && !isBuffering && !playbackError && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer z-20 backdrop-blur-sm"
          title="Play Video (Spacebar)"
          aria-label="Play Video"
        >
          <Play className="w-7 h-7 ml-1 fill-white" />
        </button>
      )}

      {/* Bottom Controls Bar Overlay */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-4 px-4 sm:px-6 transition-opacity duration-300 z-20 flex flex-col gap-2 ${
          showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Seek Progress Bar */}
        <div
          ref={progressTrackRef}
          onMouseDown={handleSeekStart}
          onMouseMove={handleSeekMove}
          onMouseUp={handleSeekEnd}
          onMouseLeave={() => setHoverSeekTime(null)}
          className="group/track relative h-3 flex items-center cursor-pointer py-1"
        >
          {/* Track Background */}
          <div className="w-full h-1.5 group-hover/track:h-2.5 rounded-full bg-[#162D4D] overflow-hidden transition-all relative">
            {/* Buffered Progress */}
            <div
              style={{ width: `${bufferedPercent}%` }}
              className="absolute top-0 bottom-0 left-0 bg-[#263F63] rounded-full transition-all duration-150"
            />
            {/* Playback Progress */}
            <div
              style={{ width: `${progressPercent}%` }}
              className="absolute top-0 bottom-0 left-0 bg-[#3B82F6] rounded-full"
            />
          </div>

          {/* Scrubber Knob */}
          <div
            style={{ left: `${progressPercent}%` }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-[#3B82F6] opacity-0 group-hover/track:opacity-100 transition-opacity pointer-events-none"
          />

          {/* Hover Time Tooltip */}
          {hoverSeekTime !== null && (
            <div
              style={{ left: `${hoverSeekPos}%` }}
              className="absolute bottom-5 -translate-x-1/2 px-2 py-0.5 rounded bg-[#112541] border border-[#263F63] text-[10px] font-mono text-[#F8FAFC] shadow-lg pointer-events-none whitespace-nowrap"
            >
              {formatTime(hoverSeekTime)}
            </div>
          )}
        </div>

        {/* Controls Toolbar Buttons */}
        <div className="flex items-center justify-between text-xs text-[#F8FAFC] gap-2">
          {/* Left: Play/Pause, Volume, Time */}
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pause (k)' : 'Play (k)'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Replay 10s */}
            <button
              type="button"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#A9BAD4] hover:text-white transition-colors cursor-pointer"
              title="Replay 10 seconds"
              aria-label="Replay 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 accent-[#3B82F6] bg-[#263F63] rounded-lg cursor-pointer transition-all"
                title="Volume"
                aria-label="Volume slider"
              />
            </div>

            {/* Current Time / Duration */}
            <div className="font-mono text-[11px] text-[#A9BAD4] pl-1">
              <span className="text-[#F8FAFC]">{formatTime(currentTime)}</span>
              <span className="mx-1 text-[#7890B2]">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Speed, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Playback Speed Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-lg bg-[#162D4D]/80 hover:bg-[#1B365B] border border-[#263F63] text-xs font-mono text-[#75A7FF] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-8 right-0 rounded-xl bg-[#112541] border border-[#263F63] shadow-xl py-1 z-30 min-w-[70px] animate-in fade-in zoom-in-95 duration-100">
                  {speedOptions.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleSetSpeed(rate)}
                      className={`w-full px-3 py-1 text-left text-xs font-mono transition-colors ${
                        playbackRate === rate
                          ? 'bg-[#3B82F6] text-white font-bold'
                          : 'text-[#A9BAD4] hover:bg-[#162D4D] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen (f)' : 'Fullscreen (f)'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
