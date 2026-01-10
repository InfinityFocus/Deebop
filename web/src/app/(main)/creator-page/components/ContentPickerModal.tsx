'use client';

import { useState, useEffect } from 'react';
import { X, Search, Image, Film, Music, Calendar, Loader2, Check, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface ContentItem {
  id: string;
  type: 'post' | 'album' | 'event';
  title: string;
  thumbnailUrl: string | null;
  contentType?: string;
  date: string;
}

interface ContentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: { type: 'post' | 'album' | 'event'; id: string }) => void;
  selectedIds: string[];
  maxItems: number;
}

type TabType = 'posts' | 'albums' | 'events';

export function ContentPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedIds,
  maxItems,
}: ContentPickerModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<{
    posts: ContentItem[];
    albums: ContentItem[];
    events: ContentItem[];
  }>({
    posts: [],
    albums: [],
    events: [],
  });

  // Fetch content on mount
  useEffect(() => {
    if (!isOpen) return;

    const fetchContent = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/creator-page/my-content');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();

        setContent({
          posts: data.posts.map((p: any) => ({
            id: p.id,
            type: 'post' as const,
            title: p.headline || p.description?.slice(0, 50) || 'Untitled',
            thumbnailUrl: p.mediaThumbnailUrl || p.mediaUrl,
            contentType: p.contentType,
            date: p.createdAt,
          })),
          albums: data.albums.map((a: any) => ({
            id: a.id,
            type: 'album' as const,
            title: a.title || 'Untitled Album',
            thumbnailUrl: a.coverImageUrl,
            date: a.createdAt,
          })),
          events: data.events.map((e: any) => ({
            id: e.id,
            type: 'event' as const,
            title: e.title || 'Untitled Event',
            thumbnailUrl: e.coverImageUrl,
            date: e.startAt,
          })),
        });
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentItems = content[activeTab];
  const filteredItems = searchQuery
    ? currentItems.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentItems;

  const canAddMore = selectedIds.length < maxItems;

  const getContentIcon = (item: ContentItem) => {
    if (item.type === 'album') return <Image size={14} />;
    if (item.type === 'event') return <Calendar size={14} />;
    if (item.contentType === 'video') return <Film size={14} />;
    if (item.contentType === 'audio') return <Music size={14} />;
    return <Image size={14} />;
  };

  const handleSelect = (item: ContentItem) => {
    if (selectedIds.includes(item.id)) return;
    if (!canAddMore) return;
    onSelect({ type: item.type, id: item.id });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-2xl max-h-[80vh] bg-gray-900 rounded-2xl flex flex-col overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Select Content to Feature</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['posts', 'albums', 'events'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex-1 py-3 text-sm font-medium transition capitalize',
                activeTab === tab
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {tab}
              <span className="ml-1 text-xs text-gray-600">
                ({content[tab].length})
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-800">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title..."
              className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p>No {activeTab} found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={clsx(
                      'relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition group',
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'border-gray-700 hover:border-gray-600',
                      !canAddMore && !isSelected && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {/* Thumbnail */}
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        {getContentIcon(item)}
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Content Type Badge */}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-full flex items-center gap-1 text-xs text-white">
                      {getContentIcon(item)}
                      <span className="capitalize">{item.type}</span>
                    </div>

                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}

                    {/* Add Button (on hover, not selected) */}
                    {!isSelected && canAddMore && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-gray-800/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Plus size={14} className="text-white" />
                      </div>
                    )}

                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-sm text-white font-medium truncate">
                        {item.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {selectedIds.length} of {maxItems} selected
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
