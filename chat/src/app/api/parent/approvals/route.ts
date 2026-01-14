import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/parent/approvals - Get pending friend requests and messages
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all children IDs for this parent
    const { data: children } = await supabase
      .from('chat.children')
      .select('id, display_name, avatar_id')
      .eq('parent_id', user.id);

    if (!children || children.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          friendRequests: [],
          messages: [],
          recentActivity: [],
        },
      });
    }

    const childIds = children.map((c) => c.id);
    const childMap = new Map(children.map((c) => [c.id, c]));

    // Get pending friend requests where child is the requester
    const { data: friendRequests } = await supabase
      .from('chat.friendships')
      .select(`
        id,
        child_id,
        friend_child_id,
        requested_at,
        friend:chat.children!friend_child_id(id, display_name, avatar_id)
      `)
      .in('child_id', childIds)
      .eq('status', 'pending');

    // Get pending messages from children
    const { data: pendingMessages } = await supabase
      .from('chat.messages')
      .select(`
        id,
        conversation_id,
        sender_child_id,
        type,
        content,
        created_at,
        conversation:chat.conversations!inner(
          child_a_id,
          child_b_id
        )
      `)
      .in('sender_child_id', childIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);

    // Transform friend requests
    const transformedFriendRequests = (friendRequests || []).map((fr) => {
      const child = childMap.get(fr.child_id);
      const friend = fr.friend as { id: string; display_name: string; avatar_id: string } | null;

      return {
        id: fr.id,
        childId: fr.child_id,
        childName: child?.display_name || 'Unknown',
        childAvatar: child?.avatar_id || 'cat',
        friendChildId: fr.friend_child_id,
        friendName: friend?.display_name || 'Unknown',
        friendAvatar: friend?.avatar_id || 'cat',
        requestedAt: fr.requested_at,
      };
    });

    // Get recipient names for messages
    const messageRecipientIds = new Set<string>();
    (pendingMessages || []).forEach((m) => {
      const conv = m.conversation as { child_a_id: string; child_b_id: string };
      const recipientId = conv.child_a_id === m.sender_child_id
        ? conv.child_b_id
        : conv.child_a_id;
      messageRecipientIds.add(recipientId);
    });

    let recipientMap = new Map<string, { display_name: string; avatar_id: string }>();
    if (messageRecipientIds.size > 0) {
      const { data: recipients } = await supabase
        .from('chat.children')
        .select('id, display_name, avatar_id')
        .in('id', Array.from(messageRecipientIds));

      recipientMap = new Map((recipients || []).map((r) => [r.id, r]));
    }

    // Transform messages
    const transformedMessages = (pendingMessages || []).map((m) => {
      const sender = childMap.get(m.sender_child_id);
      const conv = m.conversation as { child_a_id: string; child_b_id: string };
      const recipientId = conv.child_a_id === m.sender_child_id
        ? conv.child_b_id
        : conv.child_a_id;
      const recipient = recipientMap.get(recipientId);

      return {
        id: m.id,
        conversationId: m.conversation_id,
        senderChildId: m.sender_child_id,
        senderName: sender?.display_name || 'Unknown',
        senderAvatar: sender?.avatar_id || 'cat',
        recipientName: recipient?.display_name || 'Unknown',
        type: m.type as 'text' | 'emoji' | 'voice',
        content: m.content,
        createdAt: m.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        friendRequests: transformedFriendRequests,
        messages: transformedMessages,
        recentActivity: [],
      },
    });
  } catch (error) {
    console.error('Approvals fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
