'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Crown, Shield, User, MoreVertical, UserMinus, ChevronDown, ChevronUp, Loader2, Users, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { useUpdateAlbumMember, useRemoveAlbumMember } from '@/hooks/useAlbum';
import type { AlbumMember, AlbumRole, AlbumUser, EventAttendees } from '@/types/album';

interface AlbumMemberListProps {
  albumId: string;
  members: AlbumMember[];
  currentUserRole: AlbumRole | null;
  currentUserId: string | null;
  // Event album props
  linkedEventId?: string | null;
  eventHost?: AlbumUser | null;
  eventAttendees?: EventAttendees | null;
  canViewAttendeeList?: boolean;
}

const roleLabels: Record<AlbumRole, string> = {
  owner: 'Owner',
  co_owner: 'Co-owner',
  contributor: 'Contributor',
};

const roleIcons: Record<AlbumRole, typeof Crown> = {
  owner: Crown,
  co_owner: Shield,
  contributor: User,
};

const roleColors: Record<AlbumRole, string> = {
  owner: 'text-yellow-400',
  co_owner: 'text-cyan-400',
  contributor: 'text-gray-400',
};

// User card component for consistent rendering
function UserCard({
  user,
  badge,
  badgeColor = 'text-gray-400',
  isCurrentUser = false,
  rightContent,
}: {
  user: AlbumUser;
  badge?: string;
  badgeColor?: string;
  isCurrentUser?: boolean;
  rightContent?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
      <Link
        href={`/u/${user.username}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            (user.display_name || user.username)[0].toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">
              {user.display_name || user.username}
            </span>
            {isCurrentUser && (
              <span className="text-xs text-gray-500">(you)</span>
            )}
          </div>
          {badge && (
            <div className="flex items-center gap-1 text-sm">
              <span className={badgeColor}>{badge}</span>
            </div>
          )}
        </div>
      </Link>
      {rightContent}
    </div>
  );
}

// Section header component
function SectionHeader({
  title,
  count,
  collapsed,
  onToggle,
  icon: Icon,
}: {
  title: string;
  count: number;
  collapsed?: boolean;
  onToggle?: () => void;
  icon: typeof Users;
}) {
  if (onToggle !== undefined) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-2 w-full"
      >
        <Icon size={16} />
        <span className="font-medium">{title}</span>
        <span className="text-sm text-gray-500">({count})</span>
        <span className="ml-auto">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-gray-400 mb-2">
      <Icon size={16} />
      <span className="font-medium">{title}</span>
      <span className="text-sm text-gray-500">({count})</span>
    </div>
  );
}

export function AlbumMemberList({
  albumId,
  members,
  currentUserRole,
  currentUserId,
  linkedEventId,
  eventHost,
  eventAttendees,
  canViewAttendeeList,
}: AlbumMemberListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [maybeCollapsed, setMaybeCollapsed] = useState(true);
  const updateMember = useUpdateAlbumMember(albumId);
  const removeMember = useRemoveAlbumMember(albumId);

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'co_owner';
  const isEventAlbum = !!linkedEventId;

  const handleRoleChange = async (memberId: string, newRole: AlbumRole) => {
    setProcessingId(memberId);
    setOpenMenuId(null);
    try {
      await updateMember.mutateAsync({ memberId, role: newRole });
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    setProcessingId(memberId);
    setOpenMenuId(null);
    try {
      await removeMember.mutateAsync(memberId);
    } catch (err) {
      console.error('Failed to remove member:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Event album view
  if (isEventAlbum) {
    const attending = eventAttendees?.attending || [];
    const maybe = eventAttendees?.maybe || [];
    const totalAttendees = attending.length + maybe.length + (eventHost ? 1 : 0);

    return (
      <div className="space-y-6">
        {/* Host Section */}
        {eventHost && (
          <div>
            <SectionHeader title="Host" count={1} icon={Crown} />
            <UserCard
              user={eventHost}
              badge="Event Host"
              badgeColor="text-yellow-400"
              isCurrentUser={eventHost.id === currentUserId}
            />
          </div>
        )}

        {/* Attendee List Privacy Notice */}
        {!canViewAttendeeList && (
          <div className="text-center py-8 px-4 bg-gray-800/30 rounded-lg">
            <Users className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">Attendee list is private</p>
            <p className="text-sm text-gray-500 mt-1">
              Only invited guests can see who&apos;s attending
            </p>
          </div>
        )}

        {/* Attending Section */}
        {canViewAttendeeList && (
          <>
            <div>
              <SectionHeader title="Attending" count={attending.length} icon={Calendar} />
              {attending.length === 0 ? (
                <p className="text-gray-500 text-sm py-2">No one has confirmed yet</p>
              ) : (
                <div className="space-y-2">
                  {attending.map((attendee) => (
                    <UserCard
                      key={attendee.id}
                      user={attendee}
                      badge="Going"
                      badgeColor="text-emerald-400"
                      isCurrentUser={attendee.id === currentUserId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Maybe Section (collapsed by default) */}
            {maybe.length > 0 && (
              <div>
                <SectionHeader
                  title="Maybe"
                  count={maybe.length}
                  icon={Users}
                  collapsed={maybeCollapsed}
                  onToggle={() => setMaybeCollapsed(!maybeCollapsed)}
                />
                {!maybeCollapsed && (
                  <div className="space-y-2">
                    {maybe.map((attendee) => (
                      <UserCard
                        key={attendee.id}
                        user={attendee}
                        badge="Maybe"
                        badgeColor="text-amber-400"
                        isCurrentUser={attendee.id === currentUserId}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Regular album view (existing behavior)
  // Sort: owner first, then co-owners, then contributors
  const sortedMembers = [...members].sort((a, b) => {
    const order: Record<AlbumRole, number> = { owner: 0, co_owner: 1, contributor: 2 };
    return order[a.role] - order[b.role];
  });

  return (
    <div className="space-y-2">
      {sortedMembers.map((member) => {
        const RoleIcon = roleIcons[member.role];
        const isCurrentUser = member.user.id === currentUserId;
        const canManageThisMember =
          canManageMembers &&
          !isCurrentUser &&
          member.role !== 'owner' &&
          (currentUserRole === 'owner' || member.role === 'contributor');

        return (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
          >
            <Link
              href={`/u/${member.user.username}`}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {member.user.avatar_url ? (
                  <img
                    src={member.user.avatar_url}
                    alt={member.user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  member.user.display_name?.[0]?.toUpperCase() ||
                  member.user.username[0].toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">
                    {member.user.display_name || member.user.username}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs text-gray-500">(you)</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <RoleIcon size={12} className={roleColors[member.role]} />
                  <span className={roleColors[member.role]}>{roleLabels[member.role]}</span>
                </div>
              </div>
            </Link>

            {/* Actions */}
            {canManageThisMember && (
              <div className="relative">
                {processingId === member.id ? (
                  <Loader2 size={18} className="animate-spin text-gray-500" />
                ) : (
                  <button
                    onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                    className="p-2 rounded-lg hover:bg-gray-700 transition"
                  >
                    <MoreVertical size={18} className="text-gray-400" />
                  </button>
                )}

                {/* Dropdown Menu */}
                {openMenuId === member.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpenMenuId(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                      {/* Role change options */}
                      {currentUserRole === 'owner' && member.role !== 'co_owner' && (
                        <button
                          onClick={() => handleRoleChange(member.id, 'co_owner')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Shield size={14} className="text-cyan-400" />
                          Make Co-owner
                        </button>
                      )}
                      {currentUserRole === 'owner' && member.role === 'co_owner' && (
                        <button
                          onClick={() => handleRoleChange(member.id, 'contributor')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                        >
                          <User size={14} className="text-gray-400" />
                          Make Contributor
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                      >
                        <UserMinus size={14} />
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
