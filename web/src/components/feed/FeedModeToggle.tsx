'use client';

import { Compass, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { useFeedPreferencesStore, type FeedMode } from '@/stores/feedPreferencesStore';

interface FeedModeToggleProps {
  className?: string;
}

export function FeedModeToggle({ className }: FeedModeToggleProps) {
  const { mode, setMode } = useFeedPreferencesStore();

  const options: { value: FeedMode; label: string; icon: typeof Compass }[] = [
    { value: 'discovery', label: 'Discovery', icon: Compass },
    { value: 'following', label: 'Following', icon: Users },
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
                : 'text-gray-400 hover:text-white'
            )}
          >
            <Icon size={16} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
