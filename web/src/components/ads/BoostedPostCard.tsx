'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Bookmark, Share2, Megaphone, Crown } from 'lucide-react';
import { clsx } from 'clsx';

interface BoostedPost {
  id: string;
  content_type: string;
  text_content: string | null;
  media_url: string | null;
  media_thumbnail_url: string | null;
  likes_count: number;
  views_count: number;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    tier: string;
  };
}

interface BoostedPostCardProps {
  boostId: string;
  post: BoostedPost;
}

export function BoostedPostCard({ boostId, post }: BoostedPostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  const handleLike = async () => {
    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      setIsLiked(wasLiked);
      setLikesCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    }
  };

  const handleSave = async () => {
    const wasSaved = isSaved;
    setIsSaved(!isSaved);

    try {
      const res = await fetch(`/api/posts/${post.id}/save`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      setIsSaved(wasSaved);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/p/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleClick = async () => {
    // Track boost click
    try {
      await fetch(`/api/ads/click/${boostId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'boost' }),
      });
    } catch {}
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <article className="bg-gray-900 border border-purple-500/30 rounded-xl overflow-hidden">
      {/* Sponsored label */}
      <div className="flex items-center justify-between px-4 py-2 bg-purple-500/10 border-b border-purple-500/30">
        <div className="flex items-center gap-2 text-purple-400 text-sm">
          <Megaphone size={14} />
          <span>Promoted</span>
        </div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link
          href={`/u/${post.author.username}`}
          onClick={handleClick}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {post.author.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                post.author.display_name?.[0]?.toUpperCase() ||
                post.author.username[0].toUpperCase()
              )}
            </div>
            {post.author.tier === 'pro' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Crown size={10} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-white hover:underline">
              {post.author.display_name || post.author.username}
            </p>
            <p className="text-sm text-gray-500">@{post.author.username} · {timeAgo}</p>
          </div>
        </Link>
      </header>

      {/* Content */}
      {post.text_content && (
        <div className="px-4 pb-3">
          <p className="text-white whitespace-pre-wrap">{post.text_content}</p>
        </div>
      )}

      {/* Media */}
      {post.media_url && (
        <Link href={`/p/${post.id}`} onClick={handleClick}>
          {post.content_type === 'image' && (
            <img
              src={post.media_url}
              alt=""
              className="w-full object-cover max-h-[400px]"
            />
          )}
          {post.content_type === 'video' && (
            <video
              src={post.media_url}
              poster={post.media_thumbnail_url || undefined}
              controls
              className="w-full max-h-[400px]"
            />
          )}
        </Link>
      )}

      {/* Interaction bar */}
      <footer className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
        <div className="flex items-center gap-6">
          <button onClick={handleLike} className="flex items-center gap-2 group">
            <Heart
              size={22}
              className={clsx(
                'transition',
                isLiked
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-500 group-hover:text-red-500'
              )}
            />
            {likesCount > 0 && (
              <span className={clsx('text-sm', isLiked ? 'text-red-500' : 'text-gray-500')}>
                {likesCount}
              </span>
            )}
          </button>

          <button onClick={handleSave} className="flex items-center gap-2 group">
            <Bookmark
              size={22}
              className={clsx(
                'transition',
                isSaved
                  ? 'fill-purple-500 text-purple-500'
                  : 'text-gray-500 group-hover:text-purple-500'
              )}
            />
          </button>

          <button onClick={handleShare} className="flex items-center gap-2 group">
            <Share2 size={22} className="text-gray-500 group-hover:text-blue-500 transition" />
          </button>
        </div>

        {post.views_count > 0 && (
          <span className="text-sm text-gray-500">{post.views_count} views</span>
        )}
      </footer>
    </article>
  );
}
