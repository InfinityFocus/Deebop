'use client';

import { useState } from 'react';
import { Plus, Trash2, Type, AlignCenter } from 'lucide-react';
import {
  useVideoEditorStore,
  useOverlays,
  useSelectedOverlay,
  usePlaybackState,
} from '@/stores/videoEditorStore';
import { FONT_OPTIONS, TEXT_COLOR_PRESETS } from '@/lib/video-filters';

export default function TextOverlayTools() {
  const [newText, setNewText] = useState('');

  const overlays = useOverlays();
  const selectedOverlay = useSelectedOverlay();
  const { currentTime, duration } = usePlaybackState();

  const addOverlay = useVideoEditorStore((s) => s.addOverlay);
  const removeOverlay = useVideoEditorStore((s) => s.removeOverlay);
  const updateOverlay = useVideoEditorStore((s) => s.updateOverlay);
  const selectOverlay = useVideoEditorStore((s) => s.selectOverlay);
  const seek = useVideoEditorStore((s) => s.seek);

  const handleAddOverlay = () => {
    if (!newText.trim()) return;
    if (duration <= 0) return; // No video loaded

    // Clamp start time to valid range
    const startTime = Math.max(0, Math.min(currentTime, duration - 0.1));
    // Default 5 second duration, clamped to video end
    const endTime = Math.min(startTime + 5, duration);

    console.log('[TextOverlayTools] Adding overlay:', { startTime, endTime, duration, currentTime });

    addOverlay({
      type: 'text',
      positionX: 50,
      positionY: 50,
      startTime,
      endTime,
      text: newText.trim(),
      fontFamily: 'sans-serif',
      fontSize: 32,
      fontColor: '#FFFFFF',
      backgroundColor: null,
    });

    // Seek to the overlay's start time so it's immediately visible
    seek(startTime);
    setNewText('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Add new text */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Add Text</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddOverlay()}
            placeholder="Enter text..."
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={handleAddOverlay}
            disabled={!newText.trim()}
            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Existing overlays list */}
      {overlays.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Text Overlays</h3>
          <div className="space-y-2">
            {overlays.map((overlay) => (
              <div
                key={overlay.id}
                onClick={() => selectOverlay(overlay.id)}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  selectedOverlay?.id === overlay.id
                    ? 'bg-emerald-600/20 ring-1 ring-emerald-500'
                    : 'bg-zinc-800 hover:bg-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white truncate flex-1">
                    {overlay.text}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOverlay(overlay.id);
                    }}
                    className="p-1 text-zinc-400 hover:text-red-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="text-xs text-zinc-500">
                  {formatTime(overlay.startTime)} -{' '}
                  {formatTime(overlay.endTime ?? duration)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected overlay editor */}
      {selectedOverlay && (
        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <h3 className="text-sm font-medium text-white">Edit Text</h3>

          {/* Text content */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Content</label>
            <input
              type="text"
              value={selectedOverlay.text}
              onChange={(e) =>
                updateOverlay(selectedOverlay.id, { text: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Font family */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Font</label>
            <select
              value={selectedOverlay.fontFamily}
              onChange={(e) =>
                updateOverlay(selectedOverlay.id, { fontFamily: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.id} value={font.fontFamily}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          {/* Font size */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Size: {selectedOverlay.fontSize}px
            </label>
            <input
              type="range"
              min="16"
              max="96"
              value={selectedOverlay.fontSize}
              onChange={(e) =>
                updateOverlay(selectedOverlay.id, {
                  fontSize: parseInt(e.target.value),
                })
              }
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Text color */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2">
              Text Color
            </label>
            <div className="flex flex-wrap gap-2">
              {TEXT_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    updateOverlay(selectedOverlay.id, { fontColor: color })
                  }
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    selectedOverlay.fontColor === color
                      ? 'border-emerald-500 scale-110'
                      : 'border-zinc-600 hover:border-zinc-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={selectedOverlay.fontColor}
                onChange={(e) =>
                  updateOverlay(selectedOverlay.id, { fontColor: e.target.value })
                }
                className="w-7 h-7 rounded-full cursor-pointer"
              />
            </div>
          </div>

          {/* Background color */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2">
              Background
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  updateOverlay(selectedOverlay.id, { backgroundColor: null })
                }
                className={`px-3 py-1.5 rounded text-xs transition ${
                  !selectedOverlay.backgroundColor
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                None
              </button>
              <input
                type="color"
                value={selectedOverlay.backgroundColor || '#000000'}
                onChange={(e) =>
                  updateOverlay(selectedOverlay.id, {
                    backgroundColor: e.target.value,
                  })
                }
                className="w-7 h-7 rounded cursor-pointer"
              />
              {selectedOverlay.backgroundColor && (
                <span className="text-xs text-zinc-500">
                  {selectedOverlay.backgroundColor}
                </span>
              )}
            </div>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Start: {formatTime(selectedOverlay.startTime)}
              </label>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={selectedOverlay.startTime}
                onChange={(e) =>
                  updateOverlay(selectedOverlay.id, {
                    startTime: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                End: {formatTime(selectedOverlay.endTime ?? duration)}
              </label>
              <input
                type="range"
                min={selectedOverlay.startTime}
                max={duration}
                step="0.1"
                value={selectedOverlay.endTime ?? duration}
                onChange={(e) =>
                  updateOverlay(selectedOverlay.id, {
                    endTime: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          {/* Position hint */}
          <div className="text-xs text-zinc-500 flex items-center gap-2">
            <AlignCenter size={14} />
            Drag text in preview to reposition
          </div>
        </div>
      )}
    </div>
  );
}
