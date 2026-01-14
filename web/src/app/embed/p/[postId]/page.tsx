'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { EmbedPostCard, EmbedBranding } from '@/components/embed';
import { parseEmbedParams, EMBED_THEME_DEFAULTS } from '@/types/embed';
import type { EmbedPost, EmbedUser } from '@/types/embed';

function EmbedPostContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const postId = params.postId as string;
  const config = parseEmbedParams(searchParams);

  const [post, setPost] = useState<EmbedPost | null>(null);
  const [author, setAuthor] = useState<EmbedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine base URL
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://deebop.com';

  // Apply custom theming via CSS variables
  const themeColors = EMBED_THEME_DEFAULTS[config.theme || 'dark'];
  const bgColor = config.backgroundColor || themeColors.background;
  const accentColor = config.accentColor || themeColors.accent;

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/embed/posts/${postId}`);

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Post not found or unavailable');
          }
          throw new Error('Failed to load post');
        }

        const data = await res.json();
        setPost(data.post);
        setAuthor(data.author);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [postId]);

  // Determine if branding should show (non-pro users)
  const showBranding = !author || author.tier !== 'pro';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        '--embed-bg': bgColor,
        '--embed-fg': themeColors.foreground,
        '--embed-accent': accentColor,
        '--embed-muted': themeColors.muted,
        '--embed-border': themeColors.border,
      } as React.CSSProperties}
    >
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[var(--embed-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[var(--embed-muted)] mt-3">Loading post...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-[var(--embed-muted)] text-sm">{error}</p>
            <a
              href={baseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-sm text-[var(--embed-accent)] hover:underline"
            >
              Visit Deebop
            </a>
          </div>
        </div>
      ) : post ? (
        <div className="flex-1 p-2">
          <EmbedPostCard
            post={post}
            showEngagement={config.showEngagement ?? true}
            baseUrl={baseUrl}
          />
        </div>
      ) : null}

      {showBranding && <EmbedBranding baseUrl={baseUrl} />}
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

export default function EmbedPostPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <EmbedPostContent />
    </Suspense>
  );
}
