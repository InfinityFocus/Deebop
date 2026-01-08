'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import type { EventCard as EventCardType } from '@/types/event';
import { formatDistanceToNow, format, isToday, isTomorrow, isPast } from 'date-fns';

interface EventCardProps {
  event: EventCardType;
  showHost?: boolean;
}

export function EventCard({ event, showHost = true }: EventCardProps) {
  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const isPastEvent = isPast(endDate);

  const formatEventDate = () => {
    if (isToday(startDate)) {
      return `Today at ${format(startDate, 'h:mm a')}`;
    }
    if (isTomorrow(startDate)) {
      return `Tomorrow at ${format(startDate, 'h:mm a')}`;
    }
    return format(startDate, 'EEE, MMM d · h:mm a');
  };

  const getStatusBadge = () => {
    if (event.status === 'cancelled') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded">
          Cancelled
        </span>
      );
    }
    if (isPastEvent) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded">
          Ended
        </span>
      );
    }
    return null;
  };

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
        {/* Cover Image */}
        <div className="relative aspect-[16/9] bg-gray-700">
          {event.coverImageUrl ? (
            <Image
              src={event.coverImageUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="w-12 h-12 text-gray-500" />
            </div>
          )}
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            {getStatusBadge()}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-emerald-400 mb-2">
            <Clock className="w-4 h-4" />
            <span>{formatEventDate()}</span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
            {event.title}
          </h3>

          {/* Location */}
          {event.locationName && event.locationMode !== 'hidden' && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{event.locationName}</span>
            </div>
          )}

          {/* Attendees Count */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
            <Users className="w-4 h-4" />
            <span>
              {event.attendingCount} attending
              {event.maybeCount > 0 && ` · ${event.maybeCount} maybe`}
            </span>
          </div>

          {/* Host */}
          {showHost && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700">
              <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-600">
                {event.host.avatarUrl ? (
                  <Image
                    src={event.host.avatarUrl}
                    alt={event.host.displayName || event.host.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">
                    {(event.host.displayName || event.host.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-400">
                Hosted by{' '}
                <span className="text-white">
                  {event.host.displayName || event.host.username}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
