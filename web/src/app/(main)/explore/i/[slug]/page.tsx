'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, TrendingUp, Users, Hash } from 'lucide-react';
import {
  TrendingCarousel,
  TrendingPostCard,
  TrendingCreatorCard,
} from '@/components/explore';
import type { PostResult, CreatorResult, HashtagResult } from '@/types/explore';

interface InterestData {
  id: string;
  name: string;
  slug: string;
  category: string;
  iconEmoji: string | null;
}

interface InterestPageData {
  interest: InterestData | null;
  posts: PostResult[];
  creators: CreatorResult[];
  hashtags: HashtagResult[];
}

export default function InterestBrowsePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const [data, setData] = useState<InterestPageData>({
    interest: null,
    posts: [],
    creators: [],
    hashtags: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterestData();
  }, [resolvedParams.slug]);

  const fetchInterestData = async () => {
    setLoading(true);
    try {
      // Fetch interest info
      const interestRes = await fetch('/api/interests');
      const interestData = await interestRes.json();

      // Find the interest by slug
      let interest: InterestData | null = null;
      for (const category of Object.values(interestData.interests)) {
        for (const parent of category as InterestData[]) {
          if ((parent as InterestData & { children?: InterestData[] }).children) {
            for (const child of (parent as InterestData & { children: InterestData[] }).children) {
              if (child.slug === resolvedParams.slug) {
                interest = child;
                break;
              }
            }
          }
          if (parent.slug === resolvedParams.slug) {
            interest = parent;
            break;
          }
          if (interest) break;
        }
        if (interest) break;
      }

      // Fetch trending posts for this interest
      const postsRes = await fetch(
        `/api/explore/trending/posts?interest=${resolvedParams.slug}&limit=12`
      );
      const postsData = await postsRes.json();

      // Fetch trending creators for this interest
      const creatorsRes = await fetch(
        `/api/explore/trending/creators?interest=${resolvedParams.slug}&limit=10`
      );
      const creatorsData = await creatorsRes.json();

      // Search for related hashtags
      const hashtagsRes = await fetch(
        `/api/explore/search?q=${resolvedParams.slug.replace(/-/g, ' ')}&tab=hashtag&limit=10`
      );
      const hashtagsData = await hashtagsRes.json();

      setData({
        interest,
        posts: postsData.posts || [],
        creators: creatorsData.creators || [],
        hashtags: hashtagsData.results?.hashtags || [],
      });
    } catch (err) {
      console.error('Error fetching interest data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!data.interest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-2">Interest not found</h1>
        <p className="text-zinc-400 mb-4">
          The interest "{resolvedParams.slug}" doesn't exist
        </p>
        <Link
          href="/explore"
          className="text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          ← Back to Explore
        </Link>
      </div>
    );
  }

  const hasContent =
    data.posts.length > 0 ||
    data.creators.length > 0 ||
    data.hashtags.length > 0;

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
            {data.interest.iconEmoji && (
              <span className="text-2xl">{data.interest.iconEmoji}</span>
            )}
            <div>
              <h1 className="text-xl font-bold">{data.interest.name}</h1>
              <p className="text-sm text-zinc-400">{data.interest.category}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {hasContent ? (
          <>
            {/* Trending posts */}
            {data.posts.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold">Trending Posts</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data.posts.map((post) => (
                    <TrendingPostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* Rising creators */}
            {data.creators.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold">Rising Creators</h2>
                </div>
                <TrendingCarousel title="">
                  {data.creators.map((creator) => (
                    <TrendingCreatorCard
                      key={creator.id}
                      creator={creator}
                      showTrendingBadge
                    />
                  ))}
                </TrendingCarousel>
              </section>
            )}

            {/* Related hashtags */}
            {data.hashtags.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Hash className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold">Related Hashtags</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.hashtags.map((hashtag) => (
                    <Link
                      key={hashtag.tag}
                      href={`/explore/hashtag/${hashtag.tag}`}
                      className="px-4 py-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
                    >
                      <span className="text-emerald-400">#</span>
                      {hashtag.tag}
                      <span className="ml-2 text-sm text-zinc-500">
                        {hashtag.postCount}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="text-zinc-500 text-lg">
              No content for {data.interest.name} yet
            </p>
            <p className="text-zinc-600 mt-2">
              Be the first to post about this topic!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
