import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ==========================================
// Supabase Client Configuration
// ==========================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Optional - not used in chat app
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Public client for client-side operations
let publicClient: SupabaseClient | null = null;

// Service client for server-side operations (bypasses RLS)
let serviceClient: SupabaseClient | null = null;

/**
 * Get the public Supabase client
 * Use this for client-side operations
 */
export function getPublicClient(): SupabaseClient {
  if (!publicClient) {
    if (!supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    }
    publicClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return publicClient;
}

/**
 * Get the service Supabase client
 * Use this for server-side operations that need to bypass RLS
 */
export function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }
    serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serviceClient;
}

// Alias for convenience - returns service client for server-side operations
export const supabase = {
  from: (table: string) => getServiceClient().schema('chat').from(table),
  rpc: (fn: string, params?: Record<string, unknown>) => getServiceClient().rpc(fn, params),
};

// ==========================================
// Type-safe Query Helpers
// ==========================================

/**
 * Execute a query on the chat schema
 * Returns typed results
 */
export async function query<T>(
  sql: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const client = getServiceClient();
  const { data, error } = await client.rpc('', {
    // Note: We use raw SQL queries via the REST API
    // This is a simplified version - in production you'd use
    // stored procedures or the PostgREST API
  });

  if (error) {
    console.error('Database query error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data as T[];
}

// ==========================================
// Parent Queries
// ==========================================

export async function getParentByEmail(email: string) {
  const client = getServiceClient();
  const { data, error } = await client
    .schema('chat')
    .from('parents')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

export async function getParentById(id: string) {
  const client = getServiceClient();
  const { data, error } = await client
    .schema('chat')
    .from('parents')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

export async function createParent(
  email: string,
  passwordHash: string,
  displayName?: string
) {
  const client = getServiceClient();
  const { data, error } = await client
    .schema('chat')
    .from('parents')
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      display_name: displayName || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Email already registered');
    }
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

// ==========================================
// Child Queries
// ==========================================

export async function getChildByUsername(username: string) {
  const client = getServiceClient();
  const { data, error } = await client
    .schema('chat')
    .from('children')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

export async function getChildById(id: string) {
  const client = getServiceClient();
  const { data, error } = await client
    .schema('chat')
    .from('children')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

export async function getChildrenByParentId(parentId: string) {
  const client = getServiceClient();
  const { data, error } = await client
    .schema('chat')
    .from('children')
    .select('*')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

export async function createChild(
  parentId: string,
  username: string,
  passwordHash: string,
  displayName: string,
  avatarId: string,
  ageBand: string
) {
  const client = getServiceClient();

  // Set default oversight mode based on age band
  const oversightMode = ageBand === '6-8' ? 'approve_all' : 'approve_first';

  const { data, error } = await client
    .schema('chat')
    .from('children')
    .insert({
      parent_id: parentId,
      username: username.toLowerCase(),
      password_hash: passwordHash,
      display_name: displayName,
      avatar_id: avatarId,
      age_band: ageBand,
      oversight_mode: oversightMode,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Username already taken');
    }
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

export async function updateChild(
  id: string,
  updates: {
    display_name?: string;
    avatar_id?: string;
    oversight_mode?: string;
    messaging_paused?: boolean;
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
    voice_messaging_enabled?: boolean;
  }
) {
  const client = getServiceClient();
  const { data, error } = await client
    .schema('chat')
    .from('children')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

// ==========================================
// Friendship Queries
// ==========================================

export async function getFriendshipBetween(childId: string, friendId: string) {
  const client = getServiceClient();
  const { data, error } = await client
    .schema('chat')
    .from('friendships')
    .select('*')
    .or(`and(child_id.eq.${childId},friend_child_id.eq.${friendId}),and(child_id.eq.${friendId},friend_child_id.eq.${childId})`)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

export async function getChildFriendships(childId: string, status?: string) {
  const client = getServiceClient();
  let query = client
    .schema('chat')
    .from('friendships')
    .select(`
      *,
      friend:friend_child_id(id, username, display_name, avatar_id)
    `)
    .eq('child_id', childId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('requested_at', { ascending: false });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

export async function getPendingFriendRequestsForParent(parentId: string) {
  const client = getServiceClient();

  // Get all children IDs for this parent
  const { data: children } = await client
    .schema('chat')
    .from('children')
    .select('id')
    .eq('parent_id', parentId);

  if (!children || children.length === 0) return [];

  const childIds = children.map(c => c.id);

  // Get pending friend requests where the child is the friend (incoming requests)
  const { data, error } = await client
    .schema('chat')
    .from('friendships')
    .select(`
      *,
      child:child_id(id, username, display_name, avatar_id),
      friend:friend_child_id(id, username, display_name, avatar_id)
    `)
    .in('friend_child_id', childIds)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

export async function createFriendRequest(childId: string, friendChildId: string) {
  const client = getServiceClient();
  const { data, error } = await client
    .schema('chat')
    .from('friendships')
    .insert({
      child_id: childId,
      friend_child_id: friendChildId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Friend request already exists');
    }
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

export async function approveFriendship(friendshipId: string, parentId: string) {
  const client = getServiceClient();
  const { data, error } = await client
    .schema('chat')
    .from('friendships')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by_parent_id: parentId,
    })
    .eq('id', friendshipId)
    .select()
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

export async function blockFriendship(friendshipId: string) {
  const client = getServiceClient();
  const { data, error } = await client
    .schema('chat')
    .from('friendships')
    .update({ status: 'blocked' })
    .eq('id', friendshipId)
    .select()
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

// ==========================================
// Conversation Queries
// ==========================================

export async function getOrCreateConversation(childAId: string, childBId: string) {
  const client = getServiceClient();

  // Ensure consistent ordering
  const [first, second] = childAId < childBId ? [childAId, childBId] : [childBId, childAId];

  // Try to find existing
  let { data, error } = await client
    .schema('chat')
    .from('conversations')
    .select('*')
    .eq('child_a_id', first)
    .eq('child_b_id', second)
    .single();

  if (error && error.code === 'PGRST116') {
    // Create new conversation
    const result = await client
      .schema('chat')
      .from('conversations')
      .insert({
        child_a_id: first,
        child_b_id: second,
      })
      .select()
      .single();

    data = result.data;
    error = result.error;
  }

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

export async function getChildConversations(childId: string) {
  const client = getServiceClient();

  // Get conversations where child is either child_a or child_b
  const { data, error } = await client
    .schema('chat')
    .from('conversations')
    .select(`
      *,
      child_a:child_a_id(id, username, display_name, avatar_id),
      child_b:child_b_id(id, username, display_name, avatar_id)
    `)
    .or(`child_a_id.eq.${childId},child_b_id.eq.${childId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

// ==========================================
// Message Queries
// ==========================================

export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  cursor?: string
) {
  const client = getServiceClient();

  let query = client
    .schema('chat')
    .from('messages')
    .select(`
      *,
      sender:sender_child_id(id, username, display_name, avatar_id)
    `)
    .eq('conversation_id', conversationId)
    .in('status', ['approved', 'delivered'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

export async function createMessage(
  conversationId: string,
  senderChildId: string,
  type: string,
  content?: string,
  mediaKey?: string,
  mediaDurationSeconds?: number,
  status = 'pending'
) {
  const client = getServiceClient();
  const { data, error } = await client
    .schema('chat')
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_child_id: senderChildId,
      type,
      content: content || null,
      media_key: mediaKey || null,
      media_duration_seconds: mediaDurationSeconds || null,
      status,
      delivered_at: status === 'delivered' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

export async function getPendingMessagesForParent(parentId: string) {
  const client = getServiceClient();

  // Get all children IDs for this parent
  const { data: children } = await client
    .schema('chat')
    .from('children')
    .select('id')
    .eq('parent_id', parentId);

  if (!children || children.length === 0) return [];

  const childIds = children.map(c => c.id);

  // Get pending messages sent by these children
  const { data, error } = await client
    .schema('chat')
    .from('messages')
    .select(`
      *,
      sender:sender_child_id(id, username, display_name, avatar_id)
    `)
    .in('sender_child_id', childIds)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

export async function approveMessage(messageId: string, parentId: string) {
  const client = getServiceClient();

  // Update message status
  const { data: message, error: messageError } = await client
    .schema('chat')
    .from('messages')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single();

  if (messageError) {
    throw new Error(`Database error: ${messageError.message}`);
  }

  // Create approval record
  await client
    .schema('chat')
    .from('approvals')
    .insert({
      message_id: messageId,
      parent_id: parentId,
      decision: 'approved',
    });

  return message;
}

export async function denyMessage(messageId: string, parentId: string) {
  const client = getServiceClient();

  // Update message status
  const { data: message, error: messageError } = await client
    .schema('chat')
    .from('messages')
    .update({ status: 'denied' })
    .eq('id', messageId)
    .select()
    .single();

  if (messageError) {
    throw new Error(`Database error: ${messageError.message}`);
  }

  // Create approval record
  await client
    .schema('chat')
    .from('approvals')
    .insert({
      message_id: messageId,
      parent_id: parentId,
      decision: 'denied',
    });

  return message;
}

// ==========================================
// Audit Log Queries
// ==========================================

export async function createAuditLog(
  parentId: string,
  action: string,
  childId?: string,
  details?: Record<string, unknown>
) {
  const client = getServiceClient();
  const { error } = await client
    .schema('chat')
    .from('audit_log')
    .insert({
      parent_id: parentId,
      child_id: childId || null,
      action,
      details: details || null,
    });

  if (error) {
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLog(parentId: string, limit = 50, cursor?: string) {
  const client = getServiceClient();

  let query = client
    .schema('chat')
    .from('audit_log')
    .select('*')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

// ==========================================
// Admin Queries
// ==========================================

export async function getAdminStats() {
  const client = getServiceClient();

  // Get all counts in parallel
  const [
    parentsResult,
    childrenResult,
    conversationsResult,
    pendingMessagesResult,
    pendingFriendshipsResult,
    messagesTodayResult,
    deniedMessagesResult,
    totalMessagesResult,
  ] = await Promise.all([
    client.schema('chat').from('parents').select('id', { count: 'exact', head: true }),
    client.schema('chat').from('children').select('id', { count: 'exact', head: true }),
    client.schema('chat').from('conversations').select('id', { count: 'exact', head: true }),
    client.schema('chat').from('messages').select('id', { count: 'exact', head: true }).in('status', ['pending', 'pending_recipient']),
    client.schema('chat').from('friendships').select('id', { count: 'exact', head: true }).in('status', ['pending', 'pending_recipient']),
    client.schema('chat').from('messages').select('id', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    client.schema('chat').from('messages').select('id', { count: 'exact', head: true }).eq('status', 'denied'),
    client.schema('chat').from('messages').select('id', { count: 'exact', head: true }),
  ]);

  const totalParents = parentsResult.count || 0;
  const totalChildren = childrenResult.count || 0;
  const totalConversations = conversationsResult.count || 0;
  const pendingMessages = pendingMessagesResult.count || 0;
  const pendingFriendships = pendingFriendshipsResult.count || 0;
  const messagesToday = messagesTodayResult.count || 0;
  const deniedMessages = deniedMessagesResult.count || 0;
  const totalMessages = totalMessagesResult.count || 0;

  const denialRate = totalMessages > 0 ? Math.round((deniedMessages / totalMessages) * 100) : 0;

  return {
    totalParents,
    totalChildren,
    totalConversations,
    pendingApprovals: pendingMessages + pendingFriendships,
    pendingMessages,
    pendingFriendships,
    messagesToday,
    denialRate,
  };
}

export async function getAllParents(
  search?: string,
  page = 1,
  limit = 20
) {
  const client = getServiceClient();
  const offset = (page - 1) * limit;

  let query = client
    .schema('chat')
    .from('parents')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return {
    parents: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function getAllChildren(
  filters: {
    search?: string;
    ageBand?: string;
    oversightMode?: string;
    messagingPaused?: boolean;
  },
  page = 1,
  limit = 20
) {
  const client = getServiceClient();
  const offset = (page - 1) * limit;

  let query = client
    .schema('chat')
    .from('children')
    .select(`
      *,
      parent:parent_id(id, email, display_name)
    `, { count: 'exact' });

  if (filters.search) {
    query = query.or(`username.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
  }
  if (filters.ageBand) {
    query = query.eq('age_band', filters.ageBand);
  }
  if (filters.oversightMode) {
    query = query.eq('oversight_mode', filters.oversightMode);
  }
  if (filters.messagingPaused !== undefined) {
    query = query.eq('messaging_paused', filters.messagingPaused);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return {
    children: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function getAllConversations(
  filters: {
    hasPending?: boolean;
  },
  page = 1,
  limit = 20
) {
  const client = getServiceClient();
  const offset = (page - 1) * limit;

  const { data, error, count } = await client
    .schema('chat')
    .from('conversations')
    .select(`
      *,
      child_a:child_a_id(id, username, display_name, avatar_id),
      child_b:child_b_id(id, username, display_name, avatar_id)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  // Get message counts for each conversation
  const conversationsWithCounts = await Promise.all(
    (data || []).map(async (conv) => {
      const { count: messageCount } = await client
        .schema('chat')
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id);

      const { count: pendingCount } = await client
        .schema('chat')
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .in('status', ['pending', 'pending_recipient']);

      // Get last message
      const { data: lastMessages } = await client
        .schema('chat')
        .from('messages')
        .select('content, type, created_at, status')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        ...conv,
        messageCount: messageCount || 0,
        pendingCount: pendingCount || 0,
        lastMessage: lastMessages?.[0] || null,
      };
    })
  );

  // Filter by pending if needed
  let filteredConversations = conversationsWithCounts;
  if (filters.hasPending) {
    filteredConversations = conversationsWithCounts.filter(c => c.pendingCount > 0);
  }

  return {
    conversations: filteredConversations,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function getConversationById(conversationId: string) {
  const client = getServiceClient();

  const { data: conversation, error: convError } = await client
    .schema('chat')
    .from('conversations')
    .select(`
      *,
      child_a:child_a_id(id, username, display_name, avatar_id, parent_id),
      child_b:child_b_id(id, username, display_name, avatar_id, parent_id)
    `)
    .eq('id', conversationId)
    .single();

  if (convError) {
    throw new Error(`Database error: ${convError.message}`);
  }

  // Get all messages (including all statuses for admin)
  const { data: messages, error: msgError } = await client
    .schema('chat')
    .from('messages')
    .select(`
      *,
      sender:sender_child_id(id, username, display_name, avatar_id)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (msgError) {
    throw new Error(`Database error: ${msgError.message}`);
  }

  return {
    conversation,
    messages: messages || [],
  };
}

export async function searchMessages(
  filters: {
    search?: string;
    status?: string;
    type?: string;
    fromDate?: string;
    toDate?: string;
  },
  page = 1,
  limit = 20
) {
  const client = getServiceClient();
  const offset = (page - 1) * limit;

  let query = client
    .schema('chat')
    .from('messages')
    .select(`
      *,
      sender:sender_child_id(id, username, display_name, avatar_id),
      conversation:conversation_id(
        id,
        child_a:child_a_id(id, username, display_name),
        child_b:child_b_id(id, username, display_name)
      )
    `, { count: 'exact' });

  if (filters.search) {
    query = query.ilike('content', `%${filters.search}%`);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.fromDate) {
    query = query.gte('created_at', filters.fromDate);
  }
  if (filters.toDate) {
    query = query.lte('created_at', filters.toDate);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return {
    messages: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function getAllAuditLogs(
  filters: {
    action?: string;
    parentEmail?: string;
    fromDate?: string;
    toDate?: string;
  },
  page = 1,
  limit = 50
) {
  const client = getServiceClient();
  const offset = (page - 1) * limit;

  let query = client
    .schema('chat')
    .from('audit_log')
    .select(`
      *,
      parent:parent_id(id, email, display_name),
      child:child_id(id, username, display_name)
    `, { count: 'exact' });

  if (filters.action) {
    query = query.eq('action', filters.action);
  }
  if (filters.fromDate) {
    query = query.gte('created_at', filters.fromDate);
  }
  if (filters.toDate) {
    query = query.lte('created_at', filters.toDate);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  // Filter by parent email if needed (post-filter since it's a joined field)
  let filteredData = data || [];
  if (filters.parentEmail) {
    filteredData = filteredData.filter((log: { parent?: { email?: string } }) =>
      log.parent?.email?.toLowerCase().includes(filters.parentEmail!.toLowerCase())
    );
  }

  return {
    logs: filteredData,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}
