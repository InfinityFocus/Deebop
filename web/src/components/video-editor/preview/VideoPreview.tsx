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
  const [currentClipId, setCurrentClipId] = useState<string | null>(null);

  const clips = useClips();
  const overlays = useOverlays();
  const { isPlaying, currentTime, duration, volume, isMuted } = usePlaybackState();

  // Keep ref in sync with state
  currentTimeRef.current = currentTime;

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

  // Draw frame to canvas
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // Draw text overlays
    const activeOverlays = overlays.filter((o) => {
      const endTime = o.endTime ?? duration;
      return currentTime >= o.startTime && currentTime <= endTime;
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
  }, [overlays, currentTime, duration, selectedOverlayId]);

  // Handle video time updates during playback
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();

    const animate = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Use ref to get current time to avoid dependency on state
      const newTime = currentTimeRef.current + delta;
      setCurrentTime(newTime);

      drawFrame();

      if (newTime < duration) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
    // Note: currentTime intentionally excluded - we use currentTimeRef instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, duration, setCurrentTime, drawFrame]);

  // Update video source and position when currentTime changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || clips.length === 0) return;

    const result = getClipAtGlobalTime(clips, currentTime);
    if (!result) return;

    const { clip, localTime } = result;

    // Switch video source if clip changed
    if (clip.id !== currentClipId) {
      setCurrentClipId(clip.id);
      video.src = clip.sourceUrl;
      video.playbackRate = clip.speed;
      video.load();
    }

    // Seek to the correct position
    if (Math.abs(video.currentTime - localTime) > 0.1) {
      video.currentTime = localTime;
    }

    // Apply CSS filter
    if (canvasRef.current) {
      canvasRef.current.style.filter = getCssFilter(clip.filterPreset);
    }
  }, [clips, currentTime, currentClipId]);

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

    const handleCanPlay = () => drawFrame();
    const handleSeeked = () => drawFrame();

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [drawFrame]);

  // Resize canvas to container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawFrame();
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);

    return () => observer.disconnect();
  }, [drawFrame]);

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
    <div className="h-full flex flex-col">
      {/* Canvas container */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-black"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none' }}
        />
        <video ref={videoRef} className="hidden" muted={isMuted} playsInline />
      </div>

      {/* Controls */}
      <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-3">
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
