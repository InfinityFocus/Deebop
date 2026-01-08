'use client';

import { use } from 'react';
import { AlbumDetailView } from '@/components/albums';
import { useAuth } from '@/hooks/useAuth';

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

export default function AlbumPage({ params }: AlbumPageProps) {
  const resolvedParams = use(params);
  const { user } = useAuth();

  return (
    <div className="px-4 py-6">
      <AlbumDetailView
        albumId={resolvedParams.id}
        currentUserId={user?.id || null}
      />
    </div>
  );
}
