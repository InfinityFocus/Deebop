'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

const HEARTBEAT_INTERVAL = 60000; // 60 seconds

/**
 * Sends heartbeat to server to update presence status
 * - Sends heartbeat on mount
 * - Sends heartbeat every 60 seconds
 * - Sends heartbeat when tab becomes visible
 * Only runs for authenticated children
 */
export function useHeartbeat() {
  const { user } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch('/api/child/heartbeat', {
        method: 'POST',
      });
    } catch (error) {
      // Silently fail - presence is not critical
      console.debug('Heartbeat failed:', error);
    }
  }, []);

  useEffect(() => {
    // Only run for authenticated children
    if (!user || user.type !== 'child') {
      return;
    }

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, sendHeartbeat]);
}
