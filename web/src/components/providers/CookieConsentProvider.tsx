'use client';

/**
 * Cookie Consent Context Provider
 * Manages global cookie consent state across the app
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { ConsentState, CookieConsentContextType } from '@/types/cookie-consent';
import {
  getConsentState,
  acceptAllCookies,
  rejectAllCookies,
  updateConsentPreferences,
} from '@/lib/cookie-consent';

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

interface CookieConsentProviderProps {
  children: ReactNode;
}

export function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const [consentState, setConsentState] = useState<ConsentState | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Initialize on client-side only
  useEffect(() => {
    setIsClient(true);
    const state = getConsentState();
    setConsentState(state);
    setHasConsented(state !== null);
  }, []);

  const acceptAll = useCallback(() => {
    const state = acceptAllCookies();
    setConsentState(state);
    setHasConsented(true);
    setIsPreferencesOpen(false);

    // Future: Update Google Consent Mode here when analytics added
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('consent', 'update', {
    //     analytics_storage: 'granted',
    //     ad_storage: 'granted',
    //   });
    // }
  }, []);

  const rejectAll = useCallback(() => {
    const state = rejectAllCookies();
    setConsentState(state);
    setHasConsented(true);
    setIsPreferencesOpen(false);

    // Future: Update Google Consent Mode here when analytics added
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('consent', 'update', {
    //     analytics_storage: 'denied',
    //     ad_storage: 'denied',
    //   });
    // }
  }, []);

  const updatePreferences = useCallback((preferences: Partial<ConsentState>) => {
    const state = updateConsentPreferences(preferences);
    setConsentState(state);
    setHasConsented(true);
    setIsPreferencesOpen(false);

    // Future: Update Google Consent Mode here when analytics added
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('consent', 'update', {
    //     analytics_storage: state.analytics ? 'granted' : 'denied',
    //     ad_storage: state.marketing ? 'granted' : 'denied',
    //   });
    // }
  }, []);

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    setIsPreferencesOpen(false);
  }, []);

  const value: CookieConsentContextType = {
    consentState,
    hasConsented,
    acceptAll,
    rejectAll,
    updatePreferences,
    openPreferences,
    closePreferences,
    isPreferencesOpen,
  };

  // Don't render until client-side to avoid hydration mismatch
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

/**
 * Hook to access cookie consent context
 */
export function useCookieConsent(): CookieConsentContextType {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
}

/**
 * Safe hook that returns null if outside provider (for components that may be used outside)
 */
export function useCookieConsentSafe(): CookieConsentContextType | null {
  return useContext(CookieConsentContext);
}
