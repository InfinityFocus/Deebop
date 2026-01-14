'use client';

import type { EmbedTheme, EmbedContentType } from '@/types/embed';

interface EmbedCustomizerProps {
  mode: 'feed' | 'post';
  theme: EmbedTheme;
  setTheme: (theme: EmbedTheme) => void;
  width: string;
  setWidth: (width: string) => void;
  height: string;
  setHeight: (height: string) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  limit: number;
  setLimit: (limit: number) => void;
  contentType: EmbedContentType;
  setContentType: (type: EmbedContentType) => void;
  showEngagement: boolean;
  setShowEngagement: (show: boolean) => void;
}

export function EmbedCustomizer({
  mode,
  theme,
  setTheme,
  width,
  setWidth,
  height,
  setHeight,
  backgroundColor,
  setBackgroundColor,
  accentColor,
  setAccentColor,
  limit,
  setLimit,
  contentType,
  setContentType,
  showEngagement,
  setShowEngagement,
}: EmbedCustomizerProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-4">
      <h3 className="font-semibold text-white">Customize</h3>

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
              theme === 'dark'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
              theme === 'light'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Light
          </button>
        </div>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Width</label>
          <input
            type="text"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="400px or 100%"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Height</label>
          <input
            type="text"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="600px"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Background Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={backgroundColor || (theme === 'dark' ? '#111827' : '#ffffff')}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-10 h-10 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              placeholder="Default"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Accent Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={accentColor || '#10b981'}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-10 h-10 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#10b981"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Feed-specific options */}
      {mode === 'feed' && (
        <>
          {/* Post limit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Posts to Show ({limit})
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>50</span>
            </div>
          </div>

          {/* Content type filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as EmbedContentType)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="shout">Shouts Only</option>
              <option value="image">Images Only</option>
              <option value="video">Videos Only</option>
              <option value="audio">Audio Only</option>
              <option value="panorama360">360° Only</option>
            </select>
          </div>
        </>
      )}

      {/* Show engagement toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Show Likes & Reposts</label>
        <button
          onClick={() => setShowEngagement(!showEngagement)}
          className={`relative w-11 h-6 rounded-full transition ${
            showEngagement ? 'bg-emerald-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              showEngagement ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
