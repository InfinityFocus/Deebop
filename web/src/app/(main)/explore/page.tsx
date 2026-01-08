'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  TrendingUp,
  Loader2,
  Hash,
  Compass,
  Clock,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { DropCountdownCard } from '@/components/drops/DropCountdownCard';
import {
  InterestChipsRow,
  InterestPicker,
  TrendingCarousel,
  TrendingPostCard,
  TrendingCreatorCard,
  TrendingAlbumCard,
  TrendingEventCard,
  NearYouSection,
  ContentFiltersSheet,
} from '@/components/explore';
import { useExplorePreferencesStore } from '@/stores/explorePreferencesStore';
import type { Interest, PostResult, CreatorResult, AlbumResult, EventResult, ContentPreferences } from '@/types/explore';

interface Hashtag {
  id: string;
  name: string;
  posts_count: number;
}

interface Drop {
  id: string;
  type: 'post' | 'album';
  content_type: string;
  title: string | null;
  headline_style?: string;
  description: string | null;
  preview_url: string | null;
  hide_teaser: boolean;
  visibility: string;
  scheduled_for: string;
  created_at: string;
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    tier?: string;
  };
  is_own: boolean;
}

const defaultHashtags = [
  { name: 'photography', posts_count: 0 },
  { name: 'streetphotography', posts_count: 0 },
  { name: 'portrait', posts_count: 0 },
  { name: 'landscape', posts_count: 0 },
  { name: 'travel', posts_count: 0 },
];

async function fetchTrendingHashtags(): Promise<{ hashtags: Hashtag[] }> {
  const res = await fetch('/api/hashtags?limit=10');
  if (!res.ok) throw new Error('Failed to fetch hashtags');
  return res.json();
}

async function fetchPublicDrops(): Promise<{ drops: Drop[] }> {
  const res = await fetch('/api/drops/public?limit=10');
  if (!res.ok) throw new Error('Failed to fetch public drops');
  return res.json();
}

async function fetchUserInterests(): Promise<{ interests: Interest[] }> {
  const res = await fetch('/api/user/interests');
  if (!res.ok) return { interests: [] };
  return res.json();
}

async function fetchTrendingPosts(interestSlug?: string, filters?: ContentPreferences): Promise<{ posts: PostResult[] }> {
  const params = new URLSearchParams({ limit: '10' });
  if (interestSlug) params.set('interest', interestSlug);
  if (filters?.hideAiGenerated) params.set('hideAiGenerated', 'true');
  if (filters?.hideAiAssisted) params.set('hideAiAssisted', 'true');
  if (filters?.hidePaidPartnership) params.set('hidePaidPartnership', 'true');
  if (filters?.hideSensitiveContent) params.set('hideSensitiveContent', 'true');
  const res = await fetch(`/api/explore/trending/posts?${params.toString()}`);
  if (!res.ok) return { posts: [] };
  return res.json();
}

async function fetchTrendingCreators(): Promise<{ creators: CreatorResult[] }> {
  const res = await fetch('/api/explore/trending/creators?limit=10');
  if (!res.ok) return { creators: [] };
  return res.json();
}

async function fetchTrendingAlbums(): Promise<{ albums: AlbumResult[] }> {
  const res = await fetch('/api/explore/trending/albums?limit=10');
  if (!res.ok) return { albums: [] };
  return res.json();
}

async function fetchTrendingEvents(): Promise<{ events: EventResult[] }> {
  const res = await fetch('/api/explore/trending/events?limit=10');
  if (!res.ok) return { events: [] };
  return res.json();
}

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [interestPickerOpen, setInterestPickerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    selectedInterest,
    userInterests,
    setUserInterests,
    contentFilters,
    setContentFilters,
  } = useExplorePreferencesStore();

  // Fetch user interests on mount
  const { data: interestsData } = useQuery({
    queryKey: ['user-interests'],
    queryFn: fetchUserInterests,
  });

  // Fetch content preferences on mount
  const { data: prefsData } = useQuery({
    queryKey: ['content-prefs'],
    queryFn: async () => {
      const res = await fetch('/api/user/content-prefs');
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Update store when interests are fetched
  useEffect(() => {
    if (interestsData?.interests) {
      setUserInterests(interestsData.interests);
    }
  }, [interestsData, setUserInterests]);

  // Update store when content preferences are fetched
  useEffect(() => {
    if (prefsData?.preferences) {
      setContentFilters(prefsData.preferences);
    }
  }, [prefsData, setContentFilters]);

  // Fetch trending hashtags
  const { data: hashtagsData, isLoading: hashtagsLoading } = useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: fetchTrendingHashtags,
  });

  // Fetch public drops
  const { data: dropsData, isLoading: dropsLoading } = useQuery({
    queryKey: ['public-drops'],
    queryFn: fetchPublicDrops,
    refetchInterval: 60000,
  });

  // Fetch trending posts (filtered by selected interest and content filters)
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['trending-posts', selectedInterest?.slug, contentFilters],
    queryFn: () => fetchTrendingPosts(selectedInterest?.slug, contentFilters),
  });

  // Fetch trending creators
  const { data: creatorsData, isLoading: creatorsLoading } = useQuery({
    queryKey: ['trending-creators'],
    queryFn: fetchTrendingCreators,
  });

  // Fetch trending albums
  const { data: albumsData, isLoading: albumsLoading } = useQuery({
    queryKey: ['trending-albums'],
    queryFn: fetchTrendingAlbums,
  });

  // Fetch trending events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['trending-events'],
    queryFn: fetchTrendingEvents,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSaveInterests = async (interestIds: string[]) => {
    try {
      const res = await fetch('/api/user/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserInterests(data.interests);
      }
    } catch (err) {
      console.error('Error saving interests:', err);
    }
  };

  // Count active filters for badge
  const activeFilterCount = [
    contentFilters.hideAiGenerated,
    contentFilters.hideAiAssisted,
    contentFilters.hidePaidPartnership,
    contentFilters.hideSensitiveContent,
    contentFilters.boostNewsHeadlines,
  ].filter(Boolean).length;

  const hashtags = hashtagsData?.hashtags?.length ? hashtagsData.hashtags : defaultHashtags;
  const drops = dropsData?.drops || [];
  const posts = postsData?.posts || [];
  const creators = creatorsData?.creators || [];
  const albums = albumsData?.albums || [];
  const events = eventsData?.events || [];

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Explore" icon={<Compass size={24} />}>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hashtags, creators, albums, events..."
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-zinc-400"
            />
          </div>
        </form>
      </PageHeader>

      <div className="px-4 py-4 space-y-8">
        {/* Interest chips row */}
        <section>
          <InterestChipsRow
            interests={userInterests}
            onManageClick={() => setInterestPickerOpen(true)}
          />
        </section>

        {/* Filters button */}
        <section className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-medium transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          {selectedInterest && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-sm">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>
                Showing: <span className="text-emerald-400">{selectedInterest.name}</span>
              </span>
            </div>
          )}
        </section>

        {/* Trending Posts */}
        <section>
          <TrendingCarousel
            title="Trending Posts"
            seeAllHref="/explore/trending/posts"
            emptyMessage={postsLoading ? 'Loading...' : 'No trending posts yet'}
          >
            {postsLoading ? (
              <div className="flex items-center justify-center w-full py-8">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            ) : (
              posts.map((post) => <TrendingPostCard key={post.id} post={post} />)
            )}
          </TrendingCarousel>
        </section>

        {/* Rising Creators */}
        <section>
          <TrendingCarousel
            title="Rising Creators"
            seeAllHref="/explore/trending/creators"
            emptyMessage={creatorsLoading ? 'Loading...' : 'No rising creators yet'}
          >
            {creatorsLoading ? (
              <div className="flex items-center justify-center w-full py-8">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            ) : (
              creators.map((creator) => (
                <TrendingCreatorCard key={creator.id} creator={creator} showTrendingBadge />
              ))
            )}
          </TrendingCarousel>
        </section>

        {/* Popular Albums */}
        <section>
          <TrendingCarousel
            title="Popular Albums"
            seeAllHref="/explore/trending/albums"
            emptyMessage={albumsLoading ? 'Loading...' : 'No popular albums yet'}
          >
            {albumsLoading ? (
              <div className="flex items-center justify-center w-full py-8">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            ) : (
              albums.map((album) => <TrendingAlbumCard key={album.id} album={album} />)
            )}
          </TrendingCarousel>
        </section>

        {/* Upcoming Events */}
        <section>
          <TrendingCarousel
            title="Upcoming Events"
            seeAllHref="/explore/trending/events"
            emptyMessage={eventsLoading ? 'Loading...' : 'No upcoming events'}
          >
            {eventsLoading ? (
              <div className="flex items-center justify-center w-full py-8">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            ) : (
              events.map((event) => <TrendingEventCard key={event.id} event={event} />)
            )}
          </TrendingCarousel>
        </section>

        {/* Trending Hashtags */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={20} />
              <h2 className="text-lg font-semibold">Trending Hashtags</h2>
            </div>
          </div>

          {hashtagsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-emerald-500" size={24} />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hashtags.slice(0, 10).map((hashtag) => (
                <Link
                  key={hashtag.name}
                  href={`/explore/hashtag/${hashtag.name}`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors border border-zinc-700/50"
                >
                  <Hash size={16} className="text-emerald-400" />
                  <span className="font-medium text-emerald-400">{hashtag.name}</span>
                  <span className="text-sm text-zinc-500">{hashtag.posts_count}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Near You */}
        <section>
          <NearYouSection />
        </section>

        {/* Upcoming Drops */}
        {(dropsLoading || drops.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="text-emerald-500" size={20} />
                <h2 className="text-lg font-semibold">Upcoming Drops</h2>
                {drops.length > 0 && (
                  <span className="text-sm text-zinc-500">({drops.length})</span>
                )}
              </div>
            </div>

            {dropsLoading ? (
              <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-48 shrink-0 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse"
                  >
                    <div className="h-32 bg-zinc-800" />
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-800" />
                        <div className="flex-1 space-y-1">
                          <div className="h-3 bg-zinc-800 rounded w-20" />
                          <div className="h-2 bg-zinc-800 rounded w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : drops.length === 1 ? (
              <DropCountdownCard drop={drops[0]} />
            ) : (
              <div
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {drops.map((drop) => (
                  <div key={`${drop.type}-${drop.id}`} style={{ scrollSnapAlign: 'start' }}>
                    <DropCountdownCard drop={drop} compact />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Interest Picker Modal */}
      <InterestPicker
        isOpen={interestPickerOpen}
        onClose={() => setInterestPickerOpen(false)}
        onSave={handleSaveInterests}
        initialSelectedIds={userInterests.map((i) => i.id)}
      />

      {/* Content Filters Sheet */}
      <ContentFiltersSheet isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </div>
  );
}
