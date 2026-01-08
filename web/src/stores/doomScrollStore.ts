import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DoomScrollState {
  // Tracking state
  postsViewed: number;
  sessionStartTime: number;
  lastWarningShownAt: number | null;
  warningDismissedAt: number | null;

  // Break state
  breakActiveUntil: number | null;

  // Actions
  incrementPosts: () => void;
  resetSession: () => void;
  dismissWarning: () => void;

  // Break actions
  startBreak: (durationSeconds: number) => void;
  endBreak: () => void;
  isBreakActive: () => boolean;
  getBreakTimeRemaining: () => number;

  // Computed check
  shouldShowWarning: (postsThreshold: number, timeThresholdSeconds: number) => boolean;
  getTimeElapsed: () => number;
}

export const useDoomScrollStore = create<DoomScrollState>()(
  persist(
    (set, get) => ({
      postsViewed: 0,
      sessionStartTime: Date.now(),
      lastWarningShownAt: null,
      warningDismissedAt: null,
      breakActiveUntil: null,

      incrementPosts: () => {
        set((state) => ({ postsViewed: state.postsViewed + 1 }));
      },

      resetSession: () => {
        set({
          postsViewed: 0,
          sessionStartTime: Date.now(),
          lastWarningShownAt: null,
          warningDismissedAt: null,
        });
      },

      dismissWarning: () => {
        const now = Date.now();
        set({
          lastWarningShownAt: now,
          warningDismissedAt: now,
          // Reset counters after dismissal so user gets another warning after threshold
          postsViewed: 0,
          sessionStartTime: now,
        });
      },

      startBreak: (durationSeconds: number) => {
        const now = Date.now();
        set({
          breakActiveUntil: now + durationSeconds * 1000,
          lastWarningShownAt: now,
          warningDismissedAt: now,
        });
      },

      endBreak: () => {
        const now = Date.now();
        set({
          breakActiveUntil: null,
          // Reset session after break ends
          postsViewed: 0,
          sessionStartTime: now,
          lastWarningShownAt: null,
          warningDismissedAt: null,
        });
      },

      isBreakActive: () => {
        const state = get();
        if (!state.breakActiveUntil) return false;
        return Date.now() < state.breakActiveUntil;
      },

      getBreakTimeRemaining: () => {
        const state = get();
        if (!state.breakActiveUntil) return 0;
        const remaining = Math.max(0, state.breakActiveUntil - Date.now());
        return Math.ceil(remaining / 1000);
      },

      shouldShowWarning: (postsThreshold: number, timeThresholdSeconds: number) => {
        const state = get();

        // Don't show if break is active
        if (state.breakActiveUntil && Date.now() < state.breakActiveUntil) {
          return false;
        }

        // Don't show if recently dismissed (within last 30 seconds)
        if (state.warningDismissedAt && Date.now() - state.warningDismissedAt < 30000) {
          return false;
        }

        const timeElapsed = (Date.now() - state.sessionStartTime) / 1000;
        const postsExceeded = state.postsViewed >= postsThreshold;
        const timeExceeded = timeElapsed >= timeThresholdSeconds;

        return postsExceeded || timeExceeded;
      },

      getTimeElapsed: () => {
        const state = get();
        return Math.floor((Date.now() - state.sessionStartTime) / 1000);
      },
    }),
    {
      name: 'deebop-doom-scroll',
      storage: createJSONStorage(() => {
        // Check if window is defined (client-side)
        if (typeof window !== 'undefined') {
          return sessionStorage; // Use sessionStorage so it resets when tab closes
        }
        // Return a no-op storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      // Only persist certain fields
      partialize: (state) => ({
        postsViewed: state.postsViewed,
        sessionStartTime: state.sessionStartTime,
        lastWarningShownAt: state.lastWarningShownAt,
        warningDismissedAt: state.warningDismissedAt,
        breakActiveUntil: state.breakActiveUntil,
      }),
    }
  )
);

// Helper to format time for display
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} min`;
}
