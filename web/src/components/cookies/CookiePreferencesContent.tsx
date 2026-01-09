'use client';

/**
 * Cookie Preferences Content
 * Content for the cookie preferences management page
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCookieConsentSafe } from '@/components/providers/CookieConsentProvider';
import { clearAllCookies } from '@/lib/cookie-consent';
import CookiePreferenceModal from './CookiePreferenceModal';

export default function CookiePreferencesContent() {
  const context = useCookieConsentSafe();
  const openPreferences = context?.openPreferences;
  const hasConsented = context?.hasConsented ?? false;
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Auto-open preferences modal on first mount
  useEffect(() => {
    if (!hasOpenedOnce && openPreferences) {
      openPreferences();
      setHasOpenedOnce(true);
    }
  }, [openPreferences, hasOpenedOnce]);

  const handleClearAllCookies = () => {
    if (confirm('This will clear all cookies and reload the page. Continue?')) {
      setIsClearing(true);
      clearAllCookies();
      // Reload page to reset all state
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Manage Your Preferences</h2>
        <p className="text-gray-400 leading-relaxed">
          You can manage your cookie preferences at any time. Use the button below to
          open the preference panel and choose which types of cookies you want to allow.
        </p>
      </section>

      {/* Preferences Button */}
      <section className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Cookie Settings</h3>
        <p className="text-gray-400 text-sm mb-4">
          {hasConsented
            ? 'You have already set your cookie preferences. Click below to update them.'
            : 'You have not yet set your cookie preferences.'}
        </p>
        <button
          onClick={() => openPreferences?.()}
          disabled={!openPreferences}
          className="px-6 py-3 text-sm font-medium text-black bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Open Cookie Preferences
        </button>
      </section>

      {/* Clear All Cookies */}
      <section className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Clear All Cookies</h3>
        <p className="text-gray-400 text-sm mb-4">
          This will remove all cookies set by our website, including your consent
          preferences. You will be asked to consent again on your next visit.
        </p>
        <button
          onClick={handleClearAllCookies}
          disabled={isClearing}
          className="px-6 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {isClearing ? 'Clearing...' : 'Clear All Cookies'}
        </button>
      </section>

      {/* Links */}
      <section>
        <h3 className="text-lg font-medium mb-4">Learn More</h3>
        <ul className="space-y-2">
          <li>
            <Link
              href="/cookies"
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              Cookie Policy
            </Link>
            <span className="text-gray-500"> - Learn about how we use cookies</span>
          </li>
          <li>
            <Link
              href="/privacy"
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-500"> - How we handle your data</span>
          </li>
        </ul>
      </section>

      {/* Modal renders here */}
      <CookiePreferenceModal />
    </div>
  );
}
