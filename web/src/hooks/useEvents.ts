import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { CreateEventPayload, EventCard, EventListType, CreateEventResponse } from '@/types/event';

// Fetch events list
async function fetchEvents(params: {
  type?: EventListType;
  cursor?: string;
  limit?: number;
}): Promise<{ events: EventCard[]; nextCursor: string | null; hasMore: boolean }> {
  const searchParams = new URLSearchParams();
  if (params.type) searchParams.set('type', params.type);
  if (params.cursor) searchParams.set('cursor', params.cursor);
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const res = await fetch(`/api/events?${searchParams.toString()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch events');
  }
  return res.json();
}

// Create event
async function createEvent(data: CreateEventPayload): Promise<CreateEventResponse> {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create event');
  }
  return res.json();
}

// Hook to fetch events list (paginated)
export function useEvents(type: EventListType = 'upcoming', limit: number = 20) {
  return useInfiniteQuery({
    queryKey: ['events', type],
    queryFn: ({ pageParam }) => fetchEvents({ type, cursor: pageParam, limit }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60_000, // 1 minute
  });
}

// Hook to fetch a single page of events (non-paginated)
export function useEventsList(type: EventListType = 'upcoming', limit: number = 20) {
  return useQuery({
    queryKey: ['events-list', type, limit],
    queryFn: () => fetchEvents({ type, limit }),
    staleTime: 60_000, // 1 minute
  });
}

// Hook to create event
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events-list'] });
    },
  });
}
