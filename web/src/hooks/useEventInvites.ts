import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  SendInvitesPayload,
  CreateInviteLinkPayload,
  EventInviteLinkDetail,
  RedeemInviteLinkResponse,
  InviteLinkInfoResponse,
} from '@/types/event';

// Send invites
async function sendInvites(
  eventId: string,
  data: SendInvitesPayload
): Promise<{ success: boolean; invitedCount: number; message: string }> {
  const res = await fetch(`/api/events/${eventId}/invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to send invites');
  }
  return res.json();
}

// Fetch invites
async function fetchInvites(eventId: string): Promise<{ invites: any[] }> {
  const res = await fetch(`/api/events/${eventId}/invites`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch invites');
  }
  return res.json();
}

// Fetch invite links
async function fetchInviteLinks(eventId: string): Promise<{ inviteLinks: EventInviteLinkDetail[] }> {
  const res = await fetch(`/api/events/${eventId}/invite-links`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch invite links');
  }
  return res.json();
}

// Create invite link
async function createInviteLink(
  eventId: string,
  data: CreateInviteLinkPayload
): Promise<{ inviteLink: EventInviteLinkDetail }> {
  const res = await fetch(`/api/events/${eventId}/invite-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create invite link');
  }
  return res.json();
}

// Revoke invite link
async function revokeInviteLink(eventId: string, token: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/events/${eventId}/invite-links/${token}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to revoke invite link');
  }
  return res.json();
}

// Get invite link info (no auth required)
async function getInviteLinkInfo(token: string): Promise<InviteLinkInfoResponse> {
  const res = await fetch(`/api/events/join/${token}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Invalid invite link');
  }
  return res.json();
}

// Redeem invite link
async function redeemInviteLink(token: string): Promise<RedeemInviteLinkResponse> {
  const res = await fetch(`/api/events/join/${token}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to redeem invite link');
  }
  return res.json();
}

// Hook to send invites
export function useSendEventInvites(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendInvitesPayload) => sendInvites(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-invites', eventId] });
    },
  });
}

// Hook to fetch invites
export function useEventInvites(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-invites', eventId],
    queryFn: () => fetchInvites(eventId!),
    enabled: !!eventId,
    staleTime: 60_000,
  });
}

// Hook to fetch invite links
export function useEventInviteLinks(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-invite-links', eventId],
    queryFn: () => fetchInviteLinks(eventId!),
    enabled: !!eventId,
    staleTime: 60_000,
  });
}

// Hook to create invite link
export function useCreateInviteLink(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInviteLinkPayload) => createInviteLink(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-invite-links', eventId] });
    },
  });
}

// Hook to revoke invite link
export function useRevokeInviteLink(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => revokeInviteLink(eventId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-invite-links', eventId] });
    },
  });
}

// Hook to get invite link info
export function useInviteLinkInfo(token: string | undefined) {
  return useQuery({
    queryKey: ['invite-link-info', token],
    queryFn: () => getInviteLinkInfo(token!),
    enabled: !!token,
    retry: false,
  });
}

// Hook to redeem invite link
export function useRedeemInviteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: redeemInviteLink,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', data.event.id] });
    },
  });
}
