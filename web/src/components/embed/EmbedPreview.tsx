'use client';

import { useState, useEffect, useMemo } from 'react';
import { generateEmbedUrl } from '@/types/embed';
import type { EmbedConfigUnion } from '@/types/embed';

interface EmbedPreviewProps {
  config: EmbedConfigUnion;
  baseUrl: string;
}

export function EmbedPreview({ config, baseUrl }: EmbedPreviewProps) {
  const [key, setKey] = useState(0);

  // Debounce URL generation to avoid too many iframe reloads
  const [debouncedConfig, setDebouncedConfig] = useState(config);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedConfig(config);
      setKey((k) => k + 1); // Force iframe refresh
    }, 500);

    return () => clearTimeout(timer);
  }, [config]);

  const embedUrl = useMemo(
    () => generateEmbedUrl(debouncedConfig, baseUrl),
    [debouncedConfig, baseUrl]
  );

  // Parse dimensions
  const parseSize = (value: string): string => {
    if (value.includes('%') || value.includes('px')) {
      return value;
    }
    return `${value}px`;
  };

  const width = parseSize(config.width);
  const height = parseSize(config.height);

  // Max preview dimensions
  const maxPreviewWidth = 500;
  const maxPreviewHeight = 600;

  // Calculate preview scale if needed
  const numericWidth = parseInt(width) || 400;
  const numericHeight = parseInt(height) || 600;

  const isPercentWidth = width.includes('%');
  const isPercentHeight = height.includes('%');

  // For percentage widths, use max preview width
  const effectiveWidth = isPercentWidth ? maxPreviewWidth : Math.min(numericWidth, maxPreviewWidth);
  const effectiveHeight = isPercentHeight ? maxPreviewHeight : Math.min(numericHeight, maxPreviewHeight);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      {/* Checkered background to show transparency */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #1f2937 25%, transparent 25%),
            linear-gradient(-45deg, #1f2937 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #1f2937 75%),
            linear-gradient(-45deg, transparent 75%, #1f2937 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }}
      />

      {/* Preview container */}
      <div
        className="relative flex items-center justify-center p-4"
        style={{
          minHeight: Math.min(effectiveHeight + 32, maxPreviewHeight + 32),
        }}
      >
        <iframe
          key={key}
          src={embedUrl}
          width={effectiveWidth}
          height={effectiveHeight}
          style={{
            border: 'none',
            borderRadius: '8px',
            maxWidth: '100%',
          }}
          sandbox="allow-scripts allow-same-origin allow-popups"
          loading="lazy"
          title="Embed preview"
        />
      </div>

      {/* Dimension indicator */}
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-gray-400">
        {width} × {height}
      </div>
    </div>
  );
}
