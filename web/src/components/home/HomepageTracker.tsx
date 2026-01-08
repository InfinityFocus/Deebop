'use client';

import { useEffect, useCallback } from 'react';
import { useHomepageAnalytics } from '@/hooks/useHomepageAnalytics';

export default function HomepageTracker() {
  const { trackView, trackScroll } = useHomepageAnalytics();

  // Track page view on mount
  useEffect(() => {
    // Small delay to ensure session is initialized
    const timer = setTimeout(() => {
      trackView();
    }, 100);
    return () => clearTimeout(timer);
  }, [trackView]);

  // Track scroll depth
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (docHeight <= 0) return;

    const scrollPercent = (scrollTop / docHeight) * 100;

    if (scrollPercent >= 25) trackScroll(25);
    if (scrollPercent >= 50) trackScroll(50);
    if (scrollPercent >= 75) trackScroll(75);
    if (scrollPercent >= 100) trackScroll(100);
  }, [trackScroll]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // This component renders nothing - it just handles tracking
  return null;
}
