'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
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
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

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

    // Check if source is HLS
    const isHLS = src?.includes('.m3u8') || src?.includes('playlist.m3u8');

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      // Cleanup previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (isHLS) {
        // Check if browser supports HLS natively (Safari)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari has native HLS support
          video.src = src;
        } else if (Hls.isSupported()) {
          // Use hls.js for other browsers
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
          });

          hlsRef.current = hls;

          hls.loadSource(src);
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
          video.src = src;
        }
      } else {
        // Direct MP4 playback
        video.src = src;
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
    }, [src, isHLS, autoPlay, onPlay, onPause, onTimeUpdate, onEnded, onError, onLoadedMetadata]);

    // Update muted state
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = muted;
      }
    }, [muted]);

    return (
      <video
        ref={videoRef}
        poster={poster}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        className={className}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      />
    );
  }
);

HLSVideoPlayer.displayName = 'HLSVideoPlayer';
