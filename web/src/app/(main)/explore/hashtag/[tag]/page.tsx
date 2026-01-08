'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Hash, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PostCard } from '@/components/feed';

interface HashtagResponse {
  hashtag: {
    id?: string;
    name: string;
    posts_count: number;
  };
  posts: any[];
  nextCursor?: string;
}

async function fetchHashtagPosts(tag: string): Promise<HashtagResponse> {
  const res = await fetch(`/api/hashtags/${tag}`);
  if (!res.ok) throw new Error('Failed to fetch hashtag posts');
  return res.json();
}

export default function HashtagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['hashtag', tag],
    queryFn: () => fetchHashtagPosts(tag),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft size={20} />
          Back to Explore
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Hash size={32} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">#{tag}</h1>
            {data && (
              <p className="text-gray-400">
                {data.hashtag.posts_count.toLocaleString()} {data.hashtag.posts_count === 1 ? 'post' : 'posts'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-red-400">
          Failed to load posts for #{tag}
        </div>
      ) : data?.posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
          <Hash size={48} className="mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400">No posts found with #{tag}</p>
          <p className="text-gray-500 text-sm mt-2">Be the first to post with this hashtag!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
