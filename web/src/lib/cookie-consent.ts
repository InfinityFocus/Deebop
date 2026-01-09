/**
 * Cookie Consent Utilities
 * Functions for managing cookie consent state
 */

import type { ConsentState, CookieServiceInfo } from '@/types/cookie-consent';

// Constants
export const CONSENT_COOKIE_NAME = 'deebop_cookie_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_EXPIRY_DAYS = 365;

/**
 * Cookie services metadata
 * Add new tracking services here when implementing analytics
 */
export const COOKIE_SERVICES: CookieServiceInfo[] = [
  // Example - uncomment when adding GA4:
  // {
  //   id: 'ga4',
  //   name: 'Google Analytics 4',
  //   provider: 'Google LLC',
  //   purpose: 'Helps us understand how visitors use our site',
  //   duration: '2 years',
  //   thirdParty: true,
  //   category: 'analytics',
  // },
];

/**
 * Get current consent state from browser cookie
 */
export function getConsentState(): ConsentState | null {
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    const cookies = document.cookie.split(';');
    const consentCookie = cookies.find((c) =>
      c.trim().startsWith(`${CONSENT_COOKIE_NAME}=`)
    );

    if (!consentCookie) {
      return null;
    }

    const value = consentCookie.split('=')[1];
    const state = JSON.parse(decodeURIComponent(value)) as ConsentState;

    // Check version - if outdated, return null to force new consent
    if (state.version !== CONSENT_VERSION) {
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

/**
 * Save consent state to browser cookie
 */
export function saveConsentState(state: ConsentState): void {
  if (typeof document === 'undefined') {
    return;
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + CONSENT_EXPIRY_DAYS);

  const value = encodeURIComponent(JSON.stringify(state));
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Check if user has made a consent decision
 */
export function hasUserConsented(): boolean {
  return getConsentState() !== null;
}

/**
 * Create default consent state (GDPR opt-in - all non-essential false)
 */
function createDefaultState(): ConsentState {
  return {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    essential: true,
    analytics: false,
    marketing: false,
  };
}

/**
 * Accept all cookies
 */
export function acceptAllCookies(): ConsentState {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    essential: true,
    analytics: true,
    marketing: true,
  };

  saveConsentState(state);
  return state;
}

/**
 * Reject all non-essential cookies
 */
export function rejectAllCookies(): ConsentState {
  const state = createDefaultState();
  saveConsentState(state);
  return state;
}

/**
 * Update specific consent preferences
 */
export function updateConsentPreferences(
  preferences: Partial<ConsentState>
): ConsentState {
  const current = getConsentState() || createDefaultState();

  const state: ConsentState = {
    ...current,
    ...preferences,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    essential: true, // Always true
  };

  saveConsentState(state);
  return state;
}

/**
 * Clear all tracking cookies and consent
 */
export function clearAllCookies(): void {
  if (typeof document === 'undefined') {
    return;
  }

  // Clear consent cookie
  document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

  // Clear any analytics cookies (add more as services are added)
  const cookiesToClear = [
    '_ga',
    '_ga_*',
    '_gid',
    '_gat',
    // Add more tracking cookies here when implementing analytics
  ];

  cookiesToClear.forEach((name) => {
    if (name.includes('*')) {
      // Handle wildcard patterns like _ga_*
      const prefix = name.replace('*', '');
      document.cookie.split(';').forEach((c) => {
        const cookieName = c.split('=')[0].trim();
        if (cookieName.startsWith(prefix)) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
        }
      });
    } else {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    }
  });
}

/**
 * Check if a specific service has consent
 */
export function hasServiceConsent(service: 'analytics' | 'marketing'): boolean {
  const state = getConsentState();
  if (!state) {
    return false;
  }
  return state[service] === true;
}

/**
 * Check if analytics consent is granted
 */
export function hasAnalyticsConsent(): boolean {
  return hasServiceConsent('analytics');
}

/**
 * Check if marketing consent is granted
 */
export function hasMarketingConsent(): boolean {
  return hasServiceConsent('marketing');
}
