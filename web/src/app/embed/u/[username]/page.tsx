'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { Suspense } from 'react';
import { EmbedFeedContainer } from '@/components/embed';
import { parseEmbedParams, EMBED_THEME_DEFAULTS } from '@/types/embed';

function EmbedFeedContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const username = params.username as string;
  const config = parseEmbedParams(searchParams);

  // Determine base URL
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://deebop.com';

  // Apply custom theming via CSS variables
  const themeColors = EMBED_THEME_DEFAULTS[config.theme || 'dark'];
  const bgColor = config.backgroundColor || themeColors.background;
  const accentColor = config.accentColor || themeColors.accent;

  // We need to fetch user tier to determine branding
  // For now, fetch it in the container and pass showBranding prop
  // This is a simplification - branding will show for non-pro users

  return (
    <div
      className="h-screen"
      style={{
        '--embed-bg': bgColor,
        '--embed-fg': themeColors.foreground,
        '--embed-accent': accentColor,
        '--embed-muted': themeColors.muted,
        '--embed-border': themeColors.border,
      } as React.CSSProperties}
    >
      <EmbedFeedContainer
        username={username}
        limit={config.limit || 10}
        contentType={config.contentType || 'all'}
        showEngagement={config.showEngagement ?? true}
        showBranding={true} // Will be controlled by tier check in component
        baseUrl={baseUrl}
        layout={config.layout || 'vertical'}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-screen flex items-center justify-center bg-[var(--embed-bg)]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--embed-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[var(--embed-muted)] mt-3">Loading...</p>
      </div>
    </div>
  );
}

export default function EmbedUserFeedPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <EmbedFeedContent />
    </Suspense>
  );
}
