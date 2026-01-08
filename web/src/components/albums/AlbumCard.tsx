'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Bookmark, Share2, Users, Images, Lock, Crown } from 'lucide-react';
import { clsx } from 'clsx';
import { HeadlineOverlayCompact } from '@/components/shared/HeadlineOverlay';
import type { AlbumCard as AlbumCardType } from '@/types/album';

interface AlbumCardProps {
  album: AlbumCardType;
}

export function AlbumCard({ album }: AlbumCardProps) {
  const [isLiked, setIsLiked] = useState(album.is_liked);
  const [isSaved, setIsSaved] = useState(album.is_saved);
  const [likesCount, setLikesCount] = useState(album.likes_count);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/albums/${album.id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      setIsLiked(wasLiked);
      setLikesCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const wasSaved = isSaved;
    setIsSaved(!isSaved);

    try {
      const res = await fetch(`/api/albums/${album.id}/save`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      setIsSaved(wasSaved);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/albums/${album.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: album.title });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const timeAgo = formatDistanceToNow(new Date(album.created_at), { addSuffix: true });
  const coverImage = album.cover_image_url || album.preview_items[0]?.thumbnail_url;

  return (
    <Link href={`/albums/${album.id}`}>
      <article className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition group">
        {/* Cover Image with Preview Grid */}
        <div className="relative aspect-[4/3] bg-gray-800">
          {coverImage ? (
            <img
              src={coverImage}
              alt={album.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Images size={48} className="text-gray-600" />
            </div>
          )}

          {/* Preview Grid Overlay */}
          {album.preview_items.length > 1 && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              {album.preview_items.slice(1, 4).map((item, i) => (
                <div
                  key={item.id}
                  className="w-10 h-10 rounded-md overflow-hidden border-2 border-gray-900"
                >
                  <img
                    src={item.thumbnail_url || ''}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {album.items_count > 4 && (
                <div className="w-10 h-10 rounded-md bg-black/70 border-2 border-gray-900 flex items-center justify-center text-xs text-white font-medium">
                  +{album.items_count - 4}
                </div>
              )}
            </div>
          )}

          {/* Visibility Badge */}
          {album.visibility !== 'public' && (
            <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded-full flex items-center gap-1 text-xs text-white">
              <Lock size={12} />
              {album.visibility === 'followers' ? 'Followers' : 'Private'}
            </div>
          )}

          {/* Items Count Badge */}
          <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded-full flex items-center gap-1 text-xs text-white">
            <Images size={12} />
            {album.items_count}
          </div>

          {/* Title Overlay */}
          <HeadlineOverlayCompact headline={album.title} />
        </div>

        {/* Album Info */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-emerald-400 transition line-clamp-1">
            {album.title}
          </h3>

          {/* Description */}
          {album.description && (
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{album.description}</p>
          )}

          {/* Owner and Members */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                  {album.owner.avatar_url ? (
                    <img
                      src={album.owner.avatar_url}
                      alt={album.owner.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    album.owner.display_name?.[0]?.toUpperCase() ||
                    album.owner.username[0].toUpperCase()
                  )}
                </div>
              </div>
              <div className="text-sm">
                <span className="text-gray-300">{album.owner.display_name || album.owner.username}</span>
                <span className="text-gray-500"> · {timeAgo}</span>
              </div>
            </div>

            {/* Member Avatars */}
            {album.members_count > 1 && (
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {album.preview_members.slice(0, 3).map((member) => (
                    <div
                      key={member.id}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 border-2 border-gray-900 flex items-center justify-center text-white text-xs"
                    >
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        member.username[0].toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-gray-500 text-xs ml-2">
                  {album.members_count} contributors
                </span>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 group/btn"
                aria-label={isLiked ? 'Unlike album' : 'Like album'}
              >
                <Heart
                  size={18}
                  className={clsx(
                    'transition',
                    isLiked
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-500 group-hover/btn:text-red-500'
                  )}
                />
                {likesCount > 0 && (
                  <span className={clsx('text-sm', isLiked ? 'text-red-500' : 'text-gray-500')}>
                    {likesCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 group/btn"
                aria-label={isSaved ? 'Unsave album' : 'Save album'}
              >
                <Bookmark
                  size={18}
                  className={clsx(
                    'transition',
                    isSaved
                      ? 'fill-emerald-500 text-emerald-500'
                      : 'text-gray-500 group-hover/btn:text-emerald-500'
                  )}
                />
              </button>

              <button
                onClick={handleShare}
                className="group/btn"
                aria-label="Share album"
              >
                <Share2
                  size={18}
                  className="text-gray-500 group-hover/btn:text-blue-500 transition"
                />
              </button>
            </div>

            {album.location && (
              <span className="text-gray-500 text-xs truncate max-w-[120px]">
                {album.location}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
