// ==========================================
// Database Types (matching chat.* schema)
// ==========================================

export interface Parent {
  id: string;
  email: string;
  display_name: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

// Database format (snake_case)
export interface ChildDB {
  id: string;
  parent_id: string;
  username: string;
  display_name: string;
  avatar_id: string;
  age_band: AgeBand;
  oversight_mode: OversightMode;
  messaging_paused: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  voice_messaging_enabled: boolean;
  created_at: string;
}

// UI format (camelCase)
export interface Child {
  id: string;
  parentId: string;
  username: string;
  displayName: string;
  avatarId: string;
  ageBand: AgeBand;
  oversightMode: OversightMode;
  messagingPaused: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  voiceMessagingEnabled: boolean;
  createdAt: string;
}

export type AgeBand = '6-8' | '9-10' | '11-12';

export type OversightMode = 'monitor' | 'approve_first' | 'approve_all';

export interface Friendship {
  id: string;
  child_id: string;
  friend_child_id: string;
  status: FriendshipStatus;
  requested_at: string;
  approved_at: string | null;
  approved_by_parent_id: string | null;
  approved_by_recipient_parent_id: string | null;
}

export type FriendshipStatus = 'pending' | 'pending_recipient' | 'approved' | 'blocked';

export interface Conversation {
  id: string;
  child_a_id: string;
  child_b_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_child_id: string;
  type: MessageType;
  content: string | null;
  media_key: string | null;
  media_url: string | null;
  media_duration_seconds: number | null;
  status: MessageStatus;
  created_at: string;
  delivered_at: string | null;
}

export type MessageType = 'text' | 'emoji' | 'voice';

export type MessageStatus = 'pending' | 'pending_recipient' | 'approved' | 'delivered' | 'denied';

export interface Approval {
  id: string;
  message_id: string;
  parent_id: string;
  decision: 'approved' | 'denied';
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  parent_id: string;
  child_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

// ==========================================
// Timeout Types (Wrap-up Timer)
// ==========================================

export type TimeoutStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';
export type TimeoutReason = 'dinner' | 'bedtime' | 'school' | 'break';

// Database format (snake_case)
export interface TimeoutDB {
  id: string;
  parent_id: string;
  child_id: string;
  conversation_id: string | null; // NULL = all chats
  start_at: string;
  end_at: string;
  status: TimeoutStatus;
  reason: TimeoutReason | null;
  created_at: string;
  ended_by: 'parent' | 'system' | null;
}

// UI format (camelCase)
export interface Timeout {
  id: string;
  parentId: string;
  childId: string;
  conversationId: string | null;
  startAt: string;
  endAt: string;
  status: TimeoutStatus;
  reason: TimeoutReason | null;
  createdAt: string;
  endedBy: 'parent' | 'system' | null;
}

export interface CreateTimeoutInput {
  childId: string;
  conversationId?: string;
  startIn: number; // minutes from now (0 = immediately)
  duration: number; // minutes
  reason?: TimeoutReason;
}

export interface TimeoutWithChild extends Timeout {
  child: {
    id: string;
    displayName: string;
    username: string;
    avatarId: string;
  };
}

export const TIMEOUT_REASONS: { value: TimeoutReason; label: string; emoji: string }[] = [
  { value: 'dinner', label: 'Dinner', emoji: '🍽️' },
  { value: 'bedtime', label: 'Bedtime', emoji: '🌙' },
  { value: 'school', label: 'School', emoji: '📚' },
  { value: 'break', label: 'Break', emoji: '☕' },
];

// ==========================================
// Subscription Types
// ==========================================

export type SubscriptionStatus = 'inactive' | 'trial' | 'active' | 'past_due' | 'cancelled' | 'free';
export type SubscriptionPlan = 'monthly' | 'annual';

// Database format (snake_case)
export interface SubscriptionDB {
  id: string;
  parent_id: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan | null;
  amount_pence: number | null;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  cooling_off_eligible: boolean;
  cooling_off_expires_at: string | null;
  is_free_account: boolean;
  free_account_granted_by: string | null;
  free_account_granted_at: string | null;
  free_account_reason: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

// UI format (camelCase)
export interface Subscription {
  id: string;
  parentId: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan | null;
  amountPence: number | null;
  trialStartsAt: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  coolingOffEligible: boolean;
  coolingOffExpiresAt: string | null;
  isFreeAccount: boolean;
  freeAccountGrantedBy: string | null;
  freeAccountGrantedAt: string | null;
  freeAccountReason: string | null;
  createdAt: string;
}

export interface SubscriptionAccess {
  hasAccess: boolean;
  status: SubscriptionStatus;
  isInTrial: boolean;
  daysLeftInTrial: number | null;
  daysUntilRenewal: number | null;
  showTrialEndingWarning: boolean;  // 3 days or less in trial
  showRenewalWarning: boolean;      // 3 days or less until renewal
  showUrgentWarning: boolean;       // 1 day or less
}

export const SUBSCRIPTION_PRICING = {
  monthly: { amountPence: 399, display: '£3.99', period: 'month' },
  annual: { amountPence: 3900, display: '£39', period: 'year', savings: '18%' },
} as const;

// Helper to convert DB format to UI format
export function subscriptionFromDB(db: SubscriptionDB): Subscription {
  return {
    id: db.id,
    parentId: db.parent_id,
    status: db.status,
    plan: db.plan,
    amountPence: db.amount_pence,
    trialStartsAt: db.trial_starts_at,
    trialEndsAt: db.trial_ends_at,
    currentPeriodStart: db.current_period_start,
    currentPeriodEnd: db.current_period_end,
    cancelledAt: db.cancelled_at,
    coolingOffEligible: db.cooling_off_eligible,
    coolingOffExpiresAt: db.cooling_off_expires_at,
    isFreeAccount: db.is_free_account,
    freeAccountGrantedBy: db.free_account_granted_by,
    freeAccountGrantedAt: db.free_account_granted_at,
    freeAccountReason: db.free_account_reason,
    createdAt: db.created_at,
  };
}

// ==========================================
// Authentication Types
// ==========================================

export type UserType = 'parent' | 'child';

export interface ChatJWTPayload {
  type: UserType;
  id: string;
  parentId?: string; // Only for children
  email?: string;    // Only for parents
  username?: string; // Only for children
}

export interface AuthenticatedParent {
  type: 'parent';
  id: string;
  email: string;
  displayName: string | null;
}

export interface AuthenticatedChild {
  type: 'child';
  id: string;
  parentId: string;
  username: string;
  displayName: string;
  avatarId: string;
  ageBand: AgeBand;
  oversightMode: OversightMode;
  messagingPaused: boolean;
  voiceMessagingEnabled: boolean;
}

export type AuthenticatedUser = AuthenticatedParent | AuthenticatedChild;

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// ==========================================
// Polling Types
// ==========================================

export interface ChildPollResponse {
  newMessages: MessageWithSender[];
  friendshipUpdates: FriendshipWithChild[];
  lastCheckedAt: string;
}

export interface ParentPollResponse {
  pendingFriendRequests: FriendRequestWithChildren[];
  pendingMessages: MessageForApproval[];
  auditLogEntries: AuditLogEntry[];
  pendingCount: number;
  lastCheckedAt: string;
}

// ==========================================
// Extended Types (with relations)
// ==========================================

// Helper type for child data returned from database queries
type ChildSummary = Pick<ChildDB, 'id' | 'username' | 'display_name' | 'avatar_id'>;

export interface MessageWithSender extends Message {
  sender: ChildSummary;
}

export interface FriendshipWithChild extends Friendship {
  friend: ChildSummary;
}

export interface FriendRequestWithChildren extends Friendship {
  child: ChildSummary;
  friend: ChildSummary;
}

export interface MessageForApproval extends Message {
  sender: ChildSummary;
  conversation: {
    id: string;
    otherChild: ChildSummary;
  };
}

export interface ConversationWithFriend extends Conversation {
  friend: ChildSummary;
  lastMessage: Message | null;
  unreadCount: number;
}

export interface ChildWithStats extends Child {
  friendsCount: number;
  conversationsCount: number;
  pendingApprovals: number;
}

// ==========================================
// Form Types
// ==========================================

export interface ParentRegisterInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface ParentLoginInput {
  email: string;
  password: string;
}

export interface ChildLoginInput {
  username: string;
  password: string;
}

export interface CreateChildInput {
  username: string;
  password: string;
  displayName: string;
  avatarId: string;
  ageBand: AgeBand;
}

export interface UpdateChildInput {
  displayName?: string;
  avatarId?: string;
  oversightMode?: OversightMode;
  messagingPaused?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  voiceMessagingEnabled?: boolean;
}

export interface SendMessageInput {
  conversationId: string;
  type: MessageType;
  content?: string;
  mediaKey?: string;
  mediaDurationSeconds?: number;
}

// ==========================================
// Avatar Types
// ==========================================

export interface Avatar {
  id: string;
  name: string;
  emoji: string;
  category: AvatarCategory;
}

export type AvatarCategory = 'animals' | 'objects' | 'characters';

export const AVATARS: Avatar[] = [
  // Animals
  { id: 'cat', name: 'Cat', emoji: '🐱', category: 'animals' },
  { id: 'dog', name: 'Dog', emoji: '🐶', category: 'animals' },
  { id: 'panda', name: 'Panda', emoji: '🐼', category: 'animals' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', category: 'animals' },
  { id: 'bear', name: 'Bear', emoji: '🐻', category: 'animals' },
  { id: 'fox', name: 'Fox', emoji: '🦊', category: 'animals' },
  { id: 'owl', name: 'Owl', emoji: '🦉', category: 'animals' },
  { id: 'penguin', name: 'Penguin', emoji: '🐧', category: 'animals' },
  // Objects
  { id: 'rocket', name: 'Rocket', emoji: '🚀', category: 'objects' },
  { id: 'star', name: 'Star', emoji: '⭐', category: 'objects' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', category: 'objects' },
  { id: 'flower', name: 'Flower', emoji: '🌸', category: 'objects' },
  { id: 'cloud', name: 'Cloud', emoji: '☁️', category: 'objects' },
  { id: 'sun', name: 'Sun', emoji: '☀️', category: 'objects' },
  { id: 'moon', name: 'Moon', emoji: '🌙', category: 'objects' },
  // Characters
  { id: 'robot', name: 'Robot', emoji: '🤖', category: 'characters' },
  { id: 'astronaut', name: 'Astronaut', emoji: '👨‍🚀', category: 'characters' },
  { id: 'superhero', name: 'Superhero', emoji: '🦸', category: 'characters' },
  { id: 'wizard', name: 'Wizard', emoji: '🧙', category: 'characters' },
];

// ==========================================
// Emoji Types
// ==========================================

export interface EmojiCategory {
  name: string;
  emojis: string[];
}

export const CHILD_SAFE_EMOJIS: EmojiCategory[] = [
  {
    name: 'Faces',
    emojis: ['😊', '😄', '😃', '😀', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '😴', '😪', '😮', '😲', '🥱', '😎', '🤓', '🧐'],
  },
  {
    name: 'Animals',
    emojis: ['🐱', '🐶', '🐼', '🐰', '🦊', '🦁', '🐸', '🦋', '🐻', '🐨', '🐯', '🦄', '🐮', '🐷', '🐵', '🐔', '🐧', '🐦', '🦅', '🦆', '🦉', '🐺', '🐗', '🐴', '🦓', '🦒', '🐘', '🦏', '🐪', '🐬', '🐳', '🐠', '🐟', '🐙', '🦑', '🦐', '🦀', '🐢', '🐍', '🦎'],
  },
  {
    name: 'Food',
    emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥝', '🍅', '🥑', '🥕', '🌽', '🥦', '🧀', '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🍦', '🍩', '🍪', '🎂', '🧁', '🍰', '🍫', '🍬', '🍭', '🥤', '🧃', '☕', '🍵'],
  },
  {
    name: 'Activities',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '⛳', '🎮', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '📚', '📖', '✏️', '🖍️', '🖌️', '📝'],
  },
  {
    name: 'Nature',
    emojis: ['🌈', '⭐', '🌟', '✨', '💫', '☀️', '🌙', '🌸', '🌺', '🌻', '🌹', '🌷', '🌱', '🌲', '🌳', '🍀', '🍁', '🍂', '🌾', '☁️', '⛅', '🌤️', '🌦️', '🌧️', '⛈️', '❄️', '⛄', '🔥', '💧', '🌊'],
  },
  {
    name: 'Objects',
    emojis: ['🎈', '🎁', '🎀', '🎊', '🎉', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💖', '💗', '💝', '💘', '🏠', '🏡', '🚗', '🚕', '🚌', '🚎', '🏎️', '🚀', '✈️', '🚁', '🛸'],
  },
];

// ==========================================
// Referral Types
// ==========================================

export type ReferralStatus = 'clicked' | 'signed_up' | 'subscribed' | 'eligible' | 'credited' | 'invalid';
export type BillingCreditType = 'referral' | 'promo' | 'admin' | 'refund';

// Database format (snake_case)
export interface ReferralCodeDB {
  id: string;
  referrer_parent_id: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface ReferralDB {
  id: string;
  referrer_parent_id: string;
  referee_parent_id: string | null;
  code_used: string;
  status: ReferralStatus;
  child_names: string[] | null;
  click_fingerprint: string | null;
  signup_ip_hash: string | null;
  referee_email: string | null;
  created_at: string;
  signed_up_at: string | null;
  subscribed_at: string | null;
  first_payment_at: string | null;
  eligible_at: string | null;
  credited_at: string | null;
  notes: string | null;
  invalidated_by: string | null;
  invalidated_at: string | null;
}

export interface BillingCreditDB {
  id: string;
  parent_id: string;
  credit_type: BillingCreditType;
  quantity: number;
  source: string;
  referral_id: string | null;
  created_at: string;
  applied_at: string | null;
  expires_at: string | null;
}

// UI format (camelCase)
export interface ReferralCode {
  id: string;
  referrerParentId: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerParentId: string;
  refereeParentId: string | null;
  codeUsed: string;
  status: ReferralStatus;
  childNames: string[] | null;
  clickFingerprint: string | null;
  signupIpHash: string | null;
  refereeEmail: string | null;
  createdAt: string;
  signedUpAt: string | null;
  subscribedAt: string | null;
  firstPaymentAt: string | null;
  eligibleAt: string | null;
  creditedAt: string | null;
  notes: string | null;
  invalidatedBy: string | null;
  invalidatedAt: string | null;
}

export interface BillingCredit {
  id: string;
  parentId: string;
  creditType: BillingCreditType;
  quantity: number;
  source: string;
  referralId: string | null;
  createdAt: string;
  appliedAt: string | null;
  expiresAt: string | null;
}

export interface ParentReferralSummary {
  code: string;
  referralUrl: string;
  stats: {
    clicks: number;
    signups: number;
    subscriptions: number;
    credited: number;
  };
  referrals: Referral[];
  creditsAvailable: number;
  yearlyCreditsUsed: number;
}

// Referral configuration constants
export const REFERRAL_CONFIG = {
  MAX_CREDITS_PER_YEAR: 12,
  HOLD_PERIOD_DAYS: 14,
  CODE_LENGTH: 8,
} as const;

// Common email domains that should NOT trigger same-domain anti-abuse checks
export const COMMON_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
  'zoho.com',
] as const;

// Helper conversion functions
export function referralCodeFromDB(db: ReferralCodeDB): ReferralCode {
  return {
    id: db.id,
    referrerParentId: db.referrer_parent_id,
    code: db.code,
    isActive: db.is_active,
    createdAt: db.created_at,
  };
}

export function referralFromDB(db: ReferralDB): Referral {
  return {
    id: db.id,
    referrerParentId: db.referrer_parent_id,
    refereeParentId: db.referee_parent_id,
    codeUsed: db.code_used,
    status: db.status,
    childNames: db.child_names,
    clickFingerprint: db.click_fingerprint,
    signupIpHash: db.signup_ip_hash,
    refereeEmail: db.referee_email,
    createdAt: db.created_at,
    signedUpAt: db.signed_up_at,
    subscribedAt: db.subscribed_at,
    firstPaymentAt: db.first_payment_at,
    eligibleAt: db.eligible_at,
    creditedAt: db.credited_at,
    notes: db.notes,
    invalidatedBy: db.invalidated_by,
    invalidatedAt: db.invalidated_at,
  };
}

export function billingCreditFromDB(db: BillingCreditDB): BillingCredit {
  return {
    id: db.id,
    parentId: db.parent_id,
    creditType: db.credit_type,
    quantity: db.quantity,
    source: db.source,
    referralId: db.referral_id,
    createdAt: db.created_at,
    appliedAt: db.applied_at,
    expiresAt: db.expires_at,
  };
}

// Status display labels for UI
export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  clicked: 'Sent',
  signed_up: 'Signed up',
  subscribed: 'Subscribed',
  eligible: 'Processing',
  credited: 'Month earned',
  invalid: 'Invalid',
};
