'use client';

import Image from 'next/image';
import { AVATARS, DEFAULT_AVATAR_ID } from '@/types';

interface Props {
  selected: string;
  onSelect: (avatarId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarSelector({ selected, onSelect, size = 'md' }: Props) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          onClick={() => onSelect(avatar.id)}
          className={`${sizeClasses[size]} rounded-xl overflow-hidden transition-all ${
            selected === avatar.id
              ? 'ring-3 ring-primary-500 scale-110'
              : 'hover:scale-105 opacity-80 hover:opacity-100'
          }`}
          title={avatar.name}
        >
          <Image
            src={avatar.image}
            alt={avatar.name}
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        </button>
      ))}
    </div>
  );
}

export function Avatar({
  avatarId,
  size = 'md',
  className = '',
}: {
  avatarId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
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

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}
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
  );
}
