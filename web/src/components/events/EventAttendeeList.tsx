'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Check, HelpCircle, X, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { useEventAttendees } from '@/hooks/useEvent';
import type { EventRsvpWithUser } from '@/types/event';

interface EventAttendeeListProps {
  eventId: string;
}

type TabType = 'attending' | 'maybe' | 'cantMakeIt';

export function EventAttendeeList({ eventId }: EventAttendeeListProps) {
  const [activeTab, setActiveTab] = useState<TabType>('attending');
  const { data, isLoading, error } = useEventAttendees(eventId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700" />
            <div className="h-4 bg-gray-700 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-400">
        Failed to load attendees
      </div>
    );
  }

  if (!data) return null;

  const tabs = [
    {
      key: 'attending' as const,
      label: 'Going',
      icon: Check,
      count: data.attending.length,
      color: 'emerald',
    },
    {
      key: 'maybe' as const,
      label: 'Maybe',
      icon: HelpCircle,
      count: data.maybe.length,
      color: 'yellow',
    },
    {
      key: 'cantMakeIt' as const,
      label: "Can't Go",
      icon: X,
      count: data.cantMakeIt.length,
      color: 'gray',
    },
  ];

  const attendees: EventRsvpWithUser[] = data[activeTab];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {tabs.map(({ key, label, icon: Icon, count, color }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === key
                ? `bg-${color}-500/20 text-${color}-400`
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className={clsx(
              'px-1.5 py-0.5 rounded text-xs',
              activeTab === key ? `bg-${color}-500/30` : 'bg-gray-700'
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Attendee List */}
      {attendees.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No one has RSVPed yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attendees.map((rsvp) => (
            <Link
              key={rsvp.id}
              href={`/u/${rsvp.user.username}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                {rsvp.user.avatarUrl ? (
                  <Image
                    src={rsvp.user.avatarUrl}
                    alt={rsvp.user.displayName || rsvp.user.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    {(rsvp.user.displayName || rsvp.user.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-white">
                  {rsvp.user.displayName || rsvp.user.username}
                </p>
                <p className="text-sm text-gray-400">@{rsvp.user.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
