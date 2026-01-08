'use client';

import { useRef, useEffect, useCallback } from 'react';

type CtaName =
  | 'explore'
  | 'create_account'
  | 'sign_in'
  | 'create_event'
  | 'build_creator_page'
  | 'features';

type ScrollDepth = 25 | 50 | 75 | 100;

interface TrackingPayload {
  sessionId: string;
  eventType: string;
  eventData?: {
    ctaName?: string;
    depth?: number;
    source?: string;
  };
}

async function sendTrackingEvent(payload: TrackingPayload) {
  try {
    await fetch('/api/analytics/homepage/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silent failure - analytics shouldn't break the page
  }
}

export function useHomepageAnalytics() {
  const sessionIdRef = useRef<string | null>(null);
  const hasTrackedView = useRef(false);
  const trackedScrollDepths = useRef<Set<number>>(new Set());
  const isInitialized = useRef(false);

  // Initialize session on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Get or create session ID
    let id = sessionStorage.getItem('homepage-session');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('homepage-session', id);
    }
    sessionIdRef.current = id;
  }, []);

  // Track page view (once per page load)
  const trackView = useCallback(() => {
    if (hasTrackedView.current || !sessionIdRef.current) return;
    hasTrackedView.current = true;

    sendTrackingEvent({
      sessionId: sessionIdRef.current,
      eventType: 'homepage_view',
    });
  }, []);

  // Track CTA click
  const trackCta = useCallback((ctaName: CtaName) => {
    if (!sessionIdRef.current) return;

    sendTrackingEvent({
      sessionId: sessionIdRef.current,
      eventType: 'cta_click',
      eventData: { ctaName },
    });
  }, []);

  // Track scroll depth
  const trackScroll = useCallback((depth: ScrollDepth) => {
    if (!sessionIdRef.current || trackedScrollDepths.current.has(depth)) return;
    trackedScrollDepths.current.add(depth);

    sendTrackingEvent({
      sessionId: sessionIdRef.current,
      eventType: 'scroll_depth',
      eventData: { depth },
    });
  }, []);

  // Track explore entry
  const trackExploreEntry = useCallback(() => {
    if (!sessionIdRef.current) return;

    sendTrackingEvent({
      sessionId: sessionIdRef.current,
      eventType: 'explore_entry',
      eventData: { source: 'homepage' },
    });
  }, []);

  return {
    trackView,
    trackCta,
    trackScroll,
    trackExploreEntry,
  };
}
