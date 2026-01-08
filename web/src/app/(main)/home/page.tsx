'use client';

import { useState } from 'react';
import { Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FeedContainer, ContentTypeFilter, FeedModeToggle } from '@/components/feed';
import { PageHeader } from '@/components/layout/PageHeader';
import { useFeedPreferencesStore } from '@/stores/feedPreferencesStore';
import type { ContentType } from '@/types/database';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const mode = useFeedPreferencesStore((state) => state.mode);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Home"
        subtitle={user ? `@${user.username}` : undefined}
        icon={<Home size={24} />}
      >
        {user && (
          <div className="flex justify-center mb-3">
            <FeedModeToggle />
          </div>
        )}
        <ContentTypeFilter selected={contentType} onChange={setContentType} />
      </PageHeader>

      {/* Feed Content */}
      <div className="px-4 py-4">
        {user ? (
          <FeedContainer contentType={contentType} mode={mode} />
        ) : (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold mb-2">Welcome to Deebop</h2>
            <p className="text-gray-500 mb-4">
              Sign in to see posts from people you follow.
            </p>
            <a
              href="/login"
              className="inline-block px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition"
            >
              Sign In
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
