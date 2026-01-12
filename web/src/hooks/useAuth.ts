'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import type { Profile } from '@/types/database';

/**
 * Hook to manage authentication state with multi-profile support
 * Uses local JWT auth with Identity + Profile architecture
 */
export function useAuth() {
  const router = useRouter();
  const {
    user,
    identity,
    profiles,
    profileLimit,
    isAuthenticated,
    isLoading,
    setUser,
    setIdentity,
    setProfiles,
    setProfileLimit,
    switchProfile: storeSwitchProfile,
    logout: storeLogout,
    setLoading,
  } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (data.user) {
          setUser(data.user as Profile);
          if (data.identity) {
            setIdentity(data.identity);
          }
          if (data.profiles) {
            setProfiles(data.profiles);
          }
          if (data.profile_limit) {
            setProfileLimit(data.profile_limit);
          }
        } else {
          setUser(null);
          setIdentity(null);
          setProfiles([]);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setUser(null);
        setIdentity(null);
        setProfiles([]);
      }
    };

    initAuth();
  }, [setUser, setIdentity, setProfiles, setProfileLimit]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    storeLogout();
    router.push('/');
    router.refresh();
  }, [storeLogout, router]);

  // Refresh user profile
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.user) {
        setUser(data.user as Profile);
        if (data.identity) {
          setIdentity(data.identity);
        }
        if (data.profiles) {
          setProfiles(data.profiles);
        }
        if (data.profile_limit) {
          setProfileLimit(data.profile_limit);
        }
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, [setUser, setIdentity, setProfiles, setProfileLimit]);

  // Switch to a different profile
  const switchProfile = useCallback(async (profileId: string) => {
    try {
      await storeSwitchProfile(profileId);
      router.refresh();
    } catch (error) {
      console.error('Switch profile error:', error);
      throw error;
    }
  }, [storeSwitchProfile, router]);

  // Check if user can add more profiles
  const canAddProfile = profiles.length < profileLimit;

  return {
    user,
    identity,
    profiles,
    profileLimit,
    canAddProfile,
    isAuthenticated,
    isLoading,
    logout,
    refreshUser,
    switchProfile,
  };
}

/**
 * Hook for pages that require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, identity, profiles } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { user, identity, profiles, isAuthenticated, isLoading };
}
