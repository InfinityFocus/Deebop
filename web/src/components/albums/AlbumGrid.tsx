'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Loader2, Images } from 'lucide-react';
import { AlbumCard } from './AlbumCard';
import { useAlbums } from '@/hooks/useAlbums';
import Link from 'next/link';

interface AlbumGridProps {
  type?: 'feed' | 'owned' | 'shared' | 'saved';
  userId?: string;
  columns?: 1 | 2 | 3;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
}

export function AlbumGrid({
  type = 'feed',
  userId,
  columns = 2,
  emptyMessage = 'No albums yet',
  emptyAction,
}: AlbumGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    albums,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useAlbums({ type, userId });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-red-400">
        Failed to load albums. Please try again.
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Images className="text-gray-500" size={28} />
        </div>
        <p className="text-gray-500 text-lg mb-2">{emptyMessage}</p>
        {emptyAction || (
          <Link
            href="/albums/create"
            className="inline-block px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-full hover:opacity-90 transition mt-4"
          >
            Create Album
          </Link>
        )}
      </div>
    );
  }

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div>
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4">
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        )}
      </div>
    </div>
  );
}
