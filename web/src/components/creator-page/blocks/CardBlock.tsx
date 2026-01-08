'use client';

import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import type { CardBlockData } from '@/types/creator-page';

interface CardBlockProps {
  data: CardBlockData | Record<string, unknown>;
  onClick?: () => void;
}

export function CardBlock({ data, onClick }: CardBlockProps) {
  const cardData = data as CardBlockData;

  const handleClick = () => {
    onClick?.();
  };

  return (
    <div
      className={`bg-gray-800 rounded-2xl overflow-hidden border ${
        cardData.highlight
          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
          : 'border-gray-700'
      }`}
    >
      {/* Image */}
      {cardData.imageUrl && (
        <div className="relative w-full aspect-video">
          <Image
            src={cardData.imageUrl}
            alt={cardData.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-1">{cardData.title}</h3>

        {cardData.description && (
          <p className="text-gray-400 text-sm mb-4">{cardData.description}</p>
        )}

        {/* CTA Button */}
        <a
          href={cardData.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className={`inline-flex items-center justify-center gap-2 w-full px-4 py-3 font-semibold rounded-xl transition ${
            cardData.highlight
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          {cardData.ctaLabel}
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}
