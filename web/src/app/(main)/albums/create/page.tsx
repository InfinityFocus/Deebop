'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CreateAlbumForm } from '@/components/albums';
import { useRequireAuth } from '@/hooks/useAuth';

export default function CreateAlbumPage() {
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
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/albums"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
        >
          <ArrowLeft size={18} />
          Back to Albums
        </Link>

        <h1 className="text-2xl font-bold text-white">Create Album</h1>
        <p className="text-gray-500 mt-1">
          Create a collaborative album to share with friends
        </p>
      </div>

      {/* Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <CreateAlbumForm
          onSuccess={(albumId) => router.push(`/albums/${albumId}`)}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
