'use client';

/**
 * Cookie Consent Banner
 * Shows at bottom of page when user hasn't consented yet
 */

import { useCookieConsentSafe } from '@/components/providers/CookieConsentProvider';
import CookiePreferenceModal from './CookiePreferenceModal';
import Link from 'next/link';

export default function CookieConsentBanner() {
  const context = useCookieConsentSafe();

  // Safe SSR handling - return null if context not available
  if (!context) {
    return null;
  }

  const { hasConsented, acceptAll, openPreferences, isPreferencesOpen } = context;

  // If user has consented, only render the modal (for preference changes)
  if (hasConsented) {
    return <CookiePreferenceModal />;
  }

  return (
    <>
      {/* Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
        role="dialog"
        aria-label="Cookie consent"
      >
        <div className="bg-gray-900 border-t border-gray-800 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Text */}
              <div className="flex-1">
                <p className="text-sm text-gray-300">
                  We use cookies to enhance your experience. By continuing to visit this
                  site you agree to our use of cookies.{' '}
                  <Link
                    href="/cookies"
                    className="text-emerald-400 hover:text-emerald-300 underline"
                  >
                    Learn more
                  </Link>
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={openPreferences}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
                >
                  Manage Preferences
                </button>
                <button
                  onClick={acceptAll}
                  className="px-4 py-2 text-sm font-medium text-black bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      <CookiePreferenceModal />

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
