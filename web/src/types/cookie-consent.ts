/**
 * Cookie Consent Types
 * Type definitions for cookie consent management
 */

// Available cookie service categories
export type CookieService = 'analytics' | 'marketing';

// User's consent preferences stored in browser cookie
export interface ConsentState {
  version: number;
  timestamp: string;
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
}

// Metadata about each tracking service (for display in modal)
export interface CookieServiceInfo {
  id: string;
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  thirdParty: boolean;
  category: CookieService;
}

// Context type for the CookieConsentProvider
export interface CookieConsentContextType {
  consentState: ConsentState | null;
  hasConsented: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  updatePreferences: (preferences: Partial<ConsentState>) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  isPreferencesOpen: boolean;
}
