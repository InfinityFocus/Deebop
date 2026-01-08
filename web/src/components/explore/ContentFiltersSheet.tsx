'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, BadgeCheck, DollarSign, AlertTriangle, Newspaper, Home } from 'lucide-react';
import { useExplorePreferencesStore } from '@/stores/explorePreferencesStore';
import type { ContentPreferences } from '@/types/explore';

interface ContentFiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FilterOption {
  key: keyof ContentPreferences;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    key: 'hideAiGenerated',
    icon: <Sparkles className="w-5 h-5" />,
    label: 'Hide AI-generated content',
    description: 'Hide content marked as fully AI-generated',
  },
  {
    key: 'hideAiAssisted',
    icon: <BadgeCheck className="w-5 h-5" />,
    label: 'Hide AI-assisted content',
    description: 'Hide content that used AI tools in creation',
  },
  {
    key: 'hidePaidPartnership',
    icon: <DollarSign className="w-5 h-5" />,
    label: 'Hide paid partnerships',
    description: 'Hide sponsored content and paid promotions',
  },
  {
    key: 'hideSensitiveContent',
    icon: <AlertTriangle className="w-5 h-5" />,
    label: 'Hide sensitive content',
    description: 'Hide content marked as sensitive or mature',
  },
  {
    key: 'boostNewsHeadlines',
    icon: <Newspaper className="w-5 h-5" />,
    label: 'Boost news headlines',
    description: 'Prioritize news and current events',
  },
];

export default function ContentFiltersSheet({
  isOpen,
  onClose,
}: ContentFiltersSheetProps) {
  const { contentFilters, setContentFilters } = useExplorePreferencesStore();
  const [localFilters, setLocalFilters] = useState<ContentPreferences>(contentFilters);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(contentFilters);
    }
  }, [isOpen, contentFilters]);

  const handleToggle = (key: keyof ContentPreferences) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/content-prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localFilters),
      });

      if (res.ok) {
        setContentFilters(localFilters);
        onClose();
      }
    } catch (err) {
      console.error('Error saving filters:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h2 className="text-lg font-semibold">Content Filters</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => handleToggle(option.key)}
              className="w-full flex items-start gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-left"
            >
              <div
                className={`p-2 rounded-lg ${
                  localFilters[option.key]
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-700 text-zinc-400'
                }`}
              >
                {option.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {option.description}
                </p>
              </div>
              <div
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  localFilters[option.key] ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    localFilters[option.key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          ))}

          {/* Separator */}
          <div className="border-t border-zinc-800 pt-4">
            <button
              onClick={() => handleToggle('applyToDiscoveryFeed')}
              className="w-full flex items-start gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-left"
            >
              <div
                className={`p-2 rounded-lg ${
                  localFilters.applyToDiscoveryFeed
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-700 text-zinc-400'
                }`}
              >
                <Home className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Apply to Discovery feed</p>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Also apply these filters to your Home Discovery feed
                </p>
              </div>
              <div
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  localFilters.applyToDiscoveryFeed
                    ? 'bg-emerald-500'
                    : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    localFilters.applyToDiscoveryFeed
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
            Save Filters
          </button>
        </div>
      </div>
    </>
  );
}
