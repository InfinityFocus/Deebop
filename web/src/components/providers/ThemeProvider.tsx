'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAppearanceStore, getResolvedTheme } from '@/stores/appearanceStore';
import { useAuth } from '@/hooks/useAuth';

interface ThemeProviderProps {
  children: React.ReactNode;
}

// Routes where user theme preferences apply (authenticated app pages)
const APP_ROUTES = [
  '/home',
  '/explore',
  '/profile',
  '/settings',
  '/notifications',
  '/saved',
  '/post',
  '/reels',
  '/albums',
  '/events',
  '/drops',
  '/creator-page',
];

function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some(route => pathname.startsWith(route));
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const {
    theme,
    fontSize,
    reducedMotion,
    highContrast,
    resolvedTheme,
    setResolvedTheme,
    hydrateFromAPI,
    isHydrated,
  } = useAppearanceStore();

  // Check if we're on an app route where user preferences apply
  const isOnAppRoute = isAppRoute(pathname);

  // Update resolved theme when theme changes or system preference changes
  const updateResolvedTheme = useCallback(() => {
    const resolved = getResolvedTheme(theme);
    setResolvedTheme(resolved);
  }, [theme, setResolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    updateResolvedTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => updateResolvedTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme, updateResolvedTheme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Marketing pages always use dark mode, app pages use user preferences
    if (isOnAppRoute) {
      root.setAttribute('data-theme', resolvedTheme);
      root.setAttribute('data-font-size', fontSize);
      root.setAttribute('data-reduced-motion', String(reducedMotion));
      root.setAttribute('data-high-contrast', String(highContrast));
    } else {
      // Force dark mode for marketing pages
      root.setAttribute('data-theme', 'dark');
      root.setAttribute('data-font-size', 'medium');
      root.setAttribute('data-reduced-motion', 'false');
      root.setAttribute('data-high-contrast', 'false');
    }
  }, [isOnAppRoute, resolvedTheme, fontSize, reducedMotion, highContrast]);

  // Hydrate from API when user logs in
  useEffect(() => {
    if (user && !isHydrated) {
      // Fetch user's appearance preferences from API
      fetch('/api/users/me/appearance')
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data) => {
          if (data) {
            hydrateFromAPI({
              theme: data.theme,
              fontSize: data.fontSize,
              reducedMotion: data.reducedMotion,
              highContrast: data.highContrast,
            });
          }
        })
        .catch(() => {
          // Ignore errors, use local storage values
        });
    }
  }, [user, isHydrated, hydrateFromAPI]);

  return <>{children}</>;
}
