import type { PresenceStatus } from '@/types';

/**
 * Calculate presence status based on online flag and last seen timestamp
 *
 * Status Logic:
 * - Online: is_online=true AND last_seen_at within 2 minutes
 * - Away: is_online=true AND last_seen_at between 2-10 minutes ago
 * - Offline: is_online=false OR last_seen_at older than 10 minutes
 */
export function calculatePresenceStatus(
  isOnline: boolean | null,
  lastSeenAt: string | null
): PresenceStatus {
  if (!isOnline) return 'offline';
  if (!lastSeenAt) return 'offline';

  const minutesSince = (Date.now() - new Date(lastSeenAt).getTime()) / 60000;

  if (minutesSince < 2) return 'online';
  if (minutesSince < 10) return 'away';
  return 'offline';
}

/**
 * Get human-readable status text
 */
export function getPresenceStatusText(status: PresenceStatus): string {
  switch (status) {
    case 'online':
      return 'Online';
    case 'away':
      return 'Away';
    case 'offline':
      return 'Offline';
  }
}

/**
 * Get CSS color class for presence status
 */
export function getPresenceStatusColor(status: PresenceStatus): string {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'away':
      return 'bg-yellow-500';
    case 'offline':
      return 'bg-gray-500';
  }
}
