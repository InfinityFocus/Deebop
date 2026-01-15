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
