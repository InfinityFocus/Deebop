'use client';

import { use, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Heart, Bookmark, Share2, Loader2, Crown } from 'lucide-react';
import { clsx } from 'clsx';
import { PanoramaViewer } from '@/components/viewers/PanoramaViewer';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  content_type: string;
  text_content: string | null;
  media_url: string;
  likes_count: number;
  saves_count: number;
  views_count: number;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    tier: string;
  };
  is_liked: boolean;
  is_saved: boolean;
}

async function fetchPost(id: string): Promise<{ post: Post }> {
  const res = await fetch(`/api/posts/${id}`);
  if (!res.ok) throw new Error('Failed to fetch post');
  return res.json();
}

export default function PanoramaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  });

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // Update state when data loads
  useEffect(() => {
    if (data?.post && !initialized) {
      setIsLiked(data.post.is_liked);
      setIsSaved(data.post.is_saved);
      setLikesCount(data.post.likes_count);
      setInitialized(true);
    }
  }, [data, initialized]);

  const handleLike = async () => {
    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/posts/${id}/like`, { method: 'POST' });
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
      const res = await fetch(`/api/posts/${id}/save`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      setIsSaved(wasSaved);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (isError || !data?.post) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
        <p className="text-xl mb-4">Panorama not found</p>
        <Link href="/home" className="text-purple-400 hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  if (data.post.content_type !== 'panorama360') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
        <p className="text-xl mb-4">This is not a panorama</p>
        <Link href={`/p/${id}`} className="text-purple-400 hover:underline">
          View post
        </Link>
      </div>
    );
  }

  const post = data.post;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <Link
          href="/home"
          className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
        >
          <ArrowLeft size={24} />
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center transition',
              isLiked ? 'bg-red-500/20 text-red-500' : 'bg-black/50 text-white hover:bg-black/70'
            )}
          >
            <Heart size={20} className={isLiked ? 'fill-current' : ''} />
          </button>

          <button
            onClick={handleSave}
            className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center transition',
              isSaved ? 'bg-purple-500/20 text-purple-500' : 'bg-black/50 text-white hover:bg-black/70'
            )}
          >
            <Bookmark size={20} className={isSaved ? 'fill-current' : ''} />
          </button>

          <button
            onClick={handleShare}
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
          >
            <Share2 size={20} />
          </button>
        </div>
      </header>

      {/* Panorama Viewer - Full Screen */}
      <div className="flex-1">
        <PanoramaViewer
          src={post.media_url}
          autoRotate
          className="w-full h-full"
          showControls
        />
      </div>

      {/* Footer with post info */}
      <footer className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <Link href={`/u/${post.author.username}`}>
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border-2 border-white">
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
          </Link>

          <div className="flex-1">
            <Link href={`/u/${post.author.username}`} className="font-semibold text-white hover:underline">
              {post.author.display_name || post.author.username}
            </Link>
            <p className="text-sm text-gray-400">@{post.author.username} · {timeAgo}</p>
          </div>

          <div className="text-right text-sm text-gray-400">
            {likesCount > 0 && <p>{likesCount} likes</p>}
            {post.views_count > 0 && <p>{post.views_count} views</p>}
          </div>
        </div>

        {post.text_content && (
          <p className="mt-3 text-white text-sm line-clamp-2">{post.text_content}</p>
        )}
      </footer>
    </div>
  );
}
