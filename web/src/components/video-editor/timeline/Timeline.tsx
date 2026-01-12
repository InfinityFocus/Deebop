'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import {
  useVideoEditorStore,
  useClips,
  usePlaybackState,
  VideoClip,
} from '@/stores/videoEditorStore';
import { getFilter } from '@/lib/video-filters';

interface TimelineProps {
  onAddClip: () => void;
  isUploading: boolean;
}

// Calculate effective duration of a clip
const getClipEffectiveDuration = (clip: VideoClip): number => {
  const trimEnd = clip.trimEnd ?? clip.sourceDuration;
  return (trimEnd - clip.trimStart) / clip.speed;
};

export default function Timeline({ onAddClip, isUploading }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragClipId, setDragClipId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [trimHandle, setTrimHandle] = useState<'start' | 'end' | null>(null);
  const [trimClipId, setTrimClipId] = useState<string | null>(null);

  const clips = useClips();
  const { currentTime, duration } = usePlaybackState();

  const seek = useVideoEditorStore((s) => s.seek);
  const selectClip = useVideoEditorStore((s) => s.selectClip);
  const selectedClipId = useVideoEditorStore((s) => s.selectedClipId);
  const removeClip = useVideoEditorStore((s) => s.removeClip);
  const updateClip = useVideoEditorStore((s) => s.updateClip);
  const reorderClips = useVideoEditorStore((s) => s.reorderClips);

  // Sort clips by sortOrder
  const sortedClips = [...clips].sort((a, b) => a.sortOrder - b.sortOrder);

  // Calculate total duration for timeline scale
  const totalDuration = clips.reduce(
    (sum, clip) => sum + getClipEffectiveDuration(clip),
    0
  );

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle timeline click to seek
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (isDragging || trimHandle) return;

    const timeline = timelineRef.current;
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * totalDuration);
  };

  // Handle clip selection
  const handleClipClick = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectClip(clipId);
  };

  // Handle trim handle drag start
  const handleTrimStart = (
    clipId: string,
    handle: 'start' | 'end',
    e: React.PointerEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setTrimHandle(handle);
    setTrimClipId(clipId);
    setDragStartX(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Handle trim drag move
  const handleTrimMove = (e: React.PointerEvent) => {
    if (!trimHandle || !trimClipId) return;

    const timeline = timelineRef.current;
    if (!timeline) return;

    const clip = clips.find((c) => c.id === trimClipId);
    if (!clip) return;

    const rect = timeline.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX;
    const deltaTime = (deltaX / rect.width) * totalDuration;

    if (trimHandle === 'start') {
      const newTrimStart = Math.max(
        0,
        Math.min(
          clip.trimStart + deltaTime * clip.speed,
          (clip.trimEnd ?? clip.sourceDuration) - 0.5
        )
      );
      updateClip(trimClipId, { trimStart: newTrimStart });
    } else {
      const trimEnd = clip.trimEnd ?? clip.sourceDuration;
      const newTrimEnd = Math.max(
        clip.trimStart + 0.5,
        Math.min(trimEnd + deltaTime * clip.speed, clip.sourceDuration)
      );
      updateClip(trimClipId, { trimEnd: newTrimEnd });
    }

    setDragStartX(e.clientX);
  };

  // Handle trim drag end
  const handleTrimEnd = (e: React.PointerEvent) => {
    if (trimHandle) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
    setTrimHandle(null);
    setTrimClipId(null);
  };

  // Handle clip reorder drag start
  const handleReorderStart = (clipId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragClipId(clipId);
    setDragStartX(e.clientX);
  };

  // Handle delete clip
  const handleDeleteClip = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeClip(clipId);
  };

  // Generate time markers
  const markers: { time: number; label: string }[] = [];
  const markerInterval = Math.max(5, Math.ceil(totalDuration / 10));
  for (let t = 0; t <= totalDuration; t += markerInterval) {
    markers.push({ time: t, label: formatTime(t) });
  }

  return (
    <div className="h-full flex flex-col">
      {/* Time ruler */}
      <div className="h-6 bg-zinc-800 border-b border-zinc-700 flex items-end px-2 relative">
        {markers.map((marker) => (
          <div
            key={marker.time}
            className="absolute text-[10px] text-zinc-500"
            style={{
              left: `${totalDuration > 0 ? (marker.time / totalDuration) * 100 : 0}%`,
            }}
          >
            <div className="w-px h-2 bg-zinc-600 mb-0.5" />
            {marker.label}
          </div>
        ))}
      </div>

      {/* Clips track */}
      <div
        ref={timelineRef}
        className="flex-1 bg-zinc-950 relative overflow-x-auto"
        onClick={handleTimelineClick}
        onPointerMove={trimHandle ? handleTrimMove : undefined}
        onPointerUp={handleTrimEnd}
      >
        {/* Clips container */}
        <div className="h-full flex items-center gap-1 p-2 min-w-max">
          {sortedClips.map((clip) => {
            const effectiveDuration = getClipEffectiveDuration(clip);
            const widthPercent =
              totalDuration > 0
                ? (effectiveDuration / totalDuration) * 100
                : 100;
            const filter = getFilter(clip.filterPreset || 'none');
            const isSelected = clip.id === selectedClipId;

            return (
              <div
                key={clip.id}
                className={`relative h-20 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-950'
                    : 'hover:ring-1 hover:ring-zinc-600'
                }`}
                style={{
                  width: `${Math.max(80, widthPercent * 6)}px`,
                  minWidth: '80px',
                }}
                onClick={(e) => handleClipClick(clip.id, e)}
              >
                {/* Clip thumbnail/preview */}
                <div
                  className="absolute inset-0 bg-zinc-800"
                  style={{
                    background: filter.thumbnail,
                  }}
                >
                  {/* Video thumbnail could be loaded here */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-white/60 font-mono">
                      {formatTime(effectiveDuration)}
                    </span>
                  </div>
                </div>

                {/* Clip label */}
                <div className="absolute top-1 left-1 right-1 flex items-center justify-between">
                  <span className="text-[10px] text-white/80 bg-black/50 px-1.5 py-0.5 rounded truncate max-w-[60%]">
                    Clip {clip.sortOrder + 1}
                  </span>
                  {clip.speed !== 1 && (
                    <span className="text-[10px] text-yellow-400 bg-black/50 px-1.5 py-0.5 rounded">
                      {clip.speed}x
                    </span>
                  )}
                </div>

                {/* Trim handles - only show when selected */}
                {isSelected && (
                  <>
                    {/* Left trim handle */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-3 bg-emerald-500/80 cursor-ew-resize flex items-center justify-center hover:bg-emerald-500 transition"
                      onPointerDown={(e) => handleTrimStart(clip.id, 'start', e)}
                    >
                      <div className="w-0.5 h-8 bg-white rounded-full" />
                    </div>

                    {/* Right trim handle */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-3 bg-emerald-500/80 cursor-ew-resize flex items-center justify-center hover:bg-emerald-500 transition"
                      onPointerDown={(e) => handleTrimStart(clip.id, 'end', e)}
                    >
                      <div className="w-0.5 h-8 bg-white rounded-full" />
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteClip(clip.id, e)}
                      className="absolute top-1 right-1 p-1 bg-red-500/80 rounded hover:bg-red-500 transition"
                    >
                      <Trash2 size={12} className="text-white" />
                    </button>

                    {/* Drag handle */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 bottom-1 p-1 bg-zinc-700/80 rounded cursor-grab active:cursor-grabbing"
                      onPointerDown={(e) => handleReorderStart(clip.id, e)}
                    >
                      <GripVertical size={12} className="text-white" />
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Add clip button */}
          <button
            onClick={onAddClip}
            disabled={isUploading}
            className="h-20 w-20 flex-shrink-0 rounded-lg border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 disabled:opacity-50 transition"
          >
            {isUploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Plus size={20} />
            )}
            <span className="text-[10px]">Add clip</span>
          </button>
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
          style={{
            left: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%`,
          }}
        >
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
        </div>
      </div>

      {/* Overlay track (simplified view) */}
      <div className="h-8 bg-zinc-900 border-t border-zinc-800 px-2 flex items-center">
        <span className="text-[10px] text-zinc-500 mr-2">Overlays</span>
        <div className="flex-1 h-4 bg-zinc-800 rounded relative">
          {/* Overlay markers would go here */}
        </div>
      </div>
    </div>
  );
}
