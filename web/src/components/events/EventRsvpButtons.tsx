'use client';

import { Check, HelpCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useRsvp } from '@/hooks/useEvent';
import type { RsvpStatus } from '@/types/event';

interface EventRsvpButtonsProps {
  eventId: string;
  currentStatus: RsvpStatus | null;
  canRsvp: boolean;
  isHost: boolean;
}

export function EventRsvpButtons({ eventId, currentStatus, canRsvp, isHost }: EventRsvpButtonsProps) {
  const { submit, remove, isSubmitting, isRemoving } = useRsvp(eventId);
  const isLoading = isSubmitting || isRemoving;

  if (isHost) {
    return (
      <div className="text-sm text-gray-400 py-2">
        You are hosting this event
      </div>
    );
  }

  if (!canRsvp && !currentStatus) {
    return (
      <div className="text-sm text-gray-400 py-2">
        RSVPs are closed for this event
      </div>
    );
  }

  const handleRsvp = (status: 'attending' | 'maybe' | 'cant_make_it') => {
    if (isLoading) return;

    if (currentStatus === status) {
      // Toggle off - remove RSVP
      remove();
    } else {
      submit({ status });
    }
  };

  const buttons = [
    {
      status: 'attending' as const,
      label: 'Going',
      icon: Check,
      activeClass: 'bg-emerald-500 text-white border-emerald-500',
      hoverClass: 'hover:bg-emerald-500/20 hover:border-emerald-500',
    },
    {
      status: 'maybe' as const,
      label: 'Maybe',
      icon: HelpCircle,
      activeClass: 'bg-yellow-500 text-white border-yellow-500',
      hoverClass: 'hover:bg-yellow-500/20 hover:border-yellow-500',
    },
    {
      status: 'cant_make_it' as const,
      label: "Can't Go",
      icon: X,
      activeClass: 'bg-gray-600 text-white border-gray-600',
      hoverClass: 'hover:bg-gray-600/20 hover:border-gray-600',
    },
  ];

  return (
    <div className="flex gap-2">
      {buttons.map(({ status, label, icon: Icon, activeClass, hoverClass }) => {
        const isActive = currentStatus === status;
        return (
          <button
            key={status}
            onClick={() => handleRsvp(status)}
            disabled={isLoading || (!canRsvp && !isActive)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed',
              isActive ? activeClass : `bg-transparent border-gray-600 text-gray-300 ${hoverClass}`
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
