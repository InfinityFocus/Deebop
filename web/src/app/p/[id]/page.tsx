'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';
import { PostCard } from '@/components/feed/PostCard';

interface PostResponse {
  post: {
    id: string;
    user_id: string;
    content_type: 'shout' | 'image' | 'video' | 'panorama360';
    headline: string | null;
    headline_style: 'normal' | 'news';
    text_content: string | null;
    media_url: string | null;
    media_thumbnail_url: string | null;
    media_width: number | null;
    media_height: number | null;
    media_duration_seconds: number | null;
    provenance: string;
    visibility: 'public' | 'followers' | 'private';
    is_flagged?: boolean;
    likes_count: number;
    saves_count: number;
    shares_count: number;
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
  };
}

async function fetchPost(id: string): Promise<PostResponse> {
  const res = await fetch(`/api/posts/${id}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Post not found');
    }
    throw new Error('Failed to fetch post');
  }
  return res.json();
}

export default function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">
          {error instanceof Error ? error.message : 'Failed to load post'}
        </p>
        <Link
          href="/"
          className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Go home
        </Link>
      </div>
    );
  }

  if (!data?.post) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Post not found</p>
        <Link
          href="/"
          className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft size={20} />
          Back
        </Link>

        {/* Post */}
        <PostCard post={data.post} />
      </div>
    </div>
  );
}
