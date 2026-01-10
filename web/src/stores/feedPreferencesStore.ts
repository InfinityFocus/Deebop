/**
 * Feed Preferences Store with Zustand
 * Manages user feed mode preference (Discovery, Following, or Favourites)
 * Persists to localStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type FeedMode = 'discovery' | 'following' | 'favourites';

interface FeedPreferencesState {
  mode: FeedMode;
  setMode: (mode: FeedMode) => void;
}

export const useFeedPreferencesStore = create<FeedPreferencesState>()(
  persist(
    (set) => ({
      mode: 'discovery', // Default to Discovery

      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'deebop-feed-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Selectors
export const useFeedMode = () => useFeedPreferencesStore((state) => state.mode);
export const useSetFeedMode = () => useFeedPreferencesStore((state) => state.setMode);
