'use client';

import { ExternalLink, Megaphone } from 'lucide-react';

interface Ad {
  id: string;
  image_url: string;
  headline: string;
  destination_url: string;
}

interface AdCardProps {
  ad: Ad;
}

export function AdCard({ ad }: AdCardProps) {
  const handleClick = async () => {
    // Track click
    try {
      await fetch(`/api/ads/click/${ad.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ad' }),
      });
    } catch {
      // Ignore tracking errors
    }

    // Open destination
    window.open(ad.destination_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <article className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Sponsored label */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Megaphone size={14} />
          <span>Sponsored</span>
        </div>
      </div>

      {/* Ad content */}
      <button
        onClick={handleClick}
        className="w-full text-left group"
      >
        {/* Image */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={ad.image_url}
            alt={ad.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Headline and CTA */}
        <div className="p-4">
          <h3 className="text-white font-semibold mb-2 group-hover:text-purple-400 transition-colors">
            {ad.headline}
          </h3>
          <div className="flex items-center gap-1 text-sm text-purple-400">
            <span>Learn more</span>
            <ExternalLink size={14} />
          </div>
        </div>
      </button>
    </article>
  );
}
