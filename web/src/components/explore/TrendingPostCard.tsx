'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, Play } from 'lucide-react';
import type { PostResult } from '@/types/explore';

interface TrendingPostCardProps {
  post: PostResult;
}

export default function TrendingPostCard({ post }: TrendingPostCardProps) {
  const isVideo = post.contentType === 'video' || post.contentType === 'reel';
  const hasMedia = post.mediaUrl || post.thumbnailUrl;

  return (
    <Link
      href={`/u/${post.user.username}?post=${post.id}`}
      className="flex-shrink-0 w-48 group"
    >
      {/* Media/thumbnail */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800">
        {hasMedia ? (
          <>
            <Image
              src={post.thumbnailUrl || post.mediaUrl || ''}
              alt=""
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="w-10 h-10 text-white/90 fill-white/90" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <p className="text-sm text-zinc-400 line-clamp-4 text-center">
              {post.textContent}
            </p>
          </div>
        )}

        {/* Engagement overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-3 text-xs text-white/90">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {post.likeCount}
            </span>
            {post.viewCount !== undefined && post.viewCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {post.viewCount >= 1000
                  ? `${(post.viewCount / 1000).toFixed(1)}k`
                  : post.viewCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Creator info */}
      <div className="mt-2 flex items-center gap-2">
        {post.user.avatar ? (
          <Image
            src={post.user.avatar}
            alt={post.user.username}
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium">
            {post.user.username[0].toUpperCase()}
          </div>
        )}
        <span className="text-sm text-zinc-400 truncate">
          @{post.user.username}
        </span>
      </div>
    </Link>
  );
}
