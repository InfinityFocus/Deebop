'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { useExplorePreferencesStore } from '@/stores/explorePreferencesStore';
import RecentSearches from './RecentSearches';
import SearchResultItem from './SearchResultItem';
import type { SearchResults, SearchTab, RecentSearch } from '@/types/explore';

const TABS: { id: SearchTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'hashtag', label: 'Hashtags' },
  { id: 'creator', label: 'Creators' },
  { id: 'album', label: 'Albums' },
  { id: 'event', label: 'Events' },
  { id: 'shout', label: 'Shouts' },
];

interface SearchOverlayProps {
  initialQuery?: string;
  initialTab?: SearchTab;
}

export default function SearchOverlay({
  initialQuery = '',
  initialTab = 'all',
}: SearchOverlayProps) {
  const router = useRouter();
  const { searchQuery, setSearchQuery, setSearchOpen } =
    useExplorePreferencesStore();

  const [query, setQuery] = useState(initialQuery || searchQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const [results, setResults] = useState<SearchResults>({});
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch recent searches on mount
  useEffect(() => {
    fetchRecentSearches();
  }, []);

  const fetchRecentSearches = async () => {
    try {
      const res = await fetch('/api/user/recent-searches');
      if (res.ok) {
        const data = await res.json();
        setRecentSearches(data.searches);
      }
    } catch (err) {
      console.error('Error fetching recent searches:', err);
    }
  };

  const performSearch = useCallback(
    async (searchQuery: string, tab: SearchTab) => {
      if (!searchQuery.trim()) {
        setResults({});
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);

      try {
        const res = await fetch(
          `/api/explore/search?q=${encodeURIComponent(searchQuery)}&tab=${tab}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
        }
      } catch (err) {
        console.error('Error searching:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query, activeTab);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab, performSearch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Save to recent searches
    try {
      await fetch('/api/user/recent-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), type: activeTab }),
      });
      fetchRecentSearches();
    } catch (err) {
      console.error('Error saving search:', err);
    }

    // Navigate to search page with query
    setSearchQuery(query);
    router.push(`/explore/search?q=${encodeURIComponent(query)}&tab=${activeTab}`);
  };

  const handleRecentSearchClick = (search: RecentSearch) => {
    setQuery(search.query);
    setActiveTab(search.type);
    performSearch(search.query, search.type);
  };

  const handleClearHistory = async () => {
    try {
      await fetch('/api/user/recent-searches', { method: 'DELETE' });
      setRecentSearches([]);
    } catch (err) {
      console.error('Error clearing search history:', err);
    }
  };

  const handleClose = () => {
    setSearchOpen(false);
    router.back();
  };

  const hasResults =
    (results.hashtags?.length || 0) +
      (results.creators?.length || 0) +
      (results.albums?.length || 0) +
      (results.events?.length || 0) +
      (results.shouts?.length || 0) >
    0;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Search header */}
      <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hashtags, creators, albums, events..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 animate-spin" />
              )}
            </div>
          </form>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        {!hasSearched && !query.trim() ? (
          // Show recent searches when no query
          <RecentSearches
            searches={recentSearches}
            onSearchClick={handleRecentSearchClick}
            onClearHistory={handleClearHistory}
          />
        ) : loading ? (
          // Loading state
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : hasResults ? (
          // Search results
          <div className="space-y-6">
            {/* Hashtags */}
            {results.hashtags && results.hashtags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">
                  Hashtags
                </h3>
                <div className="space-y-2">
                  {results.hashtags.map((hashtag) => (
                    <SearchResultItem
                      key={hashtag.tag}
                      type="hashtag"
                      data={hashtag}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Creators */}
            {results.creators && results.creators.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">
                  Creators
                </h3>
                <div className="space-y-2">
                  {results.creators.map((creator) => (
                    <SearchResultItem
                      key={creator.id}
                      type="creator"
                      data={creator}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Albums */}
            {results.albums && results.albums.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">
                  Albums
                </h3>
                <div className="space-y-2">
                  {results.albums.map((album) => (
                    <SearchResultItem
                      key={album.id}
                      type="album"
                      data={album}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {results.events && results.events.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">
                  Events
                </h3>
                <div className="space-y-2">
                  {results.events.map((event) => (
                    <SearchResultItem
                      key={event.id}
                      type="event"
                      data={event}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Shouts */}
            {results.shouts && results.shouts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">
                  Shouts
                </h3>
                <div className="space-y-2">
                  {results.shouts.map((shout) => (
                    <SearchResultItem
                      key={shout.id}
                      type="shout"
                      data={shout}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : hasSearched ? (
          // No results
          <div className="text-center py-12">
            <p className="text-zinc-500">No results found for "{query}"</p>
            <p className="text-sm text-zinc-600 mt-2">
              Try a different search term
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
