import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Interest, ContentPreferences, City } from '@/types/explore';

interface ExplorePreferencesState {
  // Selected interest for filtering
  selectedInterest: Interest | null;
  setSelectedInterest: (interest: Interest | null) => void;

  // Content filters
  contentFilters: ContentPreferences;
  setContentFilters: (filters: Partial<ContentPreferences>) => void;

  // Filters sheet open state
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;

  // User's selected interests
  userInterests: Interest[];
  setUserInterests: (interests: Interest[]) => void;

  // User's selected city
  userCity: City | null;
  setUserCity: (city: City | null) => void;

  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const defaultContentFilters: ContentPreferences = {
  hideAiGenerated: false,
  hideAiAssisted: false,
  hidePaidPartnership: false,
  hideSensitiveContent: false,
  boostNewsHeadlines: false,
  applyToDiscoveryFeed: false,
};

export const useExplorePreferencesStore = create<ExplorePreferencesState>()(
  persist(
    (set) => ({
      // Interest selection
      selectedInterest: null,
      setSelectedInterest: (interest) => set({ selectedInterest: interest }),

      // Content filters
      contentFilters: defaultContentFilters,
      setContentFilters: (filters) =>
        set((state) => ({
          contentFilters: { ...state.contentFilters, ...filters },
        })),

      // Filters sheet
      filtersOpen: false,
      setFiltersOpen: (open) => set({ filtersOpen: open }),

      // User interests (cached from API)
      userInterests: [],
      setUserInterests: (interests) => set({ userInterests: interests }),

      // User city (cached from API)
      userCity: null,
      setUserCity: (city) => set({ userCity: city }),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    {
      name: 'deebop-explore-prefs',
      partialize: (state) => ({
        contentFilters: state.contentFilters,
        userInterests: state.userInterests,
        userCity: state.userCity,
      }),
    }
  )
);
