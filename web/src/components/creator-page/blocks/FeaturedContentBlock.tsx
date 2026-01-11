'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Image as ImageIcon, Film, Lock, Calendar, Music, Globe } from 'lucide-react';
import type { FeaturedContentBlockData } from '@/types/creator-page';

interface FeaturedContentBlockProps {
  data: FeaturedContentBlockData | Record<string, unknown>;
  onItemClick?: (index: number) => void;
}

interface FeaturedItem {
  type: 'post' | 'album' | 'event' | 'drop';
  id: string;
  title?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  contentType?: string;
  accessible: boolean;
  link: string;
}

export function FeaturedContentBlock({ data, onItemClick }: FeaturedContentBlockProps) {
  const blockData = data as FeaturedContentBlockData;
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch item details for each featured item
    const fetchItems = async () => {
      const fetchedItems: FeaturedItem[] = [];

      for (const item of blockData.items || []) {
        try {
          let endpoint = '';
          let link = '';

          switch (item.type) {
            case 'post':
              endpoint = `/api/posts/${item.id}`;
              link = `/p/${item.id}`;
              break;
            case 'album':
              endpoint = `/api/albums/${item.id}`;
              link = `/albums/${item.id}`;
              break;
            case 'event':
              endpoint = `/api/events/${item.id}`;
              link = `/events/${item.id}`;
              break;
            case 'drop':
              // Drops are posts with scheduled status
              endpoint = `/api/posts/${item.id}`;
              link = `/p/${item.id}`;
              break;
          }

          const res = await fetch(endpoint);

          if (res.ok) {
            const data = await res.json();
            const content = data.post || data.album || data.event || data;

            fetchedItems.push({
              type: item.type,
              id: item.id,
              title: content.title || content.headline || content.description?.slice(0, 50),
              thumbnailUrl: content.mediaThumbnailUrl || content.media_thumbnail_url || content.coverImageUrl,
              mediaUrl: content.mediaUrl || content.media_url,
              contentType: content.contentType || content.content_type,
              accessible: true,
              link,
            });
          } else {
            // Not accessible - show locked placeholder
            fetchedItems.push({
              type: item.type,
              id: item.id,
              accessible: false,
              link,
            });
          }
        } catch {
          // Error fetching - show locked placeholder
          fetchedItems.push({
            type: item.type,
            id: item.id,
            accessible: false,
            link: '#',
          });
        }
      }

      setItems(fetchedItems);
      setLoading(false);
    };

    fetchItems();
  }, [blockData.items]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: Math.min(blockData.items?.length || 3, 6) }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-800 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  const getTypeIcon = (type: string, contentType?: string) => {
    if (type === 'event') return Calendar;
    if (type === 'album') return ImageIcon;
    if (contentType === 'video') return Film;
    if (contentType === 'audio') return Music;
    if (contentType === 'panorama') return Globe;
    return ImageIcon;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item, index) => {
        const Icon = getTypeIcon(item.type, item.contentType);

        if (!item.accessible) {
          // Locked placeholder
          return (
            <div
              key={item.id}
              className="aspect-square bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700"
            >
              <Lock size={24} className="text-gray-600" />
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.link}
            onClick={() => onItemClick?.(index)}
            className="aspect-square relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-emerald-500 transition group"
          >
            {/* Thumbnail - special handling for audio and panorama posts */}
            {item.contentType === 'audio' ? (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-xl flex items-center justify-center">
                  <Music size={32} className="text-emerald-400" />
                </div>
              </div>
            ) : item.contentType === 'panorama' ? (
              // Panorama - always show styled placeholder (panorama images don't work well as thumbnails)
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 rounded-xl flex items-center justify-center">
                  <Globe size={32} className="text-cyan-400" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <span className="text-xs text-white/80 bg-black/40 px-2 py-1 rounded">360°</span>
                </div>
              </div>
            ) : item.thumbnailUrl || item.mediaUrl ? (
              <Image
                src={item.thumbnailUrl || item.mediaUrl!}
                alt={item.title || 'Featured content'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon size={32} className="text-gray-600" />
              </div>
            )}

            {/* Type badge */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-md">
              <Icon size={14} className="text-white" />
            </div>

            {/* Title overlay (if no image, audio post, or panorama without thumbnail) */}
            {item.title && (item.contentType === 'audio' || (item.contentType === 'panorama' && !item.thumbnailUrl) || (!item.thumbnailUrl && !item.mediaUrl)) && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-xs text-white truncate">{item.title}</p>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
