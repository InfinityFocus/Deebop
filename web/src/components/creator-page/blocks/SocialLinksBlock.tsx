'use client';

import {
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
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
  x: Twitter,
  website: Globe,
  spotify: Music,
  soundcloud: Cloud,
  twitch: Twitch,
  discord: MessageCircle,
  github: Github,
  email: Mail,
};

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  instagram: 'hover:bg-pink-500/20 hover:text-pink-400',
  youtube: 'hover:bg-red-500/20 hover:text-red-400',
  tiktok: 'hover:bg-white/20 hover:text-white',
  linkedin: 'hover:bg-blue-500/20 hover:text-blue-400',
  x: 'hover:bg-white/20 hover:text-white',
  website: 'hover:bg-emerald-500/20 hover:text-emerald-400',
  spotify: 'hover:bg-green-500/20 hover:text-green-400',
  soundcloud: 'hover:bg-orange-500/20 hover:text-orange-400',
  twitch: 'hover:bg-purple-500/20 hover:text-purple-400',
  discord: 'hover:bg-indigo-500/20 hover:text-indigo-400',
  github: 'hover:bg-white/20 hover:text-white',
  email: 'hover:bg-gray-500/20 hover:text-gray-300',
};

export function SocialLinksBlock({ data, onLinkClick }: SocialLinksBlockProps) {
  const socialData = data as SocialLinksBlockData;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {socialData.links?.map((link, index) => {
        const Icon = PLATFORM_ICONS[link.platform] || Globe;
        const colorClass = PLATFORM_COLORS[link.platform] || 'hover:bg-gray-500/20';

        return (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onLinkClick?.(index)}
            className={`w-12 h-12 flex items-center justify-center rounded-full bg-gray-800 border border-gray-700 text-gray-400 transition ${colorClass}`}
            title={link.platform}
          >
            <Icon size={24} />
          </a>
        );
      })}
    </div>
  );
}
