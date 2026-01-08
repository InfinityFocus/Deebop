'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  TrendingUp,
  Loader2,
  Hash,
  Compass,
  ArrowLeft,
  LogIn,
  Play,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';

interface PublicPost {
  id: string;
  headline: string | null;
  text_content: string | null;
  media_url: string | null;
  media_thumbnail_url: string | null;
  content_type: string;
  provenance: string | null;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface PublicCreator {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  postsCount: number;
  followersCount: number;
}

interface Hashtag {
  name: string;
  posts_count: number;
}

const defaultHashtags: Hashtag[] = [
  { name: 'photography', posts_count: 0 },
  { name: 'streetphotography', posts_count: 0 },
  { name: 'portrait', posts_count: 0 },
  { name: 'landscape', posts_count: 0 },
  { name: 'travel', posts_count: 0 },
  { name: 'art', posts_count: 0 },
  { name: 'music', posts_count: 0 },
  { name: 'gaming', posts_count: 0 },
];

const interestChips = [
  'For you',
  'Photography',
  'Art',
  'Music',
  'Gaming',
  'Travel',
  'Nature',
  'Fashion',
];

async function fetchPublicPosts(): Promise<{ posts: PublicPost[] }> {
  const res = await fetch('/api/posts?visibility=public&limit=12');
  if (!res.ok) return { posts: [] };
  return res.json();
}

async function fetchTrendingCreators(): Promise<{ creators: PublicCreator[] }> {
  const res = await fetch('/api/explore/trending/creators?limit=8');
  if (!res.ok) return { creators: [] };
  return res.json();
}

async function fetchTrendingHashtags(): Promise<{ hashtags: Hashtag[] }> {
  const res = await fetch('/api/hashtags?limit=10');
  if (!res.ok) return { hashtags: [] };
  return res.json();
}

export default function BrowsePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState(0);

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['public-posts'],
    queryFn: fetchPublicPosts,
  });

  const { data: creatorsData, isLoading: creatorsLoading } = useQuery({
    queryKey: ['public-creators'],
    queryFn: fetchTrendingCreators,
  });

  const { data: hashtagsData, isLoading: hashtagsLoading } = useQuery({
    queryKey: ['public-hashtags'],
    queryFn: fetchTrendingHashtags,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/login?redirect=/explore/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const posts = postsData?.posts || [];
  const creators = creatorsData?.creators || [];
  const hashtags = hashtagsData?.hashtags?.length ? hashtagsData.hashtags : defaultHashtags;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-black/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition"
              >
                <ArrowLeft size={20} />
              </Link>
              <div className="flex items-center gap-2">
                <Compass className="text-emerald-500" size={24} />
                <h1 className="text-xl font-bold">Explore</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-gray-400 hover:text-white text-sm font-medium transition"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full text-sm font-semibold transition"
              >
                Create account
              </Link>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-4">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hashtags, creators..."
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-10">
        {/* Interest chips */}
        <section>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
            {interestChips.map((chip, index) => (
              <button
                key={chip}
                onClick={() => setSelectedChip(index)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  index === selectedChip
                    ? 'bg-emerald-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        {/* Trending Posts */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-emerald-500" size={20} />
            <h2 className="text-lg font-semibold">Trending Posts</h2>
          </div>

          {postsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {posts.map((post) => {
                const username = post.author?.username || 'unknown';
                const displayName = post.author?.display_name || username;
                const avatarUrl = post.author?.avatar_url;

                // Determine what image to show
                const thumbnailUrl = post.content_type === 'video'
                  ? post.media_thumbnail_url
                  : post.media_url;
                const isVideo = post.content_type === 'video';
                const isShout = post.content_type === 'shout';

                return (
                  <Link
                    key={post.id}
                    href={post.author ? `/u/${username}?post=${post.id}` : '#'}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-gray-800"
                  >
                    {thumbnailUrl ? (
                      <>
                        <img
                          src={thumbnailUrl}
                          alt={post.headline || 'Post'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Video play indicator */}
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
                              <Play size={28} className="text-white ml-1" fill="white" />
                            </div>
                          </div>
                        )}
                      </>
                    ) : isShout ? (
                      // Styled shout card
                      <div className="w-full h-full bg-gradient-to-br from-emerald-900/80 via-gray-900 to-cyan-900/80 flex flex-col items-center justify-center p-4 relative">
                        <MessageCircle size={24} className="text-emerald-400/50 absolute top-3 right-3" />
                        <p className="text-white text-sm font-medium text-center line-clamp-5 leading-relaxed">
                          &ldquo;{post.text_content || post.headline}&rdquo;
                        </p>
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white">
                            {displayName[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-gray-400 text-xs">@{username}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 bg-gray-800">
                        <p className="text-gray-300 text-sm line-clamp-4">
                          {post.text_content || post.headline}
                        </p>
                      </div>
                    )}

                    {/* Hover overlay - only for media posts */}
                    {!isShout && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="flex items-center gap-2">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={username}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                              {displayName[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <span className="text-white text-sm font-medium">@{username}</span>
                        </div>
                      </div>
                    )}

                    {/* Provenance badge */}
                    {post.provenance && post.provenance !== 'original' && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 text-xs text-gray-300">
                        {post.provenance.replace('_', ' ')}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
              <TrendingUp size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No trending posts yet.</p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full font-semibold transition"
              >
                Be the first to post
              </Link>
            </div>
          )}
        </section>

        {/* Rising Creators */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-emerald-500" size={20} />
            <h2 className="text-lg font-semibold">Rising Creators</h2>
          </div>

          {creatorsLoading ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-full bg-gray-800 animate-pulse" />
                  <div className="w-16 h-3 rounded bg-gray-800 animate-pulse" />
                </div>
              ))}
            </div>
          ) : creators.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto scrollbar-hide py-2">
              {creators.map((creator) => (
                <Link
                  key={creator.id}
                  href={`/u/${creator.username}`}
                  className="flex flex-col items-center gap-2 group flex-shrink-0"
                >
                  {creator.avatarUrl ? (
                    <img
                      src={creator.avatarUrl}
                      alt={creator.username}
                      className="w-20 h-20 rounded-full object-cover border-2 border-transparent group-hover:border-emerald-500 transition-colors"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white border-2 border-transparent group-hover:border-emerald-400 transition-colors">
                      {(creator.displayName || creator.username)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                    @{creator.username}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {creator.followersCount} followers
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No creators yet. Be the first!
            </div>
          )}
        </section>

        {/* Trending Hashtags */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Hash className="text-emerald-500" size={20} />
            <h2 className="text-lg font-semibold">Trending Hashtags</h2>
          </div>

          {hashtagsLoading ? (
            <div className="flex gap-2 flex-wrap">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 w-24 rounded-full bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hashtags.slice(0, 12).map((hashtag) => (
                <Link
                  key={hashtag.name}
                  href={`/login?redirect=/explore/hashtag/${hashtag.name}`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors border border-gray-700/50"
                >
                  <Hash size={16} className="text-emerald-400" />
                  <span className="font-medium text-emerald-400">{hashtag.name}</span>
                  {hashtag.posts_count > 0 && (
                    <span className="text-sm text-gray-500">{hashtag.posts_count}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Call to Action */}
        <section className="text-center py-12 bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800">
          <LogIn className="mx-auto mb-4 text-emerald-500" size={48} />
          <h2 className="text-2xl font-bold mb-2">Want to interact?</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Create an account to follow creators, save posts, join events, and share your own content.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full font-semibold transition"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-gray-600 hover:bg-gray-800 rounded-full font-semibold transition"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
