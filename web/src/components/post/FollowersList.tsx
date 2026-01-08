'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface Follower {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface FollowersListProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function FollowersList({ selectedIds, onSelectionChange }: FollowersListProps) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFollowers = useCallback(async (searchQuery: string, cursor?: string) => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '20');

      const res = await fetch(`/api/users/me/followers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch followers');

      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Error fetching followers:', error);
      return { followers: [], nextCursor: null };
    }
  }, []);

  // Initial load and search
  useEffect(() => {
    const loadFollowers = async () => {
      setLoading(true);
      const data = await fetchFollowers(search);
      setFollowers(data.followers);
      setNextCursor(data.nextCursor);
      setLoading(false);
    };

    const debounce = setTimeout(loadFollowers, 300);
    return () => clearTimeout(debounce);
  }, [search, fetchFollowers]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    const data = await fetchFollowers(search, nextCursor);
    setFollowers((prev) => [...prev, ...data.followers]);
    setNextCursor(data.nextCursor);
    setLoadingMore(false);
  };

  const toggleFollower = (followerId: string) => {
    if (selectedIds.includes(followerId)) {
      onSelectionChange(selectedIds.filter((id) => id !== followerId));
    } else {
      onSelectionChange([...selectedIds, followerId]);
    }
  };

  const toggleAll = () => {
    const allCurrentIds = followers.map((f) => f.id);
    const allSelected = allCurrentIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // Deselect all visible
      onSelectionChange(selectedIds.filter((id) => !allCurrentIds.includes(id)));
    } else {
      // Select all visible (merge with existing)
      const newIds = new Set([...selectedIds, ...allCurrentIds]);
      onSelectionChange(Array.from(newIds));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search followers..."
          className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Select all toggle */}
      {followers.length > 0 && (
        <button
          type="button"
          onClick={toggleAll}
          className="text-sm text-emerald-400 hover:text-emerald-300 mb-3 text-left"
        >
          {followers.every((f) => selectedIds.includes(f.id))
            ? 'Deselect all visible'
            : 'Select all visible'}
        </button>
      )}

      {/* Followers list */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            {search ? 'No followers found matching your search' : 'You don\'t have any followers yet'}
          </div>
        ) : (
          <>
            {followers.map((follower) => {
              const isSelected = selectedIds.includes(follower.id);

              return (
                <button
                  key={follower.id}
                  type="button"
                  onClick={() => toggleFollower(follower.id)}
                  className={`
                    w-full flex items-center gap-3 p-2 rounded-lg transition-colors
                    ${isSelected
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : 'hover:bg-zinc-800 border border-transparent'
                    }
                  `}
                >
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                    ${isSelected
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-zinc-600'
                    }
                  `}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {follower.avatar_url ? (
                    <Image
                      src={follower.avatar_url}
                      alt={follower.username}
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-sm font-medium">
                      {(follower.display_name || follower.username).charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium text-white truncate">
                      {follower.display_name || follower.username}
                    </div>
                    <div className="text-sm text-zinc-500 truncate">@{follower.username}</div>
                  </div>
                </button>
              );
            })}

            {nextCursor && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full py-2 text-sm text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Load more'
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Selection count */}
      {selectedIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-700 text-sm text-zinc-400">
          {selectedIds.length} follower{selectedIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
