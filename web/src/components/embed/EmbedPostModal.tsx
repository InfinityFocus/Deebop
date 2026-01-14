'use client';

import { useState, useCallback } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { generateEmbedCode, generateEmbedUrl, EMBED_THEME_DEFAULTS } from '@/types/embed';
import type { EmbedTheme, PostEmbedConfig } from '@/types/embed';

interface EmbedPostModalProps {
  postId: string;
  onClose: () => void;
}

export function EmbedPostModal({ postId, onClose }: EmbedPostModalProps) {
  const [theme, setTheme] = useState<EmbedTheme>('dark');
  const [width, setWidth] = useState('400');
  const [height, setHeight] = useState('auto');
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://deebop.com';

  const config: PostEmbedConfig = {
    type: 'post',
    postId,
    theme,
    width: width.includes('%') || width.includes('px') ? width : `${width}px`,
    height: height === 'auto' ? 'auto' : (height.includes('%') || height.includes('px') ? height : `${height}px`),
    showEngagement: true,
  };

  const embedCode = generateEmbedCode(config, baseUrl);
  const embedUrl = generateEmbedUrl(config, baseUrl);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = embedCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [embedCode]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-lg w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Embed Post</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          Copy the code below to embed this post on your website.
        </p>

        {/* Quick settings */}
        <div className="space-y-4 mb-6">
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

          {/* Width */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Width</label>
            <input
              type="text"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="400px or 100%"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Embed Code */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Embed Code</span>
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-400 hover:text-white transition"
              title="Preview in new tab"
            >
              <ExternalLink size={16} />
            </a>
          </div>
          <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto text-xs text-gray-300 font-mono whitespace-pre-wrap break-all mb-3">
            {embedCode}
          </pre>
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition"
          >
            {copied ? (
              <>
                <Check size={18} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Embed Code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
