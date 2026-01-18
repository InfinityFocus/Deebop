'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, User, PawPrint } from 'lucide-react';
import { AVATARS, DEFAULT_AVATAR_ID, getAvatarsByCategory, type AvatarCategory, type PresenceStatus } from '@/types';
import { PresenceIndicator } from './PresenceIndicator';

const AVATARS_PER_PAGE = 12;

const CATEGORY_CONFIG: { id: AvatarCategory; label: string; icon: typeof User }[] = [
  { id: 'children', label: 'People', icon: User },
  { id: 'animals', label: 'Animals', icon: PawPrint },
];

interface Props {
  selected: string;
  onSelect: (avatarId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarSelector({ selected, onSelect, size = 'md' }: Props) {
  const [category, setCategory] = useState<AvatarCategory>('children');
  const [page, setPage] = useState(0);

  const categoryAvatars = getAvatarsByCategory(category);
  const totalPages = Math.ceil(categoryAvatars.length / AVATARS_PER_PAGE);
  const startIndex = page * AVATARS_PER_PAGE;
  const visibleAvatars = categoryAvatars.slice(startIndex, startIndex + AVATARS_PER_PAGE);

  // When selected avatar changes, switch to its category and page
  useEffect(() => {
    const selectedAvatar = AVATARS.find((a) => a.id === selected);
    if (selectedAvatar && selectedAvatar.category !== category) {
      setCategory(selectedAvatar.category);
    }
  }, [selected]);

  // When category changes, find if selected avatar is in this category
  useEffect(() => {
    const avatarsInCategory = getAvatarsByCategory(category);
    const selectedIndex = avatarsInCategory.findIndex((a) => a.id === selected);
    if (selectedIndex !== -1) {
      const selectedPage = Math.floor(selectedIndex / AVATARS_PER_PAGE);
      setPage(selectedPage);
    } else {
      setPage(0);
    }
  }, [category, selected]);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const goToPrev = () => setPage((p) => Math.max(0, p - 1));
  const goToNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex gap-2">
        {CATEGORY_CONFIG.map((cat) => {
          const Icon = cat.icon;
          const isActive = category === cat.id;
          const count = getAvatarsByCategory(cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategory(cat.id);
                setPage(0);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isActive
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {cat.label}
              <span className={`text-xs ${isActive ? 'text-primary-400/70' : 'text-gray-500'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
        {visibleAvatars.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelect(avatar.id)}
            className={`${sizeClasses[size]} rounded-xl overflow-hidden transition-all ${
              selected === avatar.id
                ? 'ring-2 ring-primary-500 scale-105'
                : 'hover:scale-105 opacity-80 hover:opacity-100'
            }`}
            title={avatar.name}
          >
            <Image
              src={avatar.image}
              alt={avatar.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={goToPrev}
            disabled={page === 0}
            className="p-2 rounded-lg bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === page ? 'bg-primary-500' : 'bg-dark-600 hover:bg-dark-500'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goToNext}
            disabled={page === totalPages - 1}
            className="p-2 rounded-lg bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export function Avatar({
  avatarId,
  size = 'md',
  className = '',
  status,
}: {
  avatarId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: PresenceStatus;
}) {
  const avatar = AVATARS.find((a) => a.id === avatarId) || AVATARS.find((a) => a.id === DEFAULT_AVATAR_ID) || AVATARS[0];

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const imageSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  // Presence indicator size based on avatar size
  const indicatorSize: Record<string, 'sm' | 'md' | 'lg'> = {
    xs: 'sm',
    sm: 'sm',
    md: 'sm',
    lg: 'md',
    xl: 'lg',
  };

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}
        title={avatar.name}
      >
        <Image
          src={avatar.image}
          alt={avatar.name}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="w-full h-full object-cover"
        />
      </div>
      {status && (
        <PresenceIndicator
          status={status}
          size={indicatorSize[size]}
          className="absolute -bottom-0.5 -right-0.5"
        />
      )}
    </div>
  );
}
