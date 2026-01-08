'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Maximize2, Trash2, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { useDeleteAlbumItem } from '@/hooks/useAlbum';
import type { AlbumItem, AlbumRole } from '@/types/album';

interface AlbumItemGridProps {
  albumId: string;
  albumTitle?: string;
  items: AlbumItem[];
  currentUserRole: AlbumRole | null;
  currentUserId: string | null;
}

export function AlbumItemGrid({
  albumId,
  albumTitle,
  items,
  currentUserRole,
  currentUserId,
}: AlbumItemGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const deleteItem = useDeleteAlbumItem(albumId);

  const canDeleteAny = currentUserRole === 'owner' || currentUserRole === 'co_owner';

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setDeletingId(itemId);
    try {
      await deleteItem.mutateAsync(itemId);
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setDeletingId(null);
      setSelectedId(null);
    }
  };

  const canDeleteItem = (item: AlbumItem) => {
    if (canDeleteAny) return true;
    // Contributors can delete their own items
    return currentUserRole === 'contributor' && item.uploader.id === currentUserId;
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No items in this album yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map((item, index) => {
        const isVideo = item.content_type === 'video';
        const isPanorama = item.content_type === 'panorama360';
        const isSelected = selectedId === item.id;
        const isDeleting = deletingId === item.id;

        return (
          <div
            key={item.id}
            className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden group cursor-pointer"
            onClick={() => {
              if (isSelected) {
                setSelectedId(null);
              } else {
                setViewingIndex(index);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setSelectedId(isSelected ? null : item.id);
            }}
          >
            {/* Thumbnail */}
            {item.thumbnail_url || item.media_url ? (
              <img
                src={item.thumbnail_url || item.media_url}
                alt={item.caption || ''}
                className="w-full h-full object-cover transition group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                No preview
              </div>
            )}

            {/* Video/Panorama Indicator */}
            {(isVideo || isPanorama) && (
              <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded-full flex items-center gap-1 text-xs text-white">
                {isVideo ? (
                  <>
                    <Play size={12} />
                    Video
                  </>
                ) : (
                  <>
                    <Maximize2 size={12} />
                    360
                  </>
                )}
              </div>
            )}

            {/* Hover Overlay */}
            <div
              className={clsx(
                'absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition',
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
            >
              {canDeleteItem(item) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  disabled={isDeleting}
                  className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 transition"
                >
                  {isDeleting ? (
                    <Loader2 size={18} className="animate-spin text-white" />
                  ) : (
                    <Trash2 size={18} className="text-white" />
                  )}
                </button>
              )}
            </div>

            {/* Caption Preview on Hover */}
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition">
                <p className="text-white text-sm line-clamp-2">{item.caption}</p>
              </div>
            )}

            {/* Uploader Avatar - Always Visible */}
            <Link
              href={`/u/${item.uploader.username}`}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 right-2 z-10 group/avatar"
              title={`${item.uploader.display_name || item.uploader.username} · Uploaded ${formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}`}
            >
              <div className="w-7 h-7 rounded-full bg-black/60 ring-2 ring-black/40 flex items-center justify-center overflow-hidden hover:ring-emerald-500/50 transition-all">
                {item.uploader.avatar_url ? (
                  <img
                    src={item.uploader.avatar_url}
                    alt={item.uploader.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-xs font-medium">
                    {(item.uploader.display_name || item.uploader.username)[0].toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
          </div>
        );
      })}

      {/* Lightbox Viewer */}
      {viewingIndex !== null && items[viewingIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setViewingIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setViewingIndex(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition z-10"
          >
            <X size={24} className="text-white" />
          </button>

          {/* Navigation - Previous */}
          {viewingIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewingIndex(viewingIndex - 1);
              }}
              className="absolute left-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition z-10"
            >
              <ChevronLeft size={32} className="text-white" />
            </button>
          )}

          {/* Navigation - Next */}
          {viewingIndex < items.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewingIndex(viewingIndex + 1);
              }}
              className="absolute right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition z-10"
            >
              <ChevronRight size={32} className="text-white" />
            </button>
          )}

          {/* Media Content */}
          <div
            className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {items[viewingIndex].content_type === 'video' ? (
              <video
                src={items[viewingIndex].media_url}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            ) : (
              <img
                src={items[viewingIndex].media_url}
                alt={items[viewingIndex].caption || ''}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            )}
          </div>

          {/* Album Title Overlay */}
          {albumTitle && (
            <div className="absolute top-16 left-0 right-0 text-center">
              <h2 className="text-white/80 text-xl font-medium px-4">
                {albumTitle}
              </h2>
            </div>
          )}

          {/* Caption and counter */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-white/60 text-sm mb-2">
              {viewingIndex + 1} / {items.length}
            </p>
            {items[viewingIndex].caption && (
              <p className="text-white text-lg max-w-2xl mx-auto px-4">
                {items[viewingIndex].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
