'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Users, Loader2, AlertCircle, Lock, LogIn, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useInviteLinkInfo, useRedeemInviteLink } from '@/hooks/useEventInvites';
import { useAuth } from '@/hooks/useAuth';

interface JoinEventViewProps {
  token: string;
}

export function JoinEventView({ token }: JoinEventViewProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading, error } = useInviteLinkInfo(token);
  const { mutate: redeemLink, isPending: isRedeeming, error: redeemError } = useRedeemInviteLink();

  // Build redirect URL for login/register
  const redirectPath = `/events/join/${token}`;

  const handleJoin = () => {
    redeemLink(token, {
      onSuccess: (data) => {
        router.push(`/events/${data.event.id}`);
      },
    });
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h1 className="text-xl font-bold text-white mb-2">Invalid Invite Link</h1>
          <p className="text-gray-400">{error?.message || 'This invite link is no longer valid.'}</p>
        </div>
      </div>
    );
  }

  const { event, isRestricted, userIsInvited } = data;
  const startDate = new Date(event.startAt);

  // Determine if user can join
  const isLoggedIn = !!user;
  const canJoin = !isRestricted || userIsInvited === true;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          {/* Cover Image */}
          <div className="relative aspect-[16/9] bg-gray-700">
            {event.coverImageUrl ? (
              <Image
                src={event.coverImageUrl}
                alt={event.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Calendar className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="text-center">
              <p className="text-sm text-emerald-400 mb-2">You&apos;re invited to</p>
              <h1 className="text-2xl font-bold text-white">{event.title}</h1>
            </div>

            {/* Host */}
            <div className="flex items-center justify-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-700">
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
              <p className="text-gray-400">
                Hosted by{' '}
                <span className="text-white">
                  {event.host.displayName || event.host.username}
                </span>
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3 py-4 border-y border-gray-700">
              <div className="flex items-center gap-3 text-gray-300">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span>{format(startDate, 'EEEE, MMMM d · h:mm a')}</span>
              </div>

              {event.locationName && event.locationMode !== 'hidden' && (
                <div className="flex items-center gap-3 text-gray-300">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span>{event.locationName}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-gray-300">
                <Users className="w-5 h-5 text-gray-500" />
                <span>
                  {event.attendingCount} going
                  {event.maybeCount > 0 && ` · ${event.maybeCount} maybe`}
                </span>
              </div>
            </div>

            {/* Restricted Badge */}
            {isRestricted && (
              <div className="flex items-center justify-center gap-2 py-2 px-3 bg-amber-500/20 rounded-lg">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-400">This is a private event</span>
              </div>
            )}

            {/* Error */}
            {redeemError && (
              <p className="text-sm text-red-400 text-center">{redeemError.message}</p>
            )}

            {/* Actions based on state */}
            {!isLoggedIn ? (
              // Not logged in - show login/register buttons
              <div className="space-y-3">
                <p className="text-sm text-gray-400 text-center">
                  {isRestricted
                    ? 'Sign in to verify you\'re on the guest list'
                    : 'Sign in to join this event'}
                </p>
                <div className="flex gap-3">
                  <Link
                    href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
                    className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                  <Link
                    href={`/register?redirect=${encodeURIComponent(redirectPath)}`}
                    className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    Register
                  </Link>
                </div>
              </div>
            ) : isRestricted && !userIsInvited ? (
              // Logged in but not on guest list
              <div className="text-center space-y-3">
                <div className="py-4 px-6 bg-red-500/20 rounded-lg">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                  <p className="text-red-400 font-medium">You&apos;re not on the guest list</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Contact the host to get an invite to this event
                  </p>
                </div>
              </div>
            ) : (
              // Can join - show join button
              <>
                <button
                  onClick={handleJoin}
                  disabled={isRedeeming}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isRedeeming ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Event'
                  )}
                </button>
                {isRestricted && userIsInvited && (
                  <p className="text-xs text-emerald-400 text-center">
                    ✓ You&apos;re on the guest list
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
