// ==========================================
// Database Types (matching chat.* schema)
// ==========================================

export interface Parent {
  id: string;
  email: string;
  display_name: string | null;
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
}

export type FriendshipStatus = 'pending' | 'approved' | 'blocked';

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

export type MessageStatus = 'pending' | 'approved' | 'delivered' | 'denied';

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

export interface MessageWithSender extends Message {
  sender: Pick<Child, 'id' | 'username' | 'display_name' | 'avatar_id'>;
}

export interface FriendshipWithChild extends Friendship {
  friend: Pick<Child, 'id' | 'username' | 'display_name' | 'avatar_id'>;
}

export interface FriendRequestWithChildren extends Friendship {
  child: Pick<Child, 'id' | 'username' | 'display_name' | 'avatar_id'>;
  friend: Pick<Child, 'id' | 'username' | 'display_name' | 'avatar_id'>;
}

export interface MessageForApproval extends Message {
  sender: Pick<Child, 'id' | 'username' | 'display_name' | 'avatar_id'>;
  conversation: {
    id: string;
    otherChild: Pick<Child, 'id' | 'username' | 'display_name' | 'avatar_id'>;
  };
}

export interface ConversationWithFriend extends Conversation {
  friend: Pick<Child, 'id' | 'username' | 'display_name' | 'avatar_id'>;
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
  category: AvatarCategory;
}

export type AvatarCategory = 'animals' | 'objects' | 'characters';

export const AVATARS: Avatar[] = [
  // Animals
  { id: 'cat', name: 'Cat', category: 'animals' },
  { id: 'dog', name: 'Dog', category: 'animals' },
  { id: 'panda', name: 'Panda', category: 'animals' },
  { id: 'rabbit', name: 'Rabbit', category: 'animals' },
  { id: 'bear', name: 'Bear', category: 'animals' },
  { id: 'fox', name: 'Fox', category: 'animals' },
  { id: 'owl', name: 'Owl', category: 'animals' },
  { id: 'penguin', name: 'Penguin', category: 'animals' },
  // Objects
  { id: 'rocket', name: 'Rocket', category: 'objects' },
  { id: 'star', name: 'Star', category: 'objects' },
  { id: 'rainbow', name: 'Rainbow', category: 'objects' },
  { id: 'flower', name: 'Flower', category: 'objects' },
  { id: 'cloud', name: 'Cloud', category: 'objects' },
  { id: 'sun', name: 'Sun', category: 'objects' },
  { id: 'moon', name: 'Moon', category: 'objects' },
  // Characters
  { id: 'robot', name: 'Robot', category: 'characters' },
  { id: 'astronaut', name: 'Astronaut', category: 'characters' },
  { id: 'superhero', name: 'Superhero', category: 'characters' },
  { id: 'wizard', name: 'Wizard', category: 'characters' },
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
