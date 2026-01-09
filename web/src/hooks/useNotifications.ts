'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch('/api/notifications/unread-count');
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count || 0;
}

export function useUnreadNotificationCount() {
  const { user } = useAuth();

  const { data: count = 0 } = useQuery({
    queryKey: ['unread-notification-count'],
    queryFn: fetchUnreadCount,
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  return count;
}
