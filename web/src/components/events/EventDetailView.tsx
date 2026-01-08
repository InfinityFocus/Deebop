'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Calendar, MapPin, Clock, Users, Settings, Share2, Image as ImageIcon, X } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useEvent, useCancelEvent } from '@/hooks/useEvent';
import { EventRsvpButtons } from './EventRsvpButtons';
import { EventAttendeeList } from './EventAttendeeList';
import type { EventDetail } from '@/types/event';

interface EventDetailViewProps {
  eventId: string;
}

export function EventDetailView({ eventId }: EventDetailViewProps) {
  const { data, isLoading, error } = useEvent(eventId);
  const { mutate: cancelEvent, isPending: isCancelling } = useCancelEvent(eventId);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'attendees' | 'gallery'>('about');

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="aspect-[16/9] bg-gray-800 rounded-xl mb-6" />
        <div className="h-8 bg-gray-800 rounded w-2/3 mb-4" />
        <div className="h-4 bg-gray-800 rounded w-1/3" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error?.message || 'Event not found'}</p>
      </div>
    );
  }

  const event: EventDetail = data.event;
  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const isPastEvent = isPast(endDate);

  const handleCancel = () => {
    cancelEvent(undefined, {
      onSuccess: () => setShowCancelConfirm(false),
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover Image */}
      <div className="relative aspect-[16/9] bg-gray-800 rounded-xl overflow-hidden mb-6">
        {event.coverImageUrl ? (
          <Image
            src={event.coverImageUrl}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-gray-600" />
          </div>
        )}

        {/* Status Badge */}
        {event.status === 'cancelled' && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 bg-red-500 text-white font-medium rounded-lg">
              Cancelled
            </span>
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Title and Host */}
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-4">{event.title}</h1>

          <Link
            href={`/u/${event.host.username}`}
            className="flex items-center gap-3 mb-6"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-700">
              {event.host.avatarUrl ? (
                <Image
                  src={event.host.avatarUrl}
                  alt={event.host.displayName || event.host.username}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  {(event.host.displayName || event.host.username).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-white font-medium">
                {event.host.displayName || event.host.username}
              </p>
              <p className="text-sm text-gray-400">Host</p>
            </div>
          </Link>

          {/* RSVP Buttons */}
          {event.status === 'scheduled' && (
            <div className="mb-6">
              <EventRsvpButtons
                eventId={eventId}
                currentStatus={event.myRsvpStatus}
                canRsvp={event.canRsvp}
                isHost={event.isHost}
              />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-700 mb-6">
            {['about', 'attendees', 'gallery'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* Description */}
              {event.description && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">About</h2>
                  <p className="text-gray-300 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {/* Date & Time */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Date and Time</h2>
                <div className="flex items-start gap-3 text-gray-300">
                  <Calendar className="w-5 h-5 mt-0.5 text-gray-500" />
                  <div>
                    <p>{format(startDate, 'EEEE, MMMM d, yyyy')}</p>
                    <p className="text-sm text-gray-400">
                      {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              {event.locationName && event.locationMode !== 'hidden' && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">Location</h2>
                  <div className="flex items-start gap-3 text-gray-300">
                    <MapPin className="w-5 h-5 mt-0.5 text-gray-500" />
                    <p>{event.locationName}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendees' && (
            <EventAttendeeList eventId={eventId} />
          )}

          {activeTab === 'gallery' && event.albumId && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Event Gallery</h2>
                {event.canUpload && (
                  <Link
                    href={`/albums/${event.albumId}`}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Add Photos
                  </Link>
                )}
              </div>
              <Link
                href={`/albums/${event.albumId}`}
                className="block p-8 bg-gray-800 rounded-lg text-center hover:bg-gray-750 transition-colors"
              >
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-300">View Event Gallery</p>
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-80">
          <div className="sticky top-4 space-y-4">
            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3 text-gray-300">
                <Users className="w-5 h-5 text-gray-500" />
                <span>{event.attendingCount} going</span>
              </div>
              {event.maybeCount > 0 && (
                <div className="flex items-center gap-3 text-gray-300">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span>{event.maybeCount} maybe</span>
                </div>
              )}
            </div>

            {/* Host Actions */}
            {event.isHost && event.status === 'scheduled' && (
              <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-white mb-2">Manage Event</h3>
                <Link
                  href={`/events/${eventId}/edit`}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  Edit Event
                </Link>
                <Link
                  href={`/events/${eventId}/manage`}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Manage Invites
                </Link>
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                  Cancel Event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Cancel Event?</h3>
            <p className="text-gray-300 mb-6">
              This will cancel the event and notify all attendees. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Keep Event
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
