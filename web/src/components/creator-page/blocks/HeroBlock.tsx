'use client';

import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import type { HeroBlockData } from '@/types/creator-page';

interface HeroBlockProps {
  data: HeroBlockData | Record<string, unknown>;
  user: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  onCtaClick?: () => void;
}

export function HeroBlock({ data, user, onCtaClick }: HeroBlockProps) {
  const heroData = data as HeroBlockData;
  const alignment = heroData.alignment || 'center';
  const bio = heroData.bio || user.bio;
  const name = user.displayName || `@${user.username}`;

  const handleCtaClick = () => {
    onCtaClick?.();
  };

  return (
    <div
      className={`${
        alignment === 'center' ? 'text-center' : 'text-left'
      }`}
    >
      {/* Avatar */}
      <div className={`mb-4 ${alignment === 'center' ? 'flex justify-center' : ''}`}>
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={name}
            width={96}
            height={96}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-800"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name */}
      <h1 className="text-2xl font-bold text-white mb-1">{name}</h1>

      {/* Headline */}
      {heroData.headline && (
        <p className="text-lg text-emerald-400 mb-2">{heroData.headline}</p>
      )}

      {/* Bio */}
      {bio && (
        <p className="text-gray-400 mb-4 whitespace-pre-wrap">{bio}</p>
      )}

      {/* CTA Button */}
      {heroData.ctaUrl && heroData.ctaLabel && (
        <a
          href={heroData.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCtaClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition"
        >
          {heroData.ctaLabel}
          <ExternalLink size={16} />
        </a>
      )}
    </div>
  );
}
