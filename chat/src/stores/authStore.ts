import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthenticatedUser, AuthenticatedParent, AuthenticatedChild, Child } from '@/types';

interface AuthState {
  // Current user (parent or child)
  user: AuthenticatedUser | null;

  // For parents: list of their children
  children: Child[];

  // Pending approvals count (for parent badge)
  pendingCount: number;

  // Loading state
  isLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  setUser: (user: AuthenticatedUser | null) => void;
  setChildren: (children: Child[]) => void;
  setPendingCount: (count: number | ((prev: number) => number)) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;

  // Computed
  isAuthenticated: () => boolean;
  isParent: () => boolean;
  isChild: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      children: [],
      pendingCount: 0,
      isLoading: true,
      error: null,

      setUser: (user) => set({ user, error: null }),
      setChildren: (children) => set({ children }),
      setPendingCount: (count) => set((state) => ({
        pendingCount: typeof count === 'function' ? count(state.pendingCount) : count
      })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      logout: () => set({ user: null, children: [], pendingCount: 0, error: null }),

      refreshUser: async () => {
        try {
          const response = await fetch('/api/auth/me');
          const data = await response.json();
          if (data.success && data.data.user) {
            set({ user: data.data.user });
            if (data.data.children) {
              set({ children: data.data.children });
            }
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },

      isAuthenticated: () => get().user !== null,
      isParent: () => get().user?.type === 'parent',
      isChild: () => get().user?.type === 'child',
    }),
    {
      name: 'deebop-chat-auth',
      partialize: (state) => ({
        user: state.user,
        children: state.children,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.user !== null);
export const useIsParent = () => useAuthStore((state) => state.user?.type === 'parent');
export const useIsChild = () => useAuthStore((state) => state.user?.type === 'child');
export const useChildren = () => useAuthStore((state) => state.children);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

// Type guards
export function isParentUser(user: AuthenticatedUser | null): user is AuthenticatedParent {
  return user?.type === 'parent';
}

export function isChildUser(user: AuthenticatedUser | null): user is AuthenticatedChild {
  return user?.type === 'child';
}
