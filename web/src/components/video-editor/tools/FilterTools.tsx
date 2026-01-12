'use client';

import { useVideoEditorStore, useSelectedClip } from '@/stores/videoEditorStore';
import { getFilterList } from '@/lib/video-filters';

export default function FilterTools() {
  const selectedClip = useSelectedClip();
  const updateClip = useVideoEditorStore((s) => s.updateClip);
  const clips = useVideoEditorStore((s) => s.clips);

  const filters = getFilterList();

  const handleFilterSelect = (filterId: string) => {
    if (!selectedClip) return;
    updateClip(selectedClip.id, {
      filterPreset: filterId === 'none' ? null : filterId,
    });
  };

  // Apply filter to all clips
  const handleApplyToAll = (filterId: string) => {
    const filterValue = filterId === 'none' ? null : filterId;
    clips.forEach((clip) => {
      updateClip(clip.id, { filterPreset: filterValue });
    });
  };

  if (!selectedClip) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500 text-sm">
          Select a clip to apply filters
        </p>
      </div>
    );
  }

  const currentFilter = selectedClip.filterPreset || 'none';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Video Filters</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Filters are applied per-clip. Select a clip in the timeline to change
          its filter.
        </p>

        {/* Filter grid */}
        <div className="grid grid-cols-3 gap-2">
          {filters.map((filter) => {
            const isSelected = currentFilter === filter.id;

            return (
              <button
                key={filter.id}
                onClick={() => handleFilterSelect(filter.id)}
                className={`relative aspect-square rounded-lg overflow-hidden transition ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-900'
                    : 'hover:ring-1 hover:ring-zinc-600'
                }`}
              >
                {/* Filter preview thumbnail */}
                <div
                  className="absolute inset-0"
                  style={{ background: filter.thumbnail }}
                />

                {/* Filter name */}
                <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                  <span className="text-[10px] font-medium text-white">
                    {filter.name}
                  </span>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current filter info */}
      {currentFilter !== 'none' && (
        <div className="p-3 rounded-lg bg-zinc-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-white">
              {filters.find((f) => f.id === currentFilter)?.name}
            </span>
            <button
              onClick={() => handleFilterSelect('none')}
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              Remove
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            {filters.find((f) => f.id === currentFilter)?.description}
          </p>
        </div>
      )}

      {/* Apply to all clips */}
      {clips.length > 1 && (
        <div className="pt-4 border-t border-zinc-800">
          <h4 className="text-xs font-medium text-zinc-400 mb-2">Quick Actions</h4>
          <button
            onClick={() => handleApplyToAll(currentFilter)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-sm text-white hover:bg-zinc-700 transition"
          >
            Apply &quot;{filters.find((f) => f.id === currentFilter)?.name}&quot; to all clips
          </button>
        </div>
      )}
    </div>
  );
}
