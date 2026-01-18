/**
 * Auth Store with Zustand
 * Manages user authentication state with multi-profile support
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profile, AccountTier, Identity, ProfileSummary } from '@/types/database';

interface AuthState {
  user: Profile | null;
  identity: Identity | null;
  profiles: ProfileSummary[];
  profileLimit: number;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: Profile | null) => void;
  setIdentity: (identity: Identity | null) => void;
  setProfiles: (profiles: ProfileSummary[]) => void;
  setProfileLimit: (limit: number) => void;
  updateUser: (updates: Partial<Profile>) => void;
  switchProfile: (profileId: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      identity: null,
      profiles: [],
      profileLimit: 1,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setIdentity: (identity) =>
        set({ identity }),

      setProfiles: (profiles) =>
        set({ profiles }),

      setProfileLimit: (profileLimit) =>
        set({ profileLimit }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      switchProfile: async (profileId: string) => {
        try {
          const res = await fetch('/api/auth/switch-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileId }),
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to switch profile');
          }

          // Refresh user data after switching
          const meRes = await fetch('/api/auth/me');
          if (meRes.ok) {
            const data = await meRes.json();
            if (data.user) {
              set({
                user: data.user,
                identity: data.identity,
                profiles: data.profiles || [],
                profileLimit: data.profile_limit || 1,
              });
            }
          }
        } catch (error) {
          console.error('Switch profile error:', error);
          throw error;
        }
      },

      logout: () =>
        set({
          user: null,
          identity: null,
          profiles: [],
          profileLimit: 1,
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
        identity: state.identity,
        profiles: state.profiles,
        profileLimit: state.profileLimit,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors
export const useUser = () => useAuthStore((state) => state.user);
export const useIdentity = () => useAuthStore((state) => state.identity);
export const useProfiles = () => useAuthStore((state) => state.profiles);
export const useProfileLimit = () => useAuthStore((state) => state.profileLimit);
export const useCanAddProfile = () => useAuthStore((state) => state.profiles.length < state.profileLimit);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useUserTier = (): AccountTier => useAuthStore((state) => state.identity?.tier || state.user?.tier || 'free');

// Tier utilities
export const TIER_LIMITS = {
  free: {
    maxImageSizeKB: 500,
    maxVideoSeconds: 30,
    maxVideoResolution: '720p',
    canUploadPanorama: false,
    canAddProfileLink: false,
    hasAds: true,
    maxProfiles: 1,
  },
  creator: {
    maxImageSizeMB: 50,
    maxVideoSeconds: 180,
    maxVideoResolution: '1080p',
    canUploadPanorama: true,
    canAddProfileLink: true,
    hasAds: 'reduced',
    maxProfiles: 2,
  },
  pro: {
    maxImageSizeMB: 50,
    maxVideoSeconds: 600,
    maxVideoResolution: '4K',
    canUploadPanorama: true,
    canAddProfileLink: true,
    hasAds: false,
    maxProfiles: 5,
  },
  teams: {
    maxImageSizeMB: 50,
    maxVideoSeconds: 600,
    maxVideoResolution: '4K',
    canUploadPanorama: true,
    canAddProfileLink: true,
    hasAds: false,
    maxProfiles: 30,
  },
} as const;

export const getTierLimits = (tier: AccountTier) => TIER_LIMITS[tier] || TIER_LIMITS.free;
