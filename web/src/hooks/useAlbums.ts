'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AlbumCard, AlbumsResponse, CreateAlbumPayload } from '@/types/album';

type AlbumListType = 'feed' | 'owned' | 'shared' | 'saved';

interface UseAlbumsOptions {
  type?: AlbumListType;
  userId?: string;
  enabled?: boolean;
}

async function fetchAlbums({
  pageParam,
  type,
  userId,
}: {
  pageParam?: string;
  type?: AlbumListType;
  userId?: string;
}): Promise<AlbumsResponse> {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);
  if (type) params.set('type', type);
  if (userId) params.set('userId', userId);

  const res = await fetch(`/api/albums?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch albums');
  return res.json();
}

async function createAlbum(payload: CreateAlbumPayload): Promise<{ album: AlbumCard }> {
  const res = await fetch('/api/albums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create album');
  }

  return res.json();
}

/**
 * Hook for fetching albums with infinite scroll
 */
export function useAlbums({ type = 'feed', userId, enabled = true }: UseAlbumsOptions = {}) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['albums', type, userId],
    queryFn: ({ pageParam }) => fetchAlbums({ pageParam, type, userId }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled,
  });

  const albums = query.data?.pages.flatMap((page) => page.albums) ?? [];

  return {
    albums,
    ...query,
  };
}

/**
 * Hook for creating a new album
 */
export function useCreateAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAlbum,
    onSuccess: () => {
      // Invalidate album lists to refetch
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

/**
 * Hook for toggling album like
 */
export function useToggleAlbumLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (albumId: string) => {
      const res = await fetch(`/api/albums/${albumId}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to toggle like');
      return res.json();
    },
    onSuccess: (_, albumId) => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['album', albumId] });
    },
  });
}

/**
 * Hook for toggling album save
 */
export function useToggleAlbumSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (albumId: string) => {
      const res = await fetch(`/api/albums/${albumId}/save`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to toggle save');
      return res.json();
    },
    onSuccess: (_, albumId) => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['album', albumId] });
    },
  });
}
