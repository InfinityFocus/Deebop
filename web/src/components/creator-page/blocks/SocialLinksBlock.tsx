'use client';

import {
  Instagram,
  Youtube,
  Linkedin,
  X,
  Globe,
  Music,
  Music2,
  Cloud,
  Twitch,
  MessageCircle,
  Github,
  Mail,
} from 'lucide-react';
import type { SocialLinksBlockData, SocialPlatform } from '@/types/creator-page';

interface SocialLinksBlockProps {
  data: SocialLinksBlockData | Record<string, unknown>;
  onLinkClick?: (index: number) => void;
}

const PLATFORM_ICONS: Record<SocialPlatform, React.ComponentType<{ size?: number; className?: string }>> = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music2,
  linkedin: Linkedin,
  x: X,
  website: Globe,
  spotify: Music,
  soundcloud: Cloud,
  twitch: Twitch,
  discord: MessageCircle,
  github: Github,
  email: Mail,
};

// Default colors for each platform (always visible)
const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  instagram: 'text-pink-400',
  youtube: 'text-red-500',
  tiktok: 'text-cyan-400',
  linkedin: 'text-blue-500',
  x: 'text-sky-400',
  website: 'text-emerald-400',
  spotify: 'text-green-500',
  soundcloud: 'text-orange-500',
  twitch: 'text-purple-500',
  discord: 'text-indigo-400',
  github: 'text-violet-400',
  email: 'text-amber-400',
};

export function SocialLinksBlock({ data, onLinkClick }: SocialLinksBlockProps) {
  const socialData = data as SocialLinksBlockData;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {socialData.links?.map((link, index) => {
        const Icon = PLATFORM_ICONS[link.platform] || Globe;
        const colorClass = PLATFORM_COLORS[link.platform] || 'text-gray-400';

        return (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onLinkClick?.(index)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800 border border-gray-700 transition-all duration-300 hover:scale-110 hover:border-gray-500 group"
            title={link.platform}
          >
            <Icon
              size={24}
              className={`${colorClass} transition-all group-hover:[animation:icon-hue-cycle_2s_linear_infinite]`}
            />
          </a>
        );
      })}
    </div>
  );
}
