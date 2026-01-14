'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const router = useRouter();
  const {
    user,
    children,
    isLoading,
    error,
    setUser,
    setChildren,
    setLoading,
    setError,
    logout: clearStore,
  } = useAuthStore();

  // Fetch current user on mount
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.data.user) {
        setUser(data.data.user);
        if (data.data.children) {
          setChildren(data.data.children);
        }
      } else {
        setUser(null);
        setChildren([]);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setChildren, setLoading]);

  // Initialize auth state
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const endpoint =
        user?.type === 'parent'
          ? '/api/auth/parent/logout'
          : '/api/auth/child/logout';

      await fetch(endpoint, { method: 'POST' });
      clearStore();
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
      // Clear store anyway
      clearStore();
      router.push('/');
    }
  }, [user, clearStore, router]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return {
    user,
    children,
    isLoading,
    error,
    isAuthenticated: !!user,
    isParent: user?.type === 'parent',
    isChild: user?.type === 'child',
    logout,
    refreshUser,
    setError,
  };
}
