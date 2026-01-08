'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Images, Users } from 'lucide-react';
import type { AlbumResult } from '@/types/explore';

interface TrendingAlbumCardProps {
  album: AlbumResult;
}

export default function TrendingAlbumCard({ album }: TrendingAlbumCardProps) {
  return (
    <Link
      href={`/albums/${album.id}`}
      className="flex-shrink-0 w-52 group"
    >
      {/* Cover image */}
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-zinc-800">
        {album.coverUrl ? (
          <Image
            src={album.coverUrl}
            alt={album.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
            <Images className="w-12 h-12 text-zinc-600" />
          </div>
        )}

        {/* Overlay with stats */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-3 text-xs text-white">
            <span className="flex items-center gap-1">
              <Images className="w-3.5 h-3.5" />
              {album.itemCount}
            </span>
            {album.memberCount !== undefined && album.memberCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {album.memberCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2">
        <h4 className="font-medium truncate group-hover:text-emerald-400 transition-colors">
          {album.name}
        </h4>
        <p className="text-sm text-zinc-400 truncate">
          by @{album.creator.username}
        </p>
        {album.description && (
          <p className="text-sm text-zinc-500 line-clamp-2 mt-1">
            {album.description}
          </p>
        )}
      </div>
    </Link>
  );
}
