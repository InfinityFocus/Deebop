'use client';

/**
 * Cookie Preference Modal
 * Allows granular control over cookie categories
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCookieConsentSafe } from '@/components/providers/CookieConsentProvider';

interface CookieCategory {
  id: 'essential' | 'analytics' | 'marketing';
  name: string;
  description: string;
  required: boolean;
}

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'essential',
    name: 'Essential Cookies',
    description:
      'These cookies are necessary for the website to function properly. They enable core functionality such as security, account authentication, and remembering your preferences.',
    required: true,
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    description:
      'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our services.',
    required: false,
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    description:
      'These cookies are used to track visitors across websites to display relevant advertisements. They help measure the effectiveness of advertising campaigns.',
    required: false,
  },
];

export default function CookiePreferenceModal() {
  const context = useCookieConsentSafe();

  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
  });

  // Sync with context state when modal opens
  useEffect(() => {
    if (context?.consentState) {
      setPreferences({
        essential: true, // Always true
        analytics: context.consentState.analytics,
        marketing: context.consentState.marketing,
      });
    }
  }, [context?.consentState, context?.isPreferencesOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && context?.isPreferencesOpen) {
        context.closePreferences();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [context]);

  if (!context || !context.isPreferencesOpen) {
    return null;
  }

  const { acceptAll, rejectAll, updatePreferences, closePreferences } = context;

  const handleToggle = (id: 'essential' | 'analytics' | 'marketing') => {
    if (id === 'essential') return; // Cannot toggle essential
    setPreferences((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSave = () => {
    updatePreferences({
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    });
  };

  const handleRejectAll = () => {
    setPreferences({
      essential: true,
      analytics: false,
      marketing: false,
    });
    rejectAll();
  };

  const handleAcceptAll = () => {
    setPreferences({
      essential: true,
      analytics: true,
      marketing: true,
    });
    acceptAll();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-prefs-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closePreferences}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 id="cookie-prefs-title" className="text-lg font-semibold text-white">
            Cookie Preferences
          </h2>
          <button
            onClick={closePreferences}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Close preferences"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-sm text-gray-400">
            Manage your cookie preferences. Essential cookies cannot be disabled as
            they are required for the website to function.
          </p>

          {/* Categories */}
          {COOKIE_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">{category.name}</h3>
                <button
                  role="switch"
                  aria-checked={preferences[category.id]}
                  aria-label={`${category.name} ${preferences[category.id] ? 'enabled' : 'disabled'}`}
                  disabled={category.required}
                  onClick={() => handleToggle(category.id)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${category.required ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    ${preferences[category.id] ? 'bg-emerald-500' : 'bg-gray-600'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${preferences[category.id] ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-400">{category.description}</p>
              {category.required && (
                <p className="text-xs text-gray-500 mt-2">Always enabled</p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleRejectAll}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
          >
            Reject All
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
          >
            Accept All
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm font-medium text-black bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
