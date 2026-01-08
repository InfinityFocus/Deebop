'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AlbumUploadPanel } from '@/components/albums/AlbumUploadPanel';
import { useRequireAuth } from '@/hooks/useAuth';

interface UploadAlbumPageProps {
  params: Promise<{ id: string }>;
}

export default function UploadAlbumPage({ params }: UploadAlbumPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/albums/${resolvedParams.id}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
        >
          <ArrowLeft size={18} />
          Back to Album
        </Link>

        <h1 className="text-2xl font-bold text-white">Upload to Album</h1>
        <p className="text-gray-500 mt-1">
          Add photos, videos, or 360 panoramas
        </p>
      </div>

      {/* Upload Panel */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <AlbumUploadPanel
          albumId={resolvedParams.id}
          onSuccess={() => router.push(`/albums/${resolvedParams.id}`)}
        />
      </div>
    </div>
  );
}
