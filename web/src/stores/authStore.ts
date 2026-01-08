/**
 * Auth Store with Zustand
 * Manages user authentication state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profile, AccountTier } from '@/types/database';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: Profile | null) => void;
  updateUser: (updates: Partial<Profile>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'deebop-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useUserTier = (): AccountTier => useAuthStore((state) => state.user?.tier || 'free');

// Tier utilities
export const TIER_LIMITS = {
  free: {
    maxImageSizeKB: 500,
    maxVideoSeconds: 30,
    maxVideoResolution: '720p',
    canUploadPanorama: false,
    canAddProfileLink: false,
    hasAds: true,
  },
  standard: {
    maxImageSizeMB: 10,
    maxVideoSeconds: 60,
    maxVideoResolution: '1080p',
    canUploadPanorama: false,
    canAddProfileLink: true,
    hasAds: 'reduced',
  },
  pro: {
    maxImageSizeMB: 50,
    maxVideoSeconds: 300,
    maxVideoResolution: '4k',
    canUploadPanorama: true,
    canAddProfileLink: true,
    hasAds: false,
  },
} as const;

export const getTierLimits = (tier: AccountTier) => TIER_LIMITS[tier];
