import { EventStatus, RsvpStatus, Visibility, UploadWindow } from '@prisma/client';

export type EventPermission =
  | 'view'
  | 'rsvp'
  | 'upload'
  | 'view_gallery'
  | 'view_attendees'
  | 'invite'
  | 'manage';

interface EventContext {
  // Event properties
  eventStatus: EventStatus;
  visibility: Visibility;
  hostId: string;
  rsvpLocked: boolean;
  rsvpDeadlineAt: Date | null;
  startAt: Date;
  endAt: Date;
  showAttendeeList: boolean;
  allowMaybeUploads: boolean;
  uploadWindow: UploadWindow;
  // User context
  userId: string | null;
  isHost: boolean;
  isInvited: boolean; // Has direct invite or redeemed invite link
  isFollower: boolean;
  rsvpStatus: RsvpStatus | null;
}

/**
 * Check if a user can view the event details
 * - Public: all users
 * - Host: always
 * - Invited: always (via direct invite or link redemption)
 * - Followers: if visibility=followers
 * - Unlisted/Private: only if invited or host
 */
export function canViewEvent(ctx: EventContext): boolean {
  // Host always has access
  if (ctx.isHost) return true;

  // Cancelled events only visible to host
  if (ctx.eventStatus === 'cancelled') return false;

  // Invited users always have access
  if (ctx.isInvited) return true;

  // Public events visible to everyone
  if (ctx.visibility === 'public') return !!ctx.userId;

  // Followers-only events
  if (ctx.visibility === 'followers') return ctx.isFollower;

  // Private and unlisted: only invited users (already checked above)
  return false;
}

/**
 * Check if a user can RSVP to the event
 * - Not host
 * - Event not cancelled
 * - RSVPs not locked
 * - Before deadline (if set)
 * - Can view the event
 */
export function canRsvp(ctx: EventContext): boolean {
  // Host cannot RSVP to their own event
  if (ctx.isHost) return false;

  // Must be logged in
  if (!ctx.userId) return false;

  // Event must be scheduled
  if (ctx.eventStatus !== 'scheduled') return false;

  // RSVPs must not be locked
  if (ctx.rsvpLocked) return false;

  // Check deadline
  if (ctx.rsvpDeadlineAt && new Date() > ctx.rsvpDeadlineAt) return false;

  // Must be able to view the event (invited or appropriate visibility)
  return canViewEvent(ctx);
}

/**
 * Check if a user can upload to the event gallery
 * - Host: always
 * - Attending: yes
 * - Maybe: only if allowMaybeUploads=true
 * - Check uploadWindow (during_and_after or after_only)
 */
export function canUploadToGallery(ctx: EventContext): boolean {
  // Must be logged in
  if (!ctx.userId) return false;

  // Event must not be cancelled
  if (ctx.eventStatus === 'cancelled') return false;

  // Host can always upload
  if (ctx.isHost) return true;

  // Must have an RSVP
  if (!ctx.rsvpStatus) return false;

  // Check RSVP status
  if (ctx.rsvpStatus === 'attending') {
    // Attending users can upload
  } else if (ctx.rsvpStatus === 'maybe') {
    // Maybe users can only upload if host allows
    if (!ctx.allowMaybeUploads) return false;
  } else {
    // cant_make_it or no_response cannot upload
    return false;
  }

  // Check upload window
  const now = new Date();
  if (ctx.uploadWindow === 'after_only') {
    // Can only upload after event ends
    return now >= ctx.endAt;
  }

  // during_and_after: can upload during or after
  return now >= ctx.startAt;
}

/**
 * Check if a user can view the event gallery
 * - Post-event (completed): all invited users (regardless of RSVP status)
 * - During event: same as canViewEvent
 */
export function canViewGallery(ctx: EventContext): boolean {
  // Host always has access
  if (ctx.isHost) return true;

  // Cancelled events: no gallery access
  if (ctx.eventStatus === 'cancelled') return false;

  // Completed events: all invited users have access
  if (ctx.eventStatus === 'completed') {
    return ctx.isInvited || ctx.isHost;
  }

  // Scheduled (ongoing/upcoming): same as viewing event
  return canViewEvent(ctx);
}

/**
 * Check if a user can view the attendee list
 * - Host: always
 * - showAttendeeList must be true
 * - Must be able to view the event
 */
export function canViewAttendees(ctx: EventContext): boolean {
  // Host always sees attendees
  if (ctx.isHost) return true;

  // Check if attendee list is enabled
  if (!ctx.showAttendeeList) return false;

  // Must be able to view the event
  return canViewEvent(ctx);
}

/**
 * Check if a user can send invites to the event
 * - Only host can invite
 */
export function canInvite(ctx: EventContext): boolean {
  return ctx.isHost && ctx.eventStatus === 'scheduled';
}

/**
 * Check if a user can manage the event (edit, cancel, manage settings)
 * - Only host
 */
export function canManageEvent(ctx: EventContext): boolean {
  return ctx.isHost;
}

/**
 * Get all permissions for a user in an event context
 */
export function getEventPermissions(ctx: EventContext): EventPermission[] {
  const permissions: EventPermission[] = [];

  if (canViewEvent(ctx)) permissions.push('view');
  if (canRsvp(ctx)) permissions.push('rsvp');
  if (canUploadToGallery(ctx)) permissions.push('upload');
  if (canViewGallery(ctx)) permissions.push('view_gallery');
  if (canViewAttendees(ctx)) permissions.push('view_attendees');
  if (canInvite(ctx)) permissions.push('invite');
  if (canManageEvent(ctx)) permissions.push('manage');

  return permissions;
}

/**
 * Check if a user has a specific permission
 */
export function hasEventPermission(ctx: EventContext, permission: EventPermission): boolean {
  const permissions = getEventPermissions(ctx);
  return permissions.includes(permission);
}

/**
 * Helper to build an EventContext from database data
 */
export function buildEventContext(params: {
  event: {
    status: EventStatus;
    visibility: Visibility;
    hostId: string;
    rsvpLocked: boolean;
    rsvpDeadlineAt: Date | null;
    startAt: Date;
    endAt: Date;
    showAttendeeList: boolean;
    allowMaybeUploads: boolean;
    uploadWindow: UploadWindow;
  };
  userId: string | null;
  rsvpStatus?: RsvpStatus | null;
  isInvited?: boolean;
  isFollower?: boolean;
}): EventContext {
  const { event, userId, rsvpStatus, isInvited, isFollower } = params;

  return {
    eventStatus: event.status,
    visibility: event.visibility,
    hostId: event.hostId,
    rsvpLocked: event.rsvpLocked,
    rsvpDeadlineAt: event.rsvpDeadlineAt,
    startAt: event.startAt,
    endAt: event.endAt,
    showAttendeeList: event.showAttendeeList,
    allowMaybeUploads: event.allowMaybeUploads,
    uploadWindow: event.uploadWindow,
    userId,
    isHost: userId === event.hostId,
    isInvited: isInvited ?? false,
    isFollower: isFollower ?? false,
    rsvpStatus: rsvpStatus ?? null,
  };
}
