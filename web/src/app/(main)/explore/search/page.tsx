'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchOverlay from '@/components/explore/SearchOverlay';
import type { SearchTab } from '@/types/explore';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTab = (searchParams.get('tab') || 'all') as SearchTab;

  return <SearchOverlay initialQuery={initialQuery} initialTab={initialTab} />;
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
