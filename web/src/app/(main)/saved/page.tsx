'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Bookmark, LayoutGrid, Columns2, Columns3 } from 'lucide-react';
import { clsx } from 'clsx';
import { ContentTypeFilter } from '@/components/feed';
import { SavedFeedContainer } from '@/components/feed/SavedFeedContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import type { ContentType } from '@/types/database';

export default function SavedPage() {
  const { user, isLoading } = useAuth();
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [columns, setColumns] = useState<1 | 2 | 3>(2);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Bookmark size={48} className="mx-auto text-gray-500 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Sign in to see saved posts</h1>
        <p className="text-gray-300 mb-6">Save posts to view them later</p>
        <a
          href="/login"
          className="inline-block px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition"
        >
          Sign In
        </a>
      </div>
    );
  }

  const columnToggle = (
    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => setColumns(1)}
        className={clsx(
          'p-2 rounded-md transition',
          columns === 1
            ? 'bg-emerald-500 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        )}
        aria-label="1 column layout"
        title="1 column"
      >
        <LayoutGrid size={18} />
      </button>
      <button
        onClick={() => setColumns(2)}
        className={clsx(
          'p-2 rounded-md transition',
          columns === 2
            ? 'bg-emerald-500 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        )}
        aria-label="2 column layout"
        title="2 columns"
      >
        <Columns2 size={18} />
      </button>
      <button
        onClick={() => setColumns(3)}
        className={clsx(
          'p-2 rounded-md transition',
          columns === 3
            ? 'bg-emerald-500 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        )}
        aria-label="3 column layout"
        title="3 columns"
      >
        <Columns3 size={18} />
      </button>
    </div>
  );

  return (
    <div className={clsx(
      'mx-auto',
      columns === 1 && 'max-w-2xl',
      columns === 2 && 'max-w-4xl',
      columns === 3 && 'max-w-6xl'
    )}>
      <PageHeader
        title="Saved"
        icon={<Bookmark size={24} />}
        actions={columnToggle}
      >
        <ContentTypeFilter selected={contentType} onChange={setContentType} />
      </PageHeader>

      {/* Saved Posts */}
      <div className="px-4 py-4">
        <SavedFeedContainer contentType={contentType} columns={columns} />
      </div>
    </div>
  );
}
