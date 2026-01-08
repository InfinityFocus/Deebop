import type {
  Event,
  EventRsvp,
  EventInvite,
  EventInviteLink,
  User,
  Album,
  EventStatus,
  RsvpStatus,
  LocationMode,
  UploadWindow,
  Visibility,
} from '@prisma/client';

// Re-export Prisma enums for frontend use
export type { EventStatus, RsvpStatus, LocationMode, UploadWindow };

// ============================================
// Event Types
// ============================================

/** Basic event info for cards/lists */
export interface EventCard {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  startAt: Date;
  endAt: Date;
  locationName: string | null;
  locationMode: LocationMode;
  status: EventStatus;
  attendingCount: number;
  maybeCount: number;
  host: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

/** Full event details for detail page */
export interface EventDetail extends EventCard {
  visibility: Visibility;
  rsvpDeadlineAt: Date | null;
  rsvpLocked: boolean;
  showAttendeeList: boolean;
  allowMaybeUploads: boolean;
  uploadWindow: UploadWindow;
  invitedCount: number;
  albumId: string | null;
  createdAt: Date;
  updatedAt: Date;
  // User-specific context
  myRsvpStatus: RsvpStatus | null;
  isHost: boolean;
  isInvited: boolean;
  canRsvp: boolean;
  canUpload: boolean;
  canManage: boolean;
}

/** Event with host user attached */
export interface EventWithHost extends Event {
  host: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
}

/** Event with album attached */
export interface EventWithAlbum extends Event {
  album: Album | null;
}

// ============================================
// RSVP Types
// ============================================

/** RSVP with user info */
export interface EventRsvpWithUser extends EventRsvp {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
}

/** Grouped attendee lists */
export interface EventAttendees {
  attending: EventRsvpWithUser[];
  maybe: EventRsvpWithUser[];
  cantMakeIt: EventRsvpWithUser[];
  total: number;
}

// ============================================
// Invite Types
// ============================================

/** Invite with user details */
export interface EventInviteWithUsers extends EventInvite {
  inviter: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  invitee: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'> | null;
  claimedBy?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'> | null;
}

/** Email-only invite (for non-registered users) */
export interface EmailInvite {
  id: string;
  eventId: string;
  inviteeEmail: string;
  message: string | null;
  createdAt: Date;
  claimedAt: Date | null;
  claimedBy: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'> | null;
  inviter: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
}

/** Invite link with usage info */
export interface EventInviteLinkDetail extends EventInviteLink {
  createdBy: Pick<User, 'id' | 'username' | 'displayName'>;
  remainingUses: number;
  isExpired: boolean;
  isUsable: boolean;
  isRestricted: boolean;
}

// ============================================
// API Payload Types
// ============================================

/** Create event request payload */
export interface CreateEventPayload {
  title: string;
  description?: string;
  coverImageUrl?: string;
  startAt: string; // ISO date string
  endAt: string; // ISO date string
  rsvpDeadlineAt?: string | null;
  locationName?: string;
  locationMode?: LocationMode;
  visibility?: Visibility;
  showAttendeeList?: boolean;
  allowMaybeUploads?: boolean;
  uploadWindow?: UploadWindow;
}

/** Update event request payload */
export interface UpdateEventPayload {
  title?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  startAt?: string;
  endAt?: string;
  rsvpDeadlineAt?: string | null;
  locationName?: string | null;
  locationMode?: LocationMode;
  visibility?: Visibility;
  rsvpLocked?: boolean;
  showAttendeeList?: boolean;
  allowMaybeUploads?: boolean;
  uploadWindow?: UploadWindow;
}

/** RSVP request payload */
export interface RsvpPayload {
  status: 'attending' | 'maybe' | 'cant_make_it';
}

/** Send invites request payload */
export interface SendInvitesPayload {
  userIds?: string[];
  emails?: string[];
  message?: string;
}

/** Create invite link request payload */
export interface CreateInviteLinkPayload {
  maxUses?: number;
  expiresAt?: string | null;
  isRestricted?: boolean;
}

// ============================================
// Filter/Query Types
// ============================================

/** Event list filter options */
export type EventListType =
  | 'hosted' // Events I'm hosting
  | 'invited' // Events I'm invited to
  | 'attending' // Events I'm attending
  | 'upcoming' // All my upcoming events
  | 'past'; // Past events

/** Event list query params */
export interface EventListParams {
  type?: EventListType;
  status?: EventStatus;
  limit?: number;
  cursor?: string;
}

// ============================================
// Response Types
// ============================================

/** Paginated event list response */
export interface EventListResponse {
  events: EventCard[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Create event response */
export interface CreateEventResponse {
  event: EventDetail;
  album: Album;
  inviteLink: EventInviteLinkDetail;
}

/** Redeem invite link response */
export interface RedeemInviteLinkResponse {
  success: boolean;
  event: EventCard;
  rsvpStatus: RsvpStatus;
}

/** Invite link info response (GET /api/events/join/[token]) */
export interface InviteLinkInfoResponse {
  event: EventCard;
  isRestricted: boolean;
  /** null if not logged in, true/false if logged in */
  userIsInvited: boolean | null;
  /** If restricted and user not invited, shows error */
  error?: 'restricted_not_invited' | 'link_expired' | 'link_revoked' | 'link_full';
}
