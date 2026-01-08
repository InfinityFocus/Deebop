'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, TrendingUp } from 'lucide-react';
import {
  TrendingPostCard,
  TrendingCreatorCard,
  TrendingAlbumCard,
  TrendingEventCard,
} from '@/components/explore';
import type { PostResult, CreatorResult, AlbumResult, EventResult } from '@/types/explore';

type TrendingType = 'posts' | 'creators' | 'albums' | 'events';

const TYPE_CONFIG: Record<
  TrendingType,
  { title: string; window: string }
> = {
  posts: { title: 'Trending Posts', window: '24 hours' },
  creators: { title: 'Rising Creators', window: '7 days' },
  albums: { title: 'Popular Albums', window: '7 days' },
  events: { title: 'Upcoming Events', window: '14 days' },
};

export default function TrendingPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const resolvedParams = use(params);
  const type = resolvedParams.type as TrendingType;
  const [data, setData] = useState<
    PostResult[] | CreatorResult[] | AlbumResult[] | EventResult[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const config = TYPE_CONFIG[type];

  useEffect(() => {
    if (config) {
      setData([]);
      setOffset(0);
      setHasMore(true);
      fetchData(0);
    }
  }, [type]);

  const fetchData = async (currentOffset: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/explore/trending/${type}?limit=20&offset=${currentOffset}`
      );
      if (res.ok) {
        const responseData = await res.json();
        const items =
          responseData[type] ||
          responseData.posts ||
          responseData.creators ||
          responseData.albums ||
          responseData.events ||
          [];

        if (currentOffset === 0) {
          setData(items);
        } else {
          setData((prev) => [...prev, ...items]);
        }

        setHasMore(items.length >= 20);
      }
    } catch (err) {
      console.error('Error fetching trending data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const newOffset = offset + 20;
    setOffset(newOffset);
    fetchData(newOffset);
  };

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-2">Invalid trending type</h1>
        <Link
          href="/explore"
          className="text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          ← Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/explore"
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <div>
              <h1 className="text-xl font-bold">{config.title}</h1>
              <p className="text-sm text-zinc-400">
                Trending over the last {config.window}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading && data.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : data.length > 0 ? (
          <>
            {/* Posts grid */}
            {type === 'posts' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(data as PostResult[]).map((post) => (
                  <TrendingPostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {/* Creators grid */}
            {type === 'creators' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(data as CreatorResult[]).map((creator) => (
                  <TrendingCreatorCard
                    key={creator.id}
                    creator={creator}
                    showTrendingBadge
                  />
                ))}
              </div>
            )}

            {/* Albums grid */}
            {type === 'albums' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(data as AlbumResult[]).map((album) => (
                  <TrendingAlbumCard key={album.id} album={album} />
                ))}
              </div>
            )}

            {/* Events grid */}
            {type === 'events' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(data as EventResult[]).map((event) => (
                  <TrendingEventCard key={event.id} event={event} />
                ))}
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Load More
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center text-zinc-500">
            <p>No trending {type} right now</p>
            <p className="text-sm mt-1">Check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
}
