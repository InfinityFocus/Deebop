'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Link as LinkIcon, UserPlus } from 'lucide-react';
import { useEvent } from '@/hooks/useEvent';
import { useEventInvites } from '@/hooks/useEventInvites';
import { InviteLinkManager, EventInviteModal } from '@/components/events';

interface ManageEventPageProps {
  params: Promise<{ id: string }>;
}

export default function ManageEventPage({ params }: ManageEventPageProps) {
  const { id } = use(params);
  const { data: eventData, isLoading: isLoadingEvent } = useEvent(id);
  const { data: invitesData, isLoading: isLoadingInvites } = useEventInvites(id);
  const [showInviteModal, setShowInviteModal] = useState(false);

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!eventData?.event.isHost) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">You don&apos;t have permission to manage this event</p>
          <Link href={`/events/${id}`} className="text-emerald-400 hover:underline">
            Go back to event
          </Link>
        </div>
      </div>
    );
  }

  const event = eventData.event;
  const invites = invitesData?.invites ?? [];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/events/${id}`}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Manage Invites</h1>
            <p className="text-sm text-gray-400">{event.title}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{event.invitedCount}</p>
            <p className="text-sm text-gray-400">Invited</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{event.attendingCount}</p>
            <p className="text-sm text-gray-400">Going</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{event.maybeCount}</p>
            <p className="text-sm text-gray-400">Maybe</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Invite People
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Invite Links */}
          <section className="bg-gray-800 rounded-xl p-6">
            <InviteLinkManager eventId={id} />
          </section>

          {/* Direct Invites */}
          <section className="bg-gray-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              Direct Invites ({invites.length})
            </h3>

            {isLoadingInvites ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700" />
                    <div className="h-4 bg-gray-700 rounded w-24" />
                  </div>
                ))}
              </div>
            ) : invites.length === 0 ? (
              <p className="text-sm text-gray-500">No direct invites sent yet</p>
            ) : (
              <div className="space-y-3">
                {invites.map((invite: any) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-300">
                        {(invite.invitee.displayName || invite.invitee.username)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {invite.invitee.displayName || invite.invitee.username}
                        </p>
                        <p className="text-sm text-gray-400">@{invite.invitee.username}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        invite.rsvpStatus === 'attending'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : invite.rsvpStatus === 'maybe'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : invite.rsvpStatus === 'cant_make_it'
                          ? 'bg-gray-500/20 text-gray-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {invite.rsvpStatus === 'attending'
                        ? 'Going'
                        : invite.rsvpStatus === 'maybe'
                        ? 'Maybe'
                        : invite.rsvpStatus === 'cant_make_it'
                        ? "Can't Go"
                        : 'No Response'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Invite Modal */}
      <EventInviteModal
        eventId={id}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}
