import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'system';
export type FontSize = 'small' | 'medium' | 'large';

interface AppearanceState {
  // Settings
  theme: Theme;
  fontSize: FontSize;
  reducedMotion: boolean;
  highContrast: boolean;

  // Resolved theme (what's actually applied - dark or light)
  resolvedTheme: 'dark' | 'light';

  // Hydration state
  isHydrated: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  setFontSize: (fontSize: FontSize) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setHighContrast: (highContrast: boolean) => void;
  setResolvedTheme: (theme: 'dark' | 'light') => void;
  setHydrated: (hydrated: boolean) => void;

  // Hydrate from API
  hydrateFromAPI: (settings: {
    theme?: Theme;
    fontSize?: FontSize;
    reducedMotion?: boolean;
    highContrast?: boolean;
  }) => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      fontSize: 'medium',
      reducedMotion: false,
      highContrast: false,
      resolvedTheme: 'dark',
      isHydrated: false,

      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      hydrateFromAPI: (settings) => {
        set({
          theme: settings.theme || get().theme,
          fontSize: settings.fontSize || get().fontSize,
          reducedMotion: settings.reducedMotion ?? get().reducedMotion,
          highContrast: settings.highContrast ?? get().highContrast,
          isHydrated: true,
        });
      },
    }),
    {
      name: 'deebop-appearance',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        reducedMotion: state.reducedMotion,
        highContrast: state.highContrast,
      }),
    }
  )
);

// Helper to get the resolved theme based on system preference
export function getResolvedTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark'; // Default to dark on server
  }
  return theme;
}
