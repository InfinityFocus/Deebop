'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  SkipBack,
  SkipForward,
  AlertCircle,
} from 'lucide-react';
import {
  useVideoEditorStore,
  usePlaybackState,
  useClips,
  useOverlays,
  VideoClip,
} from '@/stores/videoEditorStore';
import { getCssFilter } from '@/lib/video-filters';

// Calculate effective duration of a clip
const getClipEffectiveDuration = (clip: VideoClip): number => {
  const trimEnd = clip.trimEnd ?? clip.sourceDuration;
  return (trimEnd - clip.trimStart) / clip.speed;
};

// Get clip and local time for a global time
const getClipAtGlobalTime = (
  clips: VideoClip[],
  globalTime: number
): { clip: VideoClip; localTime: number } | null => {
  const sortedClips = [...clips].sort((a, b) => a.sortOrder - b.sortOrder);
  let accumulatedTime = 0;

  for (const clip of sortedClips) {
    const duration = getClipEffectiveDuration(clip);
    if (globalTime >= accumulatedTime && globalTime < accumulatedTime + duration) {
      // Calculate local time within the clip
      const timeInClip = globalTime - accumulatedTime;
      const localTime = clip.trimStart + timeInClip * clip.speed;
      return { clip, localTime };
    }
    accumulatedTime += duration;
  }

  return null;
};

export default function VideoPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const [currentClipId, setCurrentClipId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');
  const [canvasDims, setCanvasDims] = useState({ w: 0, h: 0 });

  const clips = useClips();
  const overlays = useOverlays();
  const { isPlaying, currentTime, duration, volume, isMuted } = usePlaybackState();

  // Keep refs in sync with state (refs don't trigger re-renders)
  currentTimeRef.current = currentTime;
  durationRef.current = duration;

  const play = useVideoEditorStore((s) => s.play);
  const pause = useVideoEditorStore((s) => s.pause);
  const togglePlayPause = useVideoEditorStore((s) => s.togglePlayPause);
  const seek = useVideoEditorStore((s) => s.seek);
  const setCurrentTime = useVideoEditorStore((s) => s.setCurrentTime);
  const setVolume = useVideoEditorStore((s) => s.setVolume);
  const toggleMute = useVideoEditorStore((s) => s.toggleMute);
  const updateOverlay = useVideoEditorStore((s) => s.updateOverlay);
  const selectOverlay = useVideoEditorStore((s) => s.selectOverlay);
  const selectedOverlayId = useVideoEditorStore((s) => s.selectedOverlayId);
  const draggingOverlayId = useVideoEditorStore((s) => s.draggingOverlayId);
  const setDraggingOverlay = useVideoEditorStore((s) => s.setDraggingOverlay);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Draw frame to canvas - uses refs to avoid dependency on rapidly changing state
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas) {
      console.log('[VideoPreview] drawFrame: no canvas');
      return;
    }
    if (!video) {
      console.log('[VideoPreview] drawFrame: no video element');
      return;
    }
    if (video.readyState < 2) {
      console.log('[VideoPreview] drawFrame: video not ready, readyState:', video.readyState);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('[VideoPreview] drawFrame: no canvas context');
      return;
    }

    console.log('[VideoPreview] drawFrame: drawing to canvas', canvas.width, 'x', canvas.height, 'video:', video.videoWidth, 'x', video.videoHeight);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = canvas.width / canvas.height;

    let drawWidth, drawHeight, drawX, drawY;

    if (videoAspect > canvasAspect) {
      drawWidth = canvas.width;
      drawHeight = canvas.width / videoAspect;
      drawX = 0;
      drawY = (canvas.height - drawHeight) / 2;
    } else {
      drawHeight = canvas.height;
      drawWidth = canvas.height * videoAspect;
      drawX = (canvas.width - drawWidth) / 2;
      drawY = 0;
    }

    ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
  }, []);

  // Draw overlays on top of video frame
  const drawOverlays = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const time = currentTimeRef.current;
    const dur = durationRef.current;

    // Filter active overlays based on current time
    const activeOverlays = overlays.filter((o) => {
      const endTime = o.endTime ?? dur;
      return time >= o.startTime && time <= endTime;
    });

    console.log('[VideoPreview] drawOverlays:', {
      totalOverlays: overlays.length,
      activeOverlays: activeOverlays.length,
      currentTime: time,
      duration: dur,
      overlayTimes: overlays.map(o => ({ id: o.id, start: o.startTime, end: o.endTime, text: o.text?.substring(0, 10) }))
    });

    activeOverlays.forEach((overlay) => {
      const x = (overlay.positionX / 100) * canvas.width;
      const y = (overlay.positionY / 100) * canvas.height;

      ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw background if present
      if (overlay.backgroundColor) {
        const metrics = ctx.measureText(overlay.text || '');
        const padding = 8;
        ctx.fillStyle = overlay.backgroundColor;
        ctx.fillRect(
          x - metrics.width / 2 - padding,
          y - overlay.fontSize / 2 - padding / 2,
          metrics.width + padding * 2,
          overlay.fontSize + padding
        );
      }

      // Draw text
      ctx.fillStyle = overlay.fontColor;
      ctx.fillText(overlay.text || '', x, y);

      // Draw selection indicator
      if (overlay.id === selectedOverlayId) {
        const metrics = ctx.measureText(overlay.text || '');
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          x - metrics.width / 2 - 12,
          y - overlay.fontSize / 2 - 8,
          metrics.width + 24,
          overlay.fontSize + 16
        );
        ctx.setLineDash([]);
      }
    });
  }, [overlays, selectedOverlayId]);

  // Handle video time updates during playback
  // IMPORTANT: We do NOT call setCurrentTime on every frame to avoid
  // 60fps state updates causing re-renders. We update at 10fps for UI display.
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();
    let lastUiUpdate = performance.now();
    const UI_UPDATE_INTERVAL = 100; // Update UI at 10fps

    const animate = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Update ref
      const newTime = currentTimeRef.current + delta;
      currentTimeRef.current = newTime;

      // Update video position if clip changed
      const video = videoRef.current;
      if (video && clips.length > 0) {
        const result = getClipAtGlobalTime(clips, newTime);
        if (result) {
          const { clip, localTime } = result;
          if (clip.id !== currentClipId) {
            setCurrentClipId(clip.id);
            video.src = clip.sourceUrl;
            video.playbackRate = clip.speed;
            video.load();
          }
          if (Math.abs(video.currentTime - localTime) > 0.1) {
            video.currentTime = localTime;
          }
          if (canvasRef.current) {
            canvasRef.current.style.filter = getCssFilter(clip.filterPreset);
          }
        }
      }

      drawFrame();
      drawOverlays();

      // Update UI state at lower frequency (10fps) to show time display
      if (now - lastUiUpdate >= UI_UPDATE_INTERVAL) {
        setCurrentTime(newTime);
        lastUiUpdate = now;
      }

      if (newTime < durationRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Playback ended - sync state
        setCurrentTime(durationRef.current);
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        // Sync state when stopping playback
        setCurrentTime(currentTimeRef.current);
      }
    };
  }, [isPlaying, clips, currentClipId, setCurrentTime, drawFrame, drawOverlays]);

  // Update video source and position when seeking (not during playback)
  // During playback, this is handled in the animation loop
  useEffect(() => {
    // Skip during playback - animation loop handles it
    if (isPlaying) return;

    const video = videoRef.current;
    if (!video || clips.length === 0) {
      console.log('[VideoPreview] Skipping: no video element or no clips');
      return;
    }

    console.log('[VideoPreview] Clips changed, loading video...', clips.length, 'clips');

    // Sync ref with state when not playing
    currentTimeRef.current = currentTime;

    const result = getClipAtGlobalTime(clips, currentTime);
    if (!result) {
      console.log('[VideoPreview] No clip at current time:', currentTime);
      return;
    }

    const { clip, localTime } = result;
    console.log('[VideoPreview] Loading clip:', clip.id, 'at localTime:', localTime);

    // Switch video source if clip changed
    if (clip.id !== currentClipId) {
      console.log('[VideoPreview] Setting new video source:', clip.sourceUrl);
      setCurrentClipId(clip.id);
      setVideoError(null);
      setIsVideoLoading(true);

      // Handle video events
      const handleLoadedData = () => {
        console.log('[VideoPreview] Video loadeddata event, seeking to:', localTime);
        setIsVideoLoading(false);
        setDebugInfo(`Loaded: ${video.videoWidth}x${video.videoHeight}`);
        video.currentTime = localTime;
      };

      const handleCanPlayThrough = () => {
        console.log('[VideoPreview] Video canplaythrough, readyState:', video.readyState);
        setDebugInfo(`Ready: ${video.videoWidth}x${video.videoHeight}, rs=${video.readyState}`);
        drawFrame();
        drawOverlays();
      };

      const handleSeeked = () => {
        console.log('[VideoPreview] Video seeked, drawing frame, readyState:', video.readyState);
        setDebugInfo(`Seeked, drawing frame...`);
        drawFrame();
        drawOverlays();
      };

      const handleError = (e: Event) => {
        const mediaError = video.error;
        console.error('[VideoPreview] Video load error:', mediaError?.code, mediaError?.message);
        setIsVideoLoading(false);
        setDebugInfo(`Error: ${mediaError?.code}`);
        setVideoError(`Failed to load video: ${mediaError?.message || 'Unknown error'}`);
      };

      // Remove any existing listeners
      video.removeEventListener('error', handleError);

      // Add new listeners
      video.addEventListener('loadeddata', handleLoadedData, { once: true });
      video.addEventListener('canplaythrough', handleCanPlayThrough, { once: true });
      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('error', handleError);

      // Set source and load
      video.src = clip.sourceUrl;
      video.playbackRate = clip.speed;
      video.crossOrigin = 'anonymous'; // Enable CORS
      video.load();

      // Cleanup
      return () => {
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
      };
    } else {
      // Same clip, just seek
      if (Math.abs(video.currentTime - localTime) > 0.1) {
        video.currentTime = localTime;
      }
    }

    // Apply CSS filter
    if (canvasRef.current) {
      canvasRef.current.style.filter = getCssFilter(clip.filterPreset);
    }
  }, [clips, currentTime, currentClipId, isPlaying, drawFrame, drawOverlays]);

  // Update volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Draw frame when video loads or seeks
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      drawFrame();
      drawOverlays();
    };
    const handleSeeked = () => {
      drawFrame();
      drawOverlays();
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [drawFrame, drawOverlays]);

  // Redraw when overlays change (important for when paused)
  useEffect(() => {
    if (!isPlaying && clips.length > 0) {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        console.log('[VideoPreview] Overlays changed, redrawing...', overlays.length, 'overlays');
        drawFrame();
        drawOverlays();
      }
    }
  }, [overlays, selectedOverlayId, isPlaying, clips.length, drawFrame, drawOverlays]);

  // Resize canvas to container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      console.log('[VideoPreview] Resize: no container or canvas');
      return;
    }

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      console.log('[VideoPreview] Resizing canvas to:', rect.width, 'x', rect.height);

      // Ensure minimum dimensions
      const width = Math.max(rect.width, 320);
      const height = Math.max(rect.height, 180);

      canvas.width = width;
      canvas.height = height;
      setCanvasDims({ w: width, h: height });
      setDebugInfo(`Canvas: ${width}x${height}`);

      // Draw if video is ready
      if (videoRef.current && videoRef.current.readyState >= 2) {
        drawFrame();
        drawOverlays();
      }
    };

    // Initial resize
    resizeCanvas();

    // Also resize after a short delay to catch late layout changes
    const timeoutId = setTimeout(resizeCanvas, 100);

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [drawFrame, drawOverlays]);

  // Handle overlay dragging
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if clicking on an overlay
    const clickedOverlay = overlays.find((o) => {
      const endTime = o.endTime ?? duration;
      if (currentTime < o.startTime || currentTime > endTime) return false;

      const overlayX = o.positionX;
      const overlayY = o.positionY;
      const threshold = 5; // percentage

      return (
        Math.abs(x - overlayX) < threshold + 5 &&
        Math.abs(y - overlayY) < threshold + 3
      );
    });

    if (clickedOverlay) {
      selectOverlay(clickedOverlay.id);
      setDraggingOverlay(clickedOverlay.id);
      e.preventDefault();
    } else {
      selectOverlay(null);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!draggingOverlayId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

    updateOverlay(draggingOverlayId, { positionX: x, positionY: y });
    drawFrame();
    drawOverlays();
  };

  const handleCanvasPointerUp = () => {
    setDraggingOverlay(null);
  };

  // Seek bar handling
  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const handleSkipBack = () => {
    seek(Math.max(0, currentTime - 5));
  };

  const handleSkipForward = () => {
    seek(Math.min(duration, currentTime + 5));
  };

  const handleFullscreen = () => {
    containerRef.current?.requestFullscreen();
  };

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      {/* Canvas container */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-black min-h-[200px]"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
      >
        {/* Video element - hidden but used as source for canvas */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain opacity-0 pointer-events-none"
          muted={isMuted}
          playsInline
          crossOrigin="anonymous"
        />
        {/* Canvas for drawing video frames + overlays */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none' }}
        />

        {/* Loading indicator */}
        {isVideoLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex flex-col items-center gap-2 text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading video...</span>
            </div>
          </div>
        )}

        {/* Error indicator */}
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="flex flex-col items-center gap-2 text-red-400 text-center px-4">
              <AlertCircle size={32} />
              <span className="text-sm">{videoError}</span>
            </div>
          </div>
        )}

        {/* No clips indicator */}
        {clips.length === 0 && !isVideoLoading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
            <span className="text-sm">No video loaded</span>
          </div>
        )}

        {/* Debug overlay - temporary */}
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
          {debugInfo} | clips:{clips.length} | canvas:{canvasDims.w}x{canvasDims.h}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-zinc-900 border-t border-zinc-800 px-3 sm:px-4 py-2 sm:py-3 flex-shrink-0">
        {/* Seek bar */}
        <div
          className="h-1.5 bg-zinc-700 rounded-full mb-3 cursor-pointer group"
          onClick={handleSeekBarClick}
        >
          <div
            className="h-full bg-emerald-500 rounded-full relative"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkipBack}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 transition"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>
            <button
              onClick={handleSkipForward}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <SkipForward size={18} />
            </button>
          </div>

          <div className="text-sm text-zinc-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-emerald-500"
            />
            <button
              onClick={handleFullscreen}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
