'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import type { Profile } from '@/types/database';

/**
 * Hook to manage authentication state
 * Uses local JWT auth instead of Supabase
 */
export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, logout: storeLogout, setLoading } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (data.user) {
          setUser(data.user as Profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setUser(null);
      }
    };

    initAuth();
  }, [setUser]);

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
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, [setUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    refreshUser,
  };
}

/**
 * Hook for pages that require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { user, isAuthenticated, isLoading };
}
