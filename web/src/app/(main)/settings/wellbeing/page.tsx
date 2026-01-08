'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Heart, Check } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface UserPreferences {
  doomScrollPreference: string;
}

async function fetchPreferences(): Promise<UserPreferences> {
  const res = await fetch('/api/users/me/preferences');
  if (!res.ok) throw new Error('Failed to fetch preferences');
  return res.json();
}

const preferenceOptions = [
  {
    value: 'on',
    label: 'On',
    description: 'Remind me at the default threshold',
  },
  {
    value: 'reduced',
    label: 'Reduced',
    description: 'Less frequent reminders',
  },
  {
    value: 'off',
    label: 'Off',
    description: 'Never show reminders',
  },
];

export default function WellbeingSettingsPage() {
  const queryClient = useQueryClient();
  const [selectedPreference, setSelectedPreference] = useState<string>('on');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: fetchPreferences,
  });

  // Populate form when data loads
  useEffect(() => {
    if (data?.doomScrollPreference) {
      setSelectedPreference(data.doomScrollPreference);
    }
  }, [data]);

  const updatePreference = useMutation({
    mutationFn: async (preference: string) => {
      const res = await fetch('/api/users/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doomScrollPreference: preference }),
      });
      if (!res.ok) throw new Error('Failed to update preference');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });

  const handlePreferenceChange = (preference: string) => {
    setSelectedPreference(preference);
    updatePreference.mutate(preference);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16 text-red-400">
          Failed to load preferences. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/settings"
          className="p-2 rounded-lg hover:bg-gray-800 transition"
        >
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Wellbeing</h1>
          <p className="text-gray-400">Manage features that help you take breaks</p>
        </div>
      </div>

      {/* Doom Scroll Reminders */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Doom Scroll Reminders</h2>
            <p className="text-sm text-gray-400">Get gentle reminders to take breaks while scrolling</p>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {preferenceOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePreferenceChange(option.value)}
              disabled={updatePreference.isPending}
              className={clsx(
                'w-full flex items-center gap-4 p-4 rounded-xl border transition text-left',
                selectedPreference === option.value
                  ? 'border-amber-500/50 bg-amber-500/10'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
              )}
            >
              <div
                className={clsx(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  selectedPreference === option.value
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-gray-600'
                )}
              >
                {selectedPreference === option.value && (
                  <Check size={12} className="text-black" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={clsx(
                    'font-medium',
                    selectedPreference === option.value ? 'text-amber-400' : 'text-white'
                  )}
                >
                  {option.label}
                </p>
                <p className="text-sm text-gray-400">{option.description}</p>
              </div>
              {updatePreference.isPending && selectedPreference === option.value && (
                <Loader2 size={16} className="animate-spin text-amber-400" />
              )}
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs text-gray-500">
          When enabled, you&apos;ll see a friendly reminder after scrolling for a while.
          You can choose to take a break (which blurs the feed temporarily) or keep scrolling.
        </p>
      </div>
    </div>
  );
}
