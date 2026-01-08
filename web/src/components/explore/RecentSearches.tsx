'use client';

import { Clock, X, Hash, User, Images, Calendar, MessageCircle } from 'lucide-react';
import type { RecentSearch } from '@/types/explore';

interface RecentSearchesProps {
  searches: RecentSearch[];
  onSearchClick: (search: RecentSearch) => void;
  onClearHistory: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  all: <Clock className="w-4 h-4" />,
  hashtag: <Hash className="w-4 h-4" />,
  creator: <User className="w-4 h-4" />,
  album: <Images className="w-4 h-4" />,
  event: <Calendar className="w-4 h-4" />,
  shout: <MessageCircle className="w-4 h-4" />,
};

export default function RecentSearches({
  searches,
  onSearchClick,
  onClearHistory,
}: RecentSearchesProps) {
  if (searches.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-500">No recent searches</p>
        <p className="text-sm text-zinc-600 mt-1">
          Your search history will appear here
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Recent Searches</h3>
        <button
          onClick={onClearHistory}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-1">
        {searches.map((search) => (
          <button
            key={search.id}
            onClick={() => onSearchClick(search)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-700">
              {TYPE_ICONS[search.type] || TYPE_ICONS.all}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate">{search.query}</p>
              <p className="text-xs text-zinc-500 capitalize">{search.type}</p>
            </div>
            <X className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}
