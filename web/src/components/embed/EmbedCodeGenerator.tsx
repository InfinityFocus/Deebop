'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { EmbedCustomizer } from './EmbedCustomizer';
import { EmbedPreview } from './EmbedPreview';
import { generateEmbedCode, generateEmbedUrl } from '@/types/embed';
import type { EmbedConfigUnion, EmbedTheme, EmbedContentType, EmbedLayout } from '@/types/embed';

interface EmbedCodeGeneratorProps {
  username: string;
  postId?: string;
  mode: 'feed' | 'post';
  baseUrl: string;
}

export function EmbedCodeGenerator({
  username,
  postId,
  mode,
  baseUrl,
}: EmbedCodeGeneratorProps) {
  const [theme, setTheme] = useState<EmbedTheme>('dark');
  const [fullWidth, setFullWidth] = useState(false);
  const [width, setWidth] = useState('400');
  const [height, setHeight] = useState('600');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [limit, setLimit] = useState(10);
  const [contentType, setContentType] = useState<EmbedContentType>('all');
  const [layout, setLayout] = useState<EmbedLayout>('vertical');
  const [showEngagement, setShowEngagement] = useState(true);
  const [borderRadius, setBorderRadius] = useState('12px');
  const [borderWidth, setBorderWidth] = useState('1px');
  const [borderColor, setBorderColor] = useState('');
  const [copied, setCopied] = useState(false);

  // Compute actual width value
  const actualWidth = fullWidth ? '100%' : (width.includes('%') || width.includes('px') ? width : `${width}px`);

  // Build config object
  const config: EmbedConfigUnion = mode === 'feed'
    ? {
        type: 'feed',
        username,
        theme,
        width: actualWidth,
        height: height.includes('%') || height.includes('px') ? height : `${height}px`,
        backgroundColor: backgroundColor || undefined,
        accentColor: accentColor || undefined,
        showEngagement,
        limit,
        contentType,
        layout,
        borderRadius: borderRadius || undefined,
        borderWidth: borderWidth || undefined,
        borderColor: borderColor || undefined,
      }
    : {
        type: 'post',
        postId: postId || '',
        theme,
        width: actualWidth,
        height: height.includes('%') || height.includes('px') ? height : `${height}px`,
        backgroundColor: backgroundColor || undefined,
        accentColor: accentColor || undefined,
        showEngagement,
        borderRadius: borderRadius || undefined,
        borderWidth: borderWidth || undefined,
        borderColor: borderColor || undefined,
      };

  const embedCode = generateEmbedCode(config, baseUrl);
  const embedUrl = generateEmbedUrl(config, baseUrl);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">
          {mode === 'feed' ? 'Embed Your Feed' : 'Embed This Post'}
        </h2>
        <p className="text-gray-400 mt-1">
          {mode === 'feed'
            ? 'Add your Deebop feed to any website using the embed code below.'
            : 'Share this post on any website using the embed code below.'}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Customization Controls */}
        <div className="space-y-6">
          <EmbedCustomizer
            mode={mode}
            theme={theme}
            setTheme={setTheme}
            fullWidth={fullWidth}
            setFullWidth={setFullWidth}
            width={width}
            setWidth={setWidth}
            height={height}
            setHeight={setHeight}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            limit={limit}
            setLimit={setLimit}
            contentType={contentType}
            setContentType={setContentType}
            layout={layout}
            setLayout={setLayout}
            showEngagement={showEngagement}
            setShowEngagement={setShowEngagement}
            borderRadius={borderRadius}
            setBorderRadius={setBorderRadius}
            borderWidth={borderWidth}
            setBorderWidth={setBorderWidth}
            borderColor={borderColor}
            setBorderColor={setBorderColor}
          />

          {/* Embed Code */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Embed Code</h3>
              <div className="flex items-center gap-2">
                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-white transition"
                  title="Preview in new tab"
                >
                  <ExternalLink size={18} />
                </a>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
            </div>
            <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto text-sm text-gray-300 font-mono whitespace-pre-wrap break-all">
              {embedCode}
            </pre>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <h3 className="font-semibold text-white mb-3">Preview</h3>
          <EmbedPreview config={config} baseUrl={baseUrl} />
        </div>
      </div>
    </div>
  );
}
