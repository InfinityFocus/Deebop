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
      .from('children')
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

    // Get pending friend requests where child is the requester (needs sender's parent approval)
    const { data: outgoingRequests } = await supabase
      .from('friendships')
      .select('id, child_id, friend_child_id, requested_at')
      .in('child_id', childIds)
      .eq('status', 'pending');

    // Get pending friend requests where child is the recipient (needs recipient's parent approval)
    const { data: incomingRequests } = await supabase
      .from('friendships')
      .select('id, child_id, friend_child_id, requested_at')
      .in('friend_child_id', childIds)
      .eq('status', 'pending_recipient');

    // Combine both request types
    const friendRequests = [
      ...(outgoingRequests || []).map(fr => ({ ...fr, requestType: 'outgoing' as const })),
      ...(incomingRequests || []).map(fr => ({ ...fr, requestType: 'incoming' as const })),
    ];

    // Get all child details (both senders and recipients)
    const allChildIds = new Set([
      ...(friendRequests || []).map((fr) => fr.friend_child_id),
      ...(friendRequests || []).map((fr) => fr.child_id),
    ]);
    const { data: allChildDetails } = allChildIds.size > 0
      ? await supabase
          .from('children')
          .select('id, display_name, avatar_id')
          .in('id', Array.from(allChildIds))
      : { data: [] };
    const friendMap = new Map((allChildDetails || []).map((f) => [f.id, f]));

    // Get pending messages from children
    const { data: pendingMessages } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_child_id, type, content, created_at')
      .in('sender_child_id', childIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);

    // Get conversation details separately
    const conversationIds = [...new Set((pendingMessages || []).map((m) => m.conversation_id))];
    const { data: conversations } = conversationIds.length > 0
      ? await supabase
          .from('conversations')
          .select('id, child_a_id, child_b_id')
          .in('id', conversationIds)
      : { data: [] };
    const conversationMap = new Map((conversations || []).map((c) => [c.id, c]));

    // Transform friend requests
    const transformedFriendRequests = (friendRequests || []).map((fr) => {
      const sender = friendMap.get(fr.child_id) || childMap.get(fr.child_id);
      const recipient = friendMap.get(fr.friend_child_id) || childMap.get(fr.friend_child_id);

      // For outgoing: your child (sender) wants to add someone
      // For incoming: someone wants to add your child (recipient)
      const isOutgoing = fr.requestType === 'outgoing';
      const yourChild = isOutgoing ? sender : recipient;
      const otherChild = isOutgoing ? recipient : sender;

      return {
        id: fr.id,
        childId: fr.child_id,
        childName: sender?.display_name || 'Unknown',
        childAvatar: sender?.avatar_id || 'cat',
        friendChildId: fr.friend_child_id,
        friendName: recipient?.display_name || 'Unknown',
        friendAvatar: recipient?.avatar_id || 'cat',
        requestedAt: fr.requested_at,
        requestType: fr.requestType, // 'outgoing' or 'incoming'
        yourChildId: isOutgoing ? fr.child_id : fr.friend_child_id,
        yourChildName: yourChild?.display_name || 'Unknown',
        otherChildName: otherChild?.display_name || 'Unknown',
      };
    });

    // Get recipient names for messages
    const messageRecipientIds = new Set<string>();
    (pendingMessages || []).forEach((m) => {
      const conv = conversationMap.get(m.conversation_id);
      if (conv) {
        const recipientId = conv.child_a_id === m.sender_child_id
          ? conv.child_b_id
          : conv.child_a_id;
        messageRecipientIds.add(recipientId);
      }
    });

    let recipientMap = new Map<string, { display_name: string; avatar_id: string }>();
    if (messageRecipientIds.size > 0) {
      const { data: recipients } = await supabase
        .from('children')
        .select('id, display_name, avatar_id')
        .in('id', Array.from(messageRecipientIds));

      recipientMap = new Map((recipients || []).map((r) => [r.id, r]));
    }

    // Transform messages
    const transformedMessages = (pendingMessages || []).map((m) => {
      const sender = childMap.get(m.sender_child_id);
      const conv = conversationMap.get(m.conversation_id);
      const recipientId = conv
        ? (conv.child_a_id === m.sender_child_id ? conv.child_b_id : conv.child_a_id)
        : null;
      const recipient = recipientId ? recipientMap.get(recipientId) : null;

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
