'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { EmbedPostCard } from './EmbedPostCard';
import { EmbedBranding } from './EmbedBranding';
import type { EmbedPost, EmbedUser, EmbedContentType } from '@/types/embed';

interface EmbedFeedContainerProps {
  username: string;
  limit: number;
  contentType: EmbedContentType;
  showEngagement: boolean;
  showBranding: boolean;
  baseUrl: string;
}

export function EmbedFeedContainer({
  username,
  limit,
  contentType,
  showEngagement,
  showBranding,
  baseUrl,
}: EmbedFeedContainerProps) {
  const [user, setUser] = useState<EmbedUser | null>(null);
  const [posts, setPosts] = useState<EmbedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchFeed = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (contentType !== 'all') params.set('type', contentType);
      if (cursor) params.set('cursor', cursor);

      const url = `/api/embed/users/${username}?${params}`;
      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('User not found or profile is private');
        }
        throw new Error('Failed to load feed');
      }

      const data = await res.json();

      if (cursor) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setUser(data.user);
        setPosts(data.posts);
      }
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [username, limit, contentType]);

  // Initial load
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Infinite scroll
  useEffect(() => {
    if (!nextCursor || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          setLoadingMore(true);
          fetchFeed(nextCursor);
        }
      },
      { threshold: 0.1 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [nextCursor, loadingMore, fetchFeed]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[var(--embed-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[var(--embed-muted)] mt-3">Loading feed...</p>
          </div>
        </div>
        {showBranding && <EmbedBranding baseUrl={baseUrl} />}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-[var(--embed-muted)] text-sm">{error}</p>
            <a
              href={baseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-sm text-[var(--embed-accent)] hover:underline"
            >
              Visit Deebop
            </a>
          </div>
        </div>
        {showBranding && <EmbedBranding baseUrl={baseUrl} />}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-[var(--embed-muted)] text-sm">No posts to display</p>
            {user && (
              <a
                href={`${baseUrl}/u/${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-[var(--embed-accent)] hover:underline"
              >
                View @{user.username} on Deebop
              </a>
            )}
          </div>
        </div>
        {showBranding && <EmbedBranding baseUrl={baseUrl} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Feed header */}
      {user && (
        <a
          href={`${baseUrl}/u/${user.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 border-b border-[var(--embed-border)] hover:opacity-80 transition"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: 'linear-gradient(135deg, var(--embed-accent), #06b6d4)' }}
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              user.display_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[var(--embed-fg)] truncate">
              {user.display_name || user.username}
            </p>
            <p className="text-sm text-[var(--embed-muted)] truncate">@{user.username}</p>
          </div>
        </a>
      )}

      {/* Posts list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {posts.map((post) => (
            <EmbedPostCard
              key={post.id}
              post={post}
              showEngagement={showEngagement}
              baseUrl={baseUrl}
            />
          ))}
        </div>

        {/* Infinite scroll loader */}
        {nextCursor && (
          <div ref={loaderRef} className="py-4 text-center">
            {loadingMore && (
              <div className="w-6 h-6 border-2 border-[var(--embed-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
            )}
          </div>
        )}
      </div>

      {/* Branding */}
      {showBranding && <EmbedBranding baseUrl={baseUrl} />}
    </div>
  );
}
