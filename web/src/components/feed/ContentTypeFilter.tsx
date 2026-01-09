'use client';

import { clsx } from 'clsx';
import { Type, Image, Video, Globe, Music } from 'lucide-react';
import type { ContentType } from '@/types/database';

interface ContentTypeFilterProps {
  selected: ContentType | null;
  onChange: (type: ContentType | null) => void;
}

const filterOptions: { type: ContentType | null; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { type: null, label: 'All', icon: () => null },
  { type: 'shout', label: 'Shouts', icon: Type },
  { type: 'image', label: 'Images', icon: Image },
  { type: 'video', label: 'Videos', icon: Video },
  { type: 'audio', label: 'Audio', icon: Music },
  { type: 'panorama360', label: '360°', icon: Globe },
];

export function ContentTypeFilter({ selected, onChange }: ContentTypeFilterProps) {
  return (
    <div className="overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
      <div className="flex gap-2 w-max mx-auto">
        {filterOptions.map(({ type, label, icon: Icon }) => (
          <button
            key={type ?? 'all'}
            onClick={() => onChange(type)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition',
              selected === type
                ? 'bg-white text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
          >
            {Icon && <Icon size={16} />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
