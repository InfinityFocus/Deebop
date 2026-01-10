'use client';

import { useEffect } from 'react';
import { Compass, Users, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useFeedPreferencesStore, type FeedMode } from '@/stores/feedPreferencesStore';

interface FeedModeToggleProps {
  className?: string;
}

async function fetchFavouritesSettings(): Promise<{ isEnabled: boolean }> {
  const res = await fetch('/api/favourites/settings');
  if (!res.ok) return { isEnabled: false };
  return res.json();
}

export function FeedModeToggle({ className }: FeedModeToggleProps) {
  const { mode, setMode } = useFeedPreferencesStore();

  // Fetch favourites settings
  const { data: favouritesSettings } = useQuery({
    queryKey: ['favourites-settings'],
    queryFn: fetchFavouritesSettings,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const favouritesEnabled = favouritesSettings?.isEnabled ?? false;

  // Fallback: if user is on favourites mode but feature is disabled, switch to discovery
  useEffect(() => {
    if (mode === 'favourites' && !favouritesEnabled) {
      setMode('discovery');
    }
  }, [mode, favouritesEnabled, setMode]);

  const options: { value: FeedMode; label: string; icon: typeof Compass }[] = [
    { value: 'discovery', label: 'Discovery', icon: Compass },
    { value: 'following', label: 'Following', icon: Users },
    ...(favouritesEnabled
      ? [{ value: 'favourites' as FeedMode, label: 'Favourites', icon: Star }]
      : []),
  ];

  return (
    <div className={clsx('flex bg-gray-900 rounded-full p-1', className)}>
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = mode === option.value;

        return (
          <button
            key={option.value}
            onClick={() => setMode(option.value)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-white',
              option.value === 'favourites' && isActive && 'text-yellow-600'
            )}
          >
            <Icon
              size={16}
              className={clsx(
                option.value === 'favourites' && isActive && 'text-yellow-500'
              )}
            />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
