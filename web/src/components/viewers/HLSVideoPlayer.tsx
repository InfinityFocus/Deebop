'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';

interface HLSVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  onLoadedMetadata?: (duration: number) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  /** Called when video is still processing (not ready for playback) */
  onProcessing?: () => void;
}

// Extract Bunny video GUID from URL
// URLs can be: https://hostname/guid/playlist.m3u8 or https://hostname/token/expiry/guid/playlist.m3u8
function extractBunnyGuid(url: string): string | null {
  if (!url) return null;

  // Check if it's a Bunny CDN URL
  if (!url.includes('b-cdn.net') && !url.includes('bunnycdn.com')) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(Boolean);

    // Find the GUID - it's a UUID format (8-4-4-4-12)
    const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const part of parts) {
      if (guidPattern.test(part)) {
        return part;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export interface HLSVideoPlayerHandle {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

/**
 * Video player component with HLS support
 * Automatically uses hls.js for HLS streams on browsers that don't support native HLS
 * Falls back to native video for MP4 and Safari (which has native HLS support)
 */
export const HLSVideoPlayer = forwardRef<HLSVideoPlayerHandle, HLSVideoPlayerProps>(
  (
    {
      src,
      poster,
      autoPlay = false,
      muted = false,
      loop = false,
      playsInline = true,
      className,
      onPlay,
      onPause,
      onTimeUpdate,
      onEnded,
      onError,
      onLoadedMetadata,
      onClick,
      onDoubleClick,
      onContextMenu,
      onProcessing,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    // State for signed URL fetching
    const [signedSrc, setSignedSrc] = useState<string | null>(null);
    const [signedPoster, setSignedPoster] = useState<string | undefined>(poster);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Expose video methods via ref
    useImperativeHandle(ref, () => ({
      play: async () => {
        await videoRef.current?.play();
      },
      pause: () => {
        videoRef.current?.pause();
      },
      seek: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      getCurrentTime: () => videoRef.current?.currentTime || 0,
      getDuration: () => videoRef.current?.duration || 0,
      setMuted: (muted: boolean) => {
        if (videoRef.current) {
          videoRef.current.muted = muted;
        }
      },
      setVolume: (volume: number) => {
        if (videoRef.current) {
          videoRef.current.volume = volume;
        }
      },
    }));

    // Fetch signed URL for Bunny videos
    useEffect(() => {
      const bunnyGuid = extractBunnyGuid(src);

      if (bunnyGuid) {
        setIsLoading(true);
        setIsProcessing(false);

        fetch(`/api/video/${bunnyGuid}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              console.error('[HLSVideoPlayer] API error:', data.error);
              onError?.(new Error(data.error));
              setSignedSrc(src); // Fall back to original URL
            } else if (!data.isReady) {
              // Video is still processing
              console.log('[HLSVideoPlayer] Video still processing:', data.statusLabel);
              setIsProcessing(true);
              onProcessing?.();
              setSignedSrc(null);
            } else {
              setSignedSrc(data.playbackUrl);
              if (data.thumbnailUrl) {
                setSignedPoster(data.thumbnailUrl);
              }
            }
          })
          .catch((err) => {
            console.error('[HLSVideoPlayer] Failed to fetch signed URL:', err);
            setSignedSrc(src); // Fall back to original URL
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Not a Bunny video, use original URL
        setSignedSrc(src);
        setSignedPoster(poster);
      }
    }, [src, poster, onError, onProcessing]);

    // The actual source to use for playback
    const actualSrc = signedSrc || '';
    const actualPoster = signedPoster;

    // Check if source is HLS
    const isHLS = actualSrc?.includes('.m3u8') || actualSrc?.includes('playlist.m3u8');

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !actualSrc || isLoading || isProcessing) return;

      // Cleanup previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (isHLS) {
        // Check if browser supports HLS natively (Safari)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari has native HLS support
          video.src = actualSrc;
        } else if (Hls.isSupported()) {
          // Use hls.js for other browsers
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
          });

          hlsRef.current = hls;

          hls.loadSource(actualSrc);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (autoPlay) {
              video.play().catch(() => {});
            }
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              console.error('[HLSVideoPlayer] Fatal error:', data.type, data.details);
              onError?.(new Error(`HLS error: ${data.details}`));

              // Try to recover
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.log('[HLSVideoPlayer] Network error, trying to recover...');
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log('[HLSVideoPlayer] Media error, trying to recover...');
                  hls.recoverMediaError();
                  break;
                default:
                  // Cannot recover
                  hls.destroy();
                  break;
              }
            }
          });
        } else {
          // HLS not supported at all - try direct playback as fallback
          console.warn('[HLSVideoPlayer] HLS not supported, trying direct playback');
          video.src = actualSrc;
        }
      } else {
        // Direct MP4 playback
        video.src = actualSrc;
      }

      // Event handlers
      const handlePlay = () => onPlay?.();
      const handlePause = () => onPause?.();
      const handleTimeUpdate = () => {
        onTimeUpdate?.(video.currentTime, video.duration);
      };
      const handleEnded = () => onEnded?.();
      const handleLoadedMetadata = () => {
        onLoadedMetadata?.(video.duration);
      };
      const handleError = () => {
        onError?.(new Error('Video playback error'));
      };

      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('error', handleError);

        // Cleanup HLS instance
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, [actualSrc, isHLS, isLoading, isProcessing, autoPlay, onPlay, onPause, onTimeUpdate, onEnded, onError, onLoadedMetadata]);

    // Update muted state
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = muted;
      }
    }, [muted]);

    // Always render video element so ref is available for play/pause commands
    // Show loading/processing overlay on top when needed
    return (
      <div className={`relative ${className}`}>
        <video
          ref={videoRef}
          poster={actualPoster}
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          className="w-full h-full object-contain"
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onContextMenu={onContextMenu}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <div className="animate-pulse text-gray-400 text-sm">Loading video...</div>
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 gap-2">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-gray-400 text-sm">Video processing...</div>
            <div className="text-gray-500 text-xs">This may take a few minutes</div>
          </div>
        )}
      </div>
    );
  }
);

HLSVideoPlayer.displayName = 'HLSVideoPlayer';
