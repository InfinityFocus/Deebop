'use client';

import { AVATARS } from '@/types';

interface Props {
  selected: string;
  onSelect: (avatarId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarSelector({ selected, onSelect, size = 'md' }: Props) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl',
  };

  return (
    <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
      {AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          onClick={() => onSelect(avatar.id)}
          className={`${sizeClasses[size]} rounded-xl flex items-center justify-center transition-all ${
            selected === avatar.id
              ? 'bg-primary-500/20 ring-2 ring-primary-500 scale-110'
              : 'bg-dark-700 hover:bg-dark-600 hover:scale-105'
          }`}
          title={avatar.label}
        >
          <span role="img" aria-label={avatar.label}>
            {avatar.emoji}
          </span>
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
  const avatar = AVATARS.find((a) => a.id === avatarId) || AVATARS[0];

  const sizeClasses = {
    xs: 'w-6 h-6 text-sm',
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-xl',
    lg: 'w-14 h-14 text-2xl',
    xl: 'w-20 h-20 text-4xl',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center ${className}`}
      title={avatar.label}
    >
      <span role="img" aria-label={avatar.label}>
        {avatar.emoji}
      </span>
    </div>
  );
}
