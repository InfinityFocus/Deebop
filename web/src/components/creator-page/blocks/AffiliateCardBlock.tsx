'use client';

import Image from 'next/image';
import { ExternalLink, Tag } from 'lucide-react';
import type { AffiliateCardBlockData } from '@/types/creator-page';

interface AffiliateCardBlockProps {
  data: AffiliateCardBlockData | Record<string, unknown>;
  onClick?: () => void;
}

export function AffiliateCardBlock({ data, onClick }: AffiliateCardBlockProps) {
  const cardData = data as AffiliateCardBlockData;

  const handleClick = () => {
    onClick?.();
  };

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
      {/* Affiliate Badge - Always shown */}
      <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
        <Tag size={14} className="text-amber-400" />
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Affiliate
        </span>
      </div>

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
          <p className="text-gray-400 text-sm mb-2">{cardData.description}</p>
        )}

        {/* Price Note */}
        {cardData.priceNote && (
          <p className="text-emerald-400 font-semibold mb-2">{cardData.priceNote}</p>
        )}

        {/* Coupon Code */}
        {cardData.couponCode && (
          <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-dashed border-gray-600">
            <p className="text-xs text-gray-500 mb-1">Use code:</p>
            <p className="text-lg font-mono font-bold text-white tracking-wider">
              {cardData.couponCode}
            </p>
          </div>
        )}

        {/* CTA Button */}
        <a
          href={cardData.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition"
        >
          {cardData.ctaLabel}
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}
