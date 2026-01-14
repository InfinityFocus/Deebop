'use client';

import type { EmbedTheme, EmbedContentType, EmbedLayout } from '@/types/embed';

interface EmbedCustomizerProps {
  mode: 'feed' | 'post';
  theme: EmbedTheme;
  setTheme: (theme: EmbedTheme) => void;
  fullWidth: boolean;
  setFullWidth: (fullWidth: boolean) => void;
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
  layout: EmbedLayout;
  setLayout: (layout: EmbedLayout) => void;
  showEngagement: boolean;
  setShowEngagement: (show: boolean) => void;
  borderRadius: string;
  setBorderRadius: (radius: string) => void;
  borderWidth: string;
  setBorderWidth: (width: string) => void;
  borderColor: string;
  setBorderColor: (color: string) => void;
}

export function EmbedCustomizer({
  mode,
  theme,
  setTheme,
  fullWidth,
  setFullWidth,
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
  layout,
  setLayout,
  showEngagement,
  setShowEngagement,
  borderRadius,
  setBorderRadius,
  borderWidth,
  setBorderWidth,
  borderColor,
  setBorderColor,
}: EmbedCustomizerProps) {
  // Parse numeric width for slider
  const numericWidth = parseInt(width) || 400;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-4 overflow-hidden">
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

      {/* Layout (feed only) */}
      {mode === 'feed' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Layout</label>
          <div className="flex gap-2">
            <button
              onClick={() => setLayout('vertical')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                layout === 'vertical'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="6" rx="1" />
                <rect x="3" y="11" width="18" height="6" rx="1" />
              </svg>
              Vertical
            </button>
            <button
              onClick={() => setLayout('horizontal')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                layout === 'horizontal'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="18" rx="1" />
              </svg>
              Horizontal
            </button>
          </div>
        </div>
      )}

      {/* Width Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Full Width</label>
          <button
            onClick={() => {
              setFullWidth(!fullWidth);
              if (!fullWidth) {
                setWidth('100%');
              } else {
                setWidth('400');
              }
            }}
            className={`relative w-11 h-6 rounded-full transition ${
              fullWidth ? 'bg-emerald-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                fullWidth ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {!fullWidth && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Width ({numericWidth}px)
            </label>
            <input
              type="range"
              min="200"
              max="800"
              value={numericWidth}
              onChange={(e) => setWidth(e.target.value)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>200px</span>
              <span>800px</span>
            </div>
          </div>
        )}

        {/* Height */}
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

      {/* Border Options */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">Border</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Radius</label>
            <select
              value={borderRadius}
              onChange={(e) => setBorderRadius(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">None</option>
              <option value="4px">Small (4px)</option>
              <option value="8px">Medium (8px)</option>
              <option value="12px">Large (12px)</option>
              <option value="16px">Extra Large (16px)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Width</label>
            <select
              value={borderWidth}
              onChange={(e) => setBorderWidth(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">None</option>
              <option value="1px">Thin (1px)</option>
              <option value="2px">Medium (2px)</option>
              <option value="3px">Thick (3px)</option>
            </select>
          </div>
        </div>
        {borderWidth && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Border Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={borderColor || (theme === 'dark' ? '#374151' : '#e5e7eb')}
                onChange={(e) => setBorderColor(e.target.value)}
                className="w-10 h-10 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                placeholder="Default"
                className="flex-1 min-w-0 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">Colors</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Background</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={backgroundColor || (theme === 'dark' ? '#111827' : '#ffffff')}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-10 h-10 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="Default"
                className="flex-1 min-w-0 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Accent</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={accentColor || '#10b981'}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#10b981"
                className="flex-1 min-w-0 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
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
