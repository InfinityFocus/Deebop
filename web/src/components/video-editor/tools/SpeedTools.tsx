'use client';

import { useVideoEditorStore, useSelectedClip, useIsOverLimit } from '@/stores/videoEditorStore';
import { SPEED_PRESETS } from '@/lib/video-filters';
import { AlertTriangle } from 'lucide-react';

export default function SpeedTools() {
  const selectedClip = useSelectedClip();
  const updateClip = useVideoEditorStore((s) => s.updateClip);
  const clips = useVideoEditorStore((s) => s.clips);
  const isOverLimit = useIsOverLimit();
  const maxDuration = useVideoEditorStore((s) => s.maxDurationSeconds);
  const currentDuration = useVideoEditorStore((s) => s.currentDurationSeconds);

  const handleSpeedChange = (speed: number) => {
    if (!selectedClip) return;
    updateClip(selectedClip.id, { speed });
  };

  const handleVolumeChange = (volume: number) => {
    if (!selectedClip) return;
    updateClip(selectedClip.id, { volume });
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate effective duration of selected clip
  const getClipEffectiveDuration = () => {
    if (!selectedClip) return 0;
    const trimEnd = selectedClip.trimEnd ?? selectedClip.sourceDuration;
    return (trimEnd - selectedClip.trimStart) / selectedClip.speed;
  };

  if (!selectedClip) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500 text-sm">
          Select a clip to adjust speed and audio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Duration warning */}
      {isOverLimit && (
        <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm flex items-start gap-2">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Duration exceeded</p>
            <p className="text-xs mt-1">
              Your video is {formatTime(currentDuration)} but max is{' '}
              {formatTime(maxDuration)}. Try speeding up clips or trimming.
            </p>
          </div>
        </div>
      )}

      {/* Speed presets */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Playback Speed</h3>
        <div className="grid grid-cols-4 gap-2">
          {SPEED_PRESETS.map((preset) => {
            const isSelected = selectedClip.speed === preset.value;

            return (
              <button
                key={preset.value}
                onClick={() => handleSpeedChange(preset.value)}
                className={`py-2 px-2 rounded-lg text-sm font-medium transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom speed slider */}
      <div>
        <label className="block text-xs text-zinc-400 mb-2">
          Custom Speed: {selectedClip.speed.toFixed(2)}x
        </label>
        <input
          type="range"
          min="0.25"
          max="2"
          step="0.05"
          value={selectedClip.speed}
          onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>0.25x (slower)</span>
          <span>2x (faster)</span>
        </div>
      </div>

      {/* Clip duration info */}
      <div className="p-3 rounded-lg bg-zinc-800">
        <h4 className="text-xs font-medium text-zinc-400 mb-2">Clip Info</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Source duration</span>
            <span className="text-white">
              {formatTime(selectedClip.sourceDuration)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Trimmed duration</span>
            <span className="text-white">
              {formatTime(
                (selectedClip.trimEnd ?? selectedClip.sourceDuration) -
                  selectedClip.trimStart
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Effective duration</span>
            <span className="text-emerald-400 font-medium">
              {formatTime(getClipEffectiveDuration())}
            </span>
          </div>
        </div>
      </div>

      {/* Volume control */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Audio Volume</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-2">
              Volume: {Math.round(selectedClip.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedClip.volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleVolumeChange(0)}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition ${
                selectedClip.volume === 0
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Mute
            </button>
            <button
              onClick={() => handleVolumeChange(0.5)}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition ${
                selectedClip.volume === 0.5
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              50%
            </button>
            <button
              onClick={() => handleVolumeChange(1)}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition ${
                selectedClip.volume === 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              100%
            </button>
          </div>
        </div>
      </div>

      {/* Speed tips */}
      <div className="text-xs text-zinc-500 space-y-1">
        <p>
          <strong className="text-zinc-400">Tip:</strong> Speeding up clips
          reduces total duration. Use this to fit more content within your tier
          limit.
        </p>
        <p>
          Audio pitch is preserved when changing speed during export.
        </p>
      </div>
    </div>
  );
}
