'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Album, AlbumResponse, UpdateAlbumPayload, AlbumItem } from '@/types/album';

async function fetchAlbum(albumId: string): Promise<AlbumResponse> {
  const res = await fetch(`/api/albums/${albumId}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Album not found');
    throw new Error('Failed to fetch album');
  }
  return res.json();
}

/**
 * Hook for fetching a single album with full details
 */
export function useAlbum(albumId: string | null) {
  const query = useQuery({
    queryKey: ['album', albumId],
    queryFn: () => fetchAlbum(albumId!),
    enabled: !!albumId,
  });

  return {
    album: query.data?.album,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for updating album metadata
 */
export function useUpdateAlbum(albumId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAlbumPayload) => {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update album');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', albumId] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

/**
 * Hook for deleting an album
 */
export function useDeleteAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (albumId: string) => {
      const res = await fetch(`/api/albums/${albumId}`, { method: 'DELETE' });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete album');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

/**
 * Hook for adding an item to an album
 */
export function useAddAlbumItem(albumId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`/api/albums/${albumId}/items`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add item');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', albumId] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

/**
 * Hook for updating an album item
 */
export function useUpdateAlbumItem(albumId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: string;
      data: { caption?: string; sortOrder?: number };
    }) => {
      const res = await fetch(`/api/albums/${albumId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update item');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', albumId] });
    },
  });
}

/**
 * Hook for deleting an album item
 */
export function useDeleteAlbumItem(albumId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/albums/${albumId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete item');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', albumId] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

/**
 * Hook for inviting a member to an album
 */
export function useInviteAlbumMember(albumId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
      message,
    }: {
      userId: string;
      role: 'co_owner' | 'contributor';
      message?: string;
    }) => {
      const res = await fetch(`/api/albums/${albumId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, message }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send invite');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', albumId] });
    },
  });
}

/**
 * Hook for updating a member's role
 */
export function useUpdateAlbumMember(albumId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: 'co_owner' | 'contributor';
    }) => {
      const res = await fetch(`/api/albums/${albumId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update member');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', albumId] });
    },
  });
}

/**
 * Hook for removing a member from an album
 */
export function useRemoveAlbumMember(albumId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/albums/${albumId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove member');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', albumId] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}
