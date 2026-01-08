'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserPlus, UserCheck, Loader2, TrendingUp } from 'lucide-react';
import type { CreatorResult } from '@/types/explore';

interface TrendingCreatorCardProps {
  creator: CreatorResult;
  showTrendingBadge?: boolean;
}

export default function TrendingCreatorCard({
  creator,
  showTrendingBadge = false,
}: TrendingCreatorCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${creator.id}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (err) {
      console.error('Error following user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Link
      href={`/u/${creator.username}`}
      className="flex-shrink-0 w-44 p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors group"
    >
      {/* Avatar */}
      <div className="relative mx-auto w-20 h-20 mb-3">
        {creator.avatar ? (
          <Image
            src={creator.avatar}
            alt={creator.username}
            fill
            className="rounded-full object-cover border-2 border-zinc-700 group-hover:border-emerald-500/50 transition-colors"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-bold border-2 border-zinc-600 group-hover:border-emerald-500/50 transition-colors">
            {creator.username[0].toUpperCase()}
          </div>
        )}

        {/* Trending badge */}
        {showTrendingBadge && creator.recentFollowerGain && creator.recentFollowerGain > 0 && (
          <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-emerald-500 rounded-full flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3 text-white" />
            <span className="text-xs font-medium text-white">
              +{creator.recentFollowerGain}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center">
        <p className="font-semibold truncate">
          {creator.displayName || creator.username}
        </p>
        <p className="text-sm text-zinc-400 truncate">@{creator.username}</p>
        <p className="text-sm text-zinc-500 mt-1">
          {formatFollowers(creator.followerCount)} followers
        </p>
      </div>

      {/* Follow button */}
      <button
        onClick={handleFollow}
        disabled={isLoading}
        className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
          isFollowing
            ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            : 'bg-emerald-500 text-white hover:bg-emerald-600'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <>
            <UserCheck className="w-4 h-4" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Follow
          </>
        )}
      </button>
    </Link>
  );
}
