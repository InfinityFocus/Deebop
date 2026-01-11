'use client';

import { useMemo } from 'react';
import type { SpotifyEmbedBlockData } from '@/types/creator-page';

interface SpotifyEmbedBlockProps {
  data: SpotifyEmbedBlockData | Record<string, unknown>;
}

// Convert Spotify share URL to embed URL
function getSpotifyEmbedUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Check if it's a Spotify URL
    if (!urlObj.hostname.includes('spotify.com')) {
      return null;
    }

    // Already an embed URL
    if (urlObj.pathname.startsWith('/embed/')) {
      return url;
    }

    // Convert share URL to embed URL
    // /track/xxx → /embed/track/xxx
    // /album/xxx → /embed/album/xxx
    // /playlist/xxx → /embed/playlist/xxx
    // /artist/xxx → /embed/artist/xxx
    const match = urlObj.pathname.match(/^\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
    }

    return null;
  } catch {
    return null;
  }
}

export function SpotifyEmbedBlock({ data }: SpotifyEmbedBlockProps) {
  const blockData = data as SpotifyEmbedBlockData;
  const spotifyUrl = blockData.spotifyUrl || '';
  const height = blockData.height || 'full';
  const theme = blockData.theme || 'dark';

  const embedUrl = useMemo(() => getSpotifyEmbedUrl(spotifyUrl), [spotifyUrl]);

  if (!embedUrl) {
    return (
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 text-center">
        <p className="text-gray-400">Invalid Spotify URL</p>
        <p className="text-sm text-gray-500 mt-1">
          Paste a Spotify track, album, playlist, or artist link
        </p>
      </div>
    );
  }

  // Height based on type
  // Compact: 80px for single track mini player
  // Full: 352px for full player with artwork
  const iframeHeight = height === 'compact' ? 80 : 352;

  // Add theme parameter
  const finalUrl = `${embedUrl}?theme=${theme === 'light' ? '0' : '1'}`;

  return (
    <div className="space-y-4">
      {blockData.heading && (
        <h3 className="text-lg font-semibold text-white text-center">
          {blockData.heading}
        </h3>
      )}

      <div
        className="rounded-xl overflow-hidden"
        style={{ height: iframeHeight }}
      >
        <iframe
          src={finalUrl}
          width="100%"
          height={iframeHeight}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl"
        />
      </div>
    </div>
  );
}
