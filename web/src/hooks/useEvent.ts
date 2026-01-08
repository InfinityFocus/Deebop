import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { EventDetail, UpdateEventPayload, RsvpPayload, EventAttendees } from '@/types/event';

// Fetch single event
async function fetchEvent(eventId: string): Promise<{ event: EventDetail }> {
  const res = await fetch(`/api/events/${eventId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch event');
  }
  return res.json();
}

// Update event
async function updateEvent(eventId: string, data: UpdateEventPayload): Promise<{ event: EventDetail }> {
  const res = await fetch(`/api/events/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update event');
  }
  return res.json();
}

// Cancel event
async function cancelEvent(eventId: string): Promise<{ message: string }> {
  const res = await fetch(`/api/events/${eventId}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to cancel event');
  }
  return res.json();
}

// RSVP to event
async function submitRsvp(eventId: string, data: RsvpPayload): Promise<{ rsvp: any; message: string }> {
  const res = await fetch(`/api/events/${eventId}/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update RSVP');
  }
  return res.json();
}

// Remove RSVP
async function removeRsvp(eventId: string): Promise<{ message: string }> {
  const res = await fetch(`/api/events/${eventId}/rsvp`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to remove RSVP');
  }
  return res.json();
}

// Fetch attendees
async function fetchAttendees(eventId: string): Promise<EventAttendees> {
  const res = await fetch(`/api/events/${eventId}/attendees`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch attendees');
  }
  return res.json();
}

// Hook to fetch single event
export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEvent(eventId!),
    enabled: !!eventId,
    staleTime: 30_000, // 30 seconds
  });
}

// Hook to update event
export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateEventPayload) => updateEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Hook to cancel event
export function useCancelEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Hook for RSVP
export function useRsvp(eventId: string) {
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: (data: RsvpPayload) => submitRsvp(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-attendees', eventId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeRsvp(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-attendees', eventId] });
    },
  });

  return {
    submit: submitMutation.mutate,
    remove: removeMutation.mutate,
    isSubmitting: submitMutation.isPending,
    isRemoving: removeMutation.isPending,
    submitError: submitMutation.error,
    removeError: removeMutation.error,
  };
}

// Hook to fetch attendees
export function useEventAttendees(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-attendees', eventId],
    queryFn: () => fetchAttendees(eventId!),
    enabled: !!eventId,
    staleTime: 60_000, // 1 minute
  });
}
