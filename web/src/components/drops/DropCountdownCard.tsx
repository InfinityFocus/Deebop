'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Calendar, Image as ImageIcon, Film, Type, Disc, Folder } from 'lucide-react';
import { useCountdown, formatCountdown, getDropTimeString } from '@/hooks/useCountdown';
import { clsx } from 'clsx';

interface Creator {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  tier?: string;
}

interface Drop {
  id: string;
  type: 'post' | 'album';
  content_type: string;
  title: string | null;
  headline_style?: string;
  description: string | null;
  preview_url: string | null;
  hide_teaser: boolean;
  visibility: string;
  scheduled_for: string;
  created_at: string;
  creator: Creator;
  is_own: boolean;
}

interface DropCountdownCardProps {
  drop: Drop;
  compact?: boolean;
}

const contentTypeIcons: Record<string, typeof ImageIcon> = {
  shout: Type,
  image: ImageIcon,
  video: Film,
  panorama360: Disc,
  album: Folder,
};

// Gradient backgrounds for content types without preview
const contentTypeGradients: Record<string, string> = {
  shout: 'from-emerald-900/80 via-zinc-900 to-cyan-900/80',
  image: 'from-purple-900/80 via-zinc-900 to-pink-900/80',
  video: 'from-red-900/80 via-zinc-900 to-orange-900/80',
  panorama360: 'from-blue-900/80 via-zinc-900 to-indigo-900/80',
  album: 'from-amber-900/80 via-zinc-900 to-yellow-900/80',
};

export function DropCountdownCard({ drop, compact = false }: DropCountdownCardProps) {
  const countdown = useCountdown(drop.scheduled_for);
  const Icon = contentTypeIcons[drop.content_type] || ImageIcon;

  // If the drop has expired and published, don't show the countdown card
  if (countdown.isExpired) {
    return null;
  }

  const showPreview = !drop.hide_teaser && drop.preview_url;

  return (
    <Link
      href={`/drops/${drop.id}?type=${drop.type}`}
      className={clsx(
        'block rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all',
        compact ? 'w-48 shrink-0' : 'w-full'
      )}
    >
      {/* Preview area */}
      <div className={clsx('relative', compact ? 'h-32' : 'h-48')}>
        {showPreview ? (
          <>
            {/* Blurred preview image - using img tag to avoid Next.js image optimization issues with localhost */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={drop.preview_url!}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
              />
            </div>
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60" />
          </>
        ) : (
          // No preview - styled gradient background based on content type
          <div className={clsx(
            'absolute inset-0 bg-gradient-to-br flex items-center justify-center',
            contentTypeGradients[drop.content_type] || 'from-zinc-800 to-zinc-900'
          )}>
            {/* Decorative blur circles */}
            <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            <Icon className="w-16 h-16 text-white/20" />
          </div>
        )}

        {/* Countdown overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Drops in</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {formatCountdown(countdown)}
          </div>
        </div>

        {/* News badge */}
        {drop.headline_style === 'news' && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
            NEWS
          </div>
        )}

        {/* Content type badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
          <Icon className="w-3 h-3" />
          <span className="capitalize">{drop.content_type}</span>
        </div>
      </div>

      {/* Content area */}
      <div className="p-3">
        {/* Creator info */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden shrink-0">
            {drop.creator.avatar_url ? (
              <Image
                src={drop.creator.avatar_url}
                alt={drop.creator.display_name || drop.creator.username}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm font-medium">
                {(drop.creator.display_name || drop.creator.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {drop.creator.display_name || drop.creator.username}
            </p>
            <p className="text-xs text-zinc-500 truncate">@{drop.creator.username}</p>
          </div>
        </div>

        {/* Title */}
        {drop.title && (
          <h3 className={clsx(
            'font-semibold text-white mb-1 line-clamp-2',
            compact ? 'text-sm' : 'text-base'
          )}>
            {drop.title}
          </h3>
        )}

        {/* Drop time */}
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
          <Calendar className="w-3 h-3" />
          <span>{getDropTimeString(drop.scheduled_for)}</span>
        </div>

        {/* Own drop indicator */}
        {drop.is_own && (
          <div className="mt-2 text-xs text-emerald-400/70 font-medium">
            Your scheduled drop
          </div>
        )}
      </div>
    </Link>
  );
}
