'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Users, Globe } from 'lucide-react';
import type { EventResult } from '@/types/explore';

interface TrendingEventCardProps {
  event: EventResult;
}

export default function TrendingEventCard({ event }: TrendingEventCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getUrgencyColor = (daysUntil?: number) => {
    if (!daysUntil) return 'bg-zinc-700';
    if (daysUntil <= 1) return 'bg-red-500';
    if (daysUntil <= 3) return 'bg-orange-500';
    if (daysUntil <= 7) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <Link
      href={`/events/${event.id}`}
      className="flex-shrink-0 w-64 bg-zinc-800/50 rounded-xl overflow-hidden hover:bg-zinc-800 transition-colors group"
    >
      {/* Cover image */}
      <div className="relative h-32 bg-zinc-700">
        {event.coverUrl ? (
          <Image
            src={event.coverUrl}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-900/50 to-cyan-900/50">
            <Calendar className="w-12 h-12 text-zinc-500" />
          </div>
        )}

        {/* Days until badge */}
        {event.daysUntil !== undefined && (
          <div
            className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium text-white ${getUrgencyColor(
              event.daysUntil
            )}`}
          >
            {event.daysUntil === 0
              ? 'Today!'
              : event.daysUntil === 1
              ? 'Tomorrow'
              : `In ${event.daysUntil} days`}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="font-semibold truncate group-hover:text-emerald-400 transition-colors">
          {event.title}
        </h4>

        {/* Date */}
        <div className="flex items-center gap-1.5 mt-2 text-sm text-zinc-400">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{formatDate(event.startDate)}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mt-1 text-sm text-zinc-400">
          {event.isOnline ? (
            <>
              <Globe className="w-4 h-4 flex-shrink-0" />
              <span>Online Event</span>
            </>
          ) : event.location ? (
            <>
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </>
          ) : null}
        </div>

        {/* Attending count */}
        <div className="flex items-center gap-1.5 mt-2 text-sm">
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-medium">
            {event.attendingCount} attending
          </span>
          {event.maybeCount !== undefined && event.maybeCount > 0 && (
            <span className="text-zinc-500">· {event.maybeCount} maybe</span>
          )}
        </div>
      </div>
    </Link>
  );
}
