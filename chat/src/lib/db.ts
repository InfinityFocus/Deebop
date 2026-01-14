import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ==========================================
// Supabase Client Configuration
// ==========================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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
