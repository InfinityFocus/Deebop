import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/child/conversations - List conversations for current child
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'child') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all conversations for this child
    const { data: conversations } = await supabase
      .from('chat.conversations')
      .select(`
        id,
        child_a_id,
        child_b_id,
        created_at
      `)
      .or(`child_a_id.eq.${user.id},child_b_id.eq.${user.id}`);

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Get friend details
    const friendIds = conversations.map((c) =>
      c.child_a_id === user.id ? c.child_b_id : c.child_a_id
    );

    const { data: friends } = await supabase
      .from('chat.children')
      .select('id, username, display_name, avatar_id')
      .in('id', friendIds);

    const friendMap = new Map((friends || []).map((f) => [f.id, f]));

    // Get last message for each conversation
    const conversationIds = conversations.map((c) => c.id);
    const { data: lastMessages } = await supabase
      .from('chat.messages')
      .select('conversation_id, type, content, status, created_at, sender_child_id')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    // Group by conversation and get first (most recent) message
    type Message = NonNullable<typeof lastMessages>[number];
    const lastMessageMap = new Map<string, Message>();
    (lastMessages || []).forEach((m) => {
      if (!lastMessageMap.has(m.conversation_id)) {
        lastMessageMap.set(m.conversation_id, m);
      }
    });

    // Count unread messages (delivered messages from friend)
    const unreadCounts = new Map<string, number>();
    (lastMessages || []).forEach((m) => {
      if (m.status === 'delivered' && m.sender_child_id !== user.id) {
        unreadCounts.set(
          m.conversation_id,
          (unreadCounts.get(m.conversation_id) || 0) + 1
        );
      }
    });

    // Transform data
    const result = conversations.map((conv) => {
      const friendId = conv.child_a_id === user.id ? conv.child_b_id : conv.child_a_id;
      const friend = friendMap.get(friendId);
      const lastMessage = lastMessageMap.get(conv.id);

      return {
        id: conv.id,
        friendId,
        friendName: friend?.display_name || 'Unknown',
        friendUsername: friend?.username || 'unknown',
        friendAvatar: friend?.avatar_id || 'cat',
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              type: lastMessage.type as 'text' | 'emoji' | 'voice',
              createdAt: lastMessage.created_at,
              isFromMe: lastMessage.sender_child_id === user.id,
              status: lastMessage.status as 'pending' | 'approved' | 'delivered' | 'denied',
            }
          : null,
        unreadCount: unreadCounts.get(conv.id) || 0,
      };
    });

    // Sort by last message time
    result.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || '1970-01-01';
      const bTime = b.lastMessage?.createdAt || '1970-01-01';
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Conversations fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
