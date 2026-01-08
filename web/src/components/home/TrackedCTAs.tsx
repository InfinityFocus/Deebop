'use client';

import Link from 'next/link';
import { useHomepageAnalytics } from '@/hooks/useHomepageAnalytics';

export function TrackedCTAs() {
  const { trackCta, trackExploreEntry } = useHomepageAnalytics();

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-6 items-center">
      <Link
        href="/features"
        onClick={() => trackCta('features')}
        className="rounded-full bg-white px-8 py-3 font-semibold text-black transition hover:bg-gray-200"
      >
        Features
      </Link>
      <Link
        href="/register"
        onClick={() => trackCta('create_account')}
        className="rounded-full border border-gray-600 px-8 py-3 font-semibold text-white transition hover:bg-gray-800"
      >
        Create account
      </Link>
      <Link
        href="/login"
        onClick={() => trackCta('sign_in')}
        className="text-gray-400 hover:text-white font-medium transition"
      >
        Sign in
      </Link>
    </div>
  );
}

export function TrackedExploreCTA() {
  const { trackCta, trackExploreEntry } = useHomepageAnalytics();

  const handleClick = () => {
    trackCta('explore');
    trackExploreEntry();
  };

  return (
    <Link
      href="/browse"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full border border-gray-600 px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
    >
      View more in Explore
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </Link>
  );
}

export function TrackedEventCTA() {
  const { trackCta } = useHomepageAnalytics();

  return (
    <Link
      href="/register"
      onClick={() => trackCta('create_event')}
      className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3 rounded-full transition"
    >
      Create an event
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </Link>
  );
}

export function TrackedCreatorPageCTA() {
  const { trackCta } = useHomepageAnalytics();

  return (
    <Link
      href="/register"
      onClick={() => trackCta('build_creator_page')}
      className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-black font-semibold px-8 py-3 rounded-full transition"
    >
      Build your Creator Page
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </Link>
  );
}
