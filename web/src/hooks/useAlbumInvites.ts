'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AlbumInvite, AlbumInvitesResponse } from '@/types/album';

async function fetchInvites(status: 'pending' | 'accepted' | 'declined' = 'pending'): Promise<AlbumInvitesResponse> {
  const res = await fetch(`/api/albums/invites?status=${status}`);
  if (!res.ok) throw new Error('Failed to fetch invites');
  return res.json();
}

/**
 * Hook for fetching album invites for current user
 */
export function useAlbumInvites(status: 'pending' | 'accepted' | 'declined' = 'pending') {
  return useQuery({
    queryKey: ['album-invites', status],
    queryFn: () => fetchInvites(status),
    select: (data) => data.invites,
  });
}

/**
 * Hook for getting pending invite count (for badges)
 */
export function usePendingInviteCount() {
  const { data: invites } = useAlbumInvites('pending');
  return invites?.length ?? 0;
}

/**
 * Hook for accepting an album invite
 */
export function useAcceptAlbumInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await fetch(`/api/albums/invites/${inviteId}/accept`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to accept invite');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album-invites'] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

/**
 * Hook for declining an album invite
 */
export function useDeclineAlbumInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await fetch(`/api/albums/invites/${inviteId}/decline`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to decline invite');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album-invites'] });
    },
  });
}
