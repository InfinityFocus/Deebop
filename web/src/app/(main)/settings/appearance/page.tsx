'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Palette, Sun, Moon, Monitor, Type, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppearanceStore, type Theme, type FontSize } from '@/stores/appearanceStore';
import { clsx } from 'clsx';

interface ThemeOption {
  id: Theme;
  label: string;
  icon: React.ElementType;
  description: string;
}

interface AppearanceSettings {
  theme: Theme;
  fontSize: FontSize;
  reducedMotion: boolean;
  highContrast: boolean;
}

const themeOptions: ThemeOption[] = [
  {
    id: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Easy on the eyes',
  },
  {
    id: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Classic bright mode',
  },
  {
    id: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Match device settings',
  },
];

const fontSizeOptions: { id: FontSize; label: string; size: string }[] = [
  { id: 'small', label: 'Small', size: 'text-sm' },
  { id: 'medium', label: 'Medium', size: 'text-base' },
  { id: 'large', label: 'Large', size: 'text-lg' },
];

async function fetchAppearance(): Promise<AppearanceSettings> {
  const res = await fetch('/api/users/me/appearance');
  if (!res.ok) throw new Error('Failed to fetch appearance settings');
  return res.json();
}

export default function AppearanceSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Get store setters for real-time preview
  const {
    theme: storeTheme,
    fontSize: storeFontSize,
    reducedMotion: storeReducedMotion,
    highContrast: storeHighContrast,
    setTheme: setStoreTheme,
    setFontSize: setStoreFontSize,
    setReducedMotion: setStoreReducedMotion,
    setHighContrast: setStoreHighContrast,
  } = useAppearanceStore();

  // Local state for form
  const [theme, setTheme] = useState<Theme>(storeTheme);
  const [fontSize, setFontSize] = useState<FontSize>(storeFontSize);
  const [reducedMotion, setReducedMotion] = useState(storeReducedMotion);
  const [highContrast, setHighContrast] = useState(storeHighContrast);

  // Fetch user's saved appearance settings
  const { data, isLoading: settingsLoading } = useQuery({
    queryKey: ['appearance-settings'],
    queryFn: fetchAppearance,
    enabled: !!user,
    staleTime: 60000,
  });

  // Populate form when data loads
  useEffect(() => {
    if (data) {
      setTheme(data.theme || 'dark');
      setFontSize(data.fontSize || 'medium');
      setReducedMotion(data.reducedMotion || false);
      setHighContrast(data.highContrast || false);
    }
  }, [data]);

  // Apply changes to store immediately for preview
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setStoreTheme(newTheme);
  };

  const handleFontSizeChange = (newSize: FontSize) => {
    setFontSize(newSize);
    setStoreFontSize(newSize);
  };

  const handleReducedMotionChange = (value: boolean) => {
    setReducedMotion(value);
    setStoreReducedMotion(value);
  };

  const handleHighContrastChange = (value: boolean) => {
    setHighContrast(value);
    setStoreHighContrast(value);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (settings: Partial<AppearanceSettings>) => {
      const res = await fetch('/api/users/me/appearance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save appearance settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appearance-settings'] });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      theme,
      fontSize,
      reducedMotion,
      highContrast,
    });
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/settings"
          className="p-2 -ml-2 hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <Palette size={20} className="text-purple-400" />
          <h1 className="text-xl font-bold">Appearance</h1>
        </div>
      </div>

      <div className="space-y-8">
        {/* Theme */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Theme
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(option => {
              const Icon = option.icon;
              const isSelected = theme === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleThemeChange(option.id)}
                  className={clsx(
                    'relative p-4 rounded-xl border transition text-center',
                    isSelected
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check size={16} className="text-purple-400" />
                    </div>
                  )}
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2',
                      isSelected ? 'bg-purple-500/30' : 'bg-gray-700'
                    )}
                  >
                    <Icon
                      size={20}
                      className={isSelected ? 'text-purple-400' : 'text-gray-300'}
                    />
                  </div>
                  <p className={clsx('font-medium', isSelected ? 'text-purple-400' : 'text-white')}>
                    {option.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Font Size */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Font Size
          </h2>
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <Type size={20} className="text-gray-400" />
            <div className="flex-1 flex gap-2">
              {fontSizeOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleFontSizeChange(option.id)}
                  className={clsx(
                    'flex-1 py-2 px-3 rounded-lg font-medium transition',
                    fontSize === option.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  )}
                >
                  <span className={option.size}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Accessibility */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Accessibility
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div>
                <p className="font-medium text-white">Reduce Motion</p>
                <p className="text-sm text-gray-300">
                  Minimize animations throughout the app
                </p>
              </div>
              <button
                onClick={() => handleReducedMotionChange(!reducedMotion)}
                className={clsx(
                  'relative w-12 h-6 rounded-full transition-colors',
                  reducedMotion ? 'bg-purple-500' : 'bg-gray-600'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    reducedMotion ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div>
                <p className="font-medium text-white">High Contrast</p>
                <p className="text-sm text-gray-300">
                  Increase contrast for better visibility
                </p>
              </div>
              <button
                onClick={() => handleHighContrastChange(!highContrast)}
                className={clsx(
                  'relative w-12 h-6 rounded-full transition-colors',
                  highContrast ? 'bg-purple-500' : 'bg-gray-600'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    highContrast ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Saving...
            </>
          ) : saveMutation.isSuccess ? (
            'Saved!'
          ) : (
            'Save Changes'
          )}
        </button>

        {saveMutation.isError && (
          <p className="text-sm text-red-400 text-center">
            Failed to save settings. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
