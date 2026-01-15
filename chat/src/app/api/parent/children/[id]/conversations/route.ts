import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/parent/children/[id]/conversations - Get child's conversations for monitoring
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: childId } = await params;

    // Verify this child belongs to the parent
    const { data: child } = await supabase
      .from('children')
      .select('id, display_name')
      .eq('id', childId)
      .eq('parent_id', user.id)
      .single();

    if (!child) {
      return NextResponse.json(
        { success: false, error: 'Child not found' },
        { status: 404 }
      );
    }

    // Get all conversations for this child
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, child_a_id, child_b_id, created_at')
      .or(`child_a_id.eq.${childId},child_b_id.eq.${childId}`)
      .order('created_at', { ascending: false });

    // Get friend details
    const friendIds = (conversations || []).map((c) =>
      c.child_a_id === childId ? c.child_b_id : c.child_a_id
    );
    const { data: friends } = friendIds.length > 0
      ? await supabase
          .from('children')
          .select('id, username, display_name, avatar_id')
          .in('id', friendIds)
      : { data: [] };

    const friendMap = new Map((friends || []).map((f) => [f.id, f]));

    // Get last message for each conversation
    const conversationIds = (conversations || []).map((c) => c.id);
    const { data: lastMessages } = conversationIds.length > 0
      ? await supabase
          .from('messages')
          .select('id, conversation_id, content, type, created_at, sender_child_id, status')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false })
      : { data: [] };

    // Group messages by conversation and get the last one
    const lastMessageMap = new Map<string, typeof lastMessages[0]>();
    (lastMessages || []).forEach((m) => {
      if (!lastMessageMap.has(m.conversation_id)) {
        lastMessageMap.set(m.conversation_id, m);
      }
    });

    // Count messages per conversation
    const messageCountMap = new Map<string, number>();
    (lastMessages || []).forEach((m) => {
      messageCountMap.set(m.conversation_id, (messageCountMap.get(m.conversation_id) || 0) + 1);
    });

    // Transform data
    const transformedConversations = (conversations || []).map((c) => {
      const friendId = c.child_a_id === childId ? c.child_b_id : c.child_a_id;
      const friend = friendMap.get(friendId);
      const lastMessage = lastMessageMap.get(c.id);

      return {
        id: c.id,
        friendId,
        friendName: friend?.display_name || 'Unknown',
        friendUsername: friend?.username || 'unknown',
        friendAvatar: friend?.avatar_id || 'cat',
        createdAt: c.created_at,
        messageCount: messageCountMap.get(c.id) || 0,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              type: lastMessage.type,
              createdAt: lastMessage.created_at,
              isFromChild: lastMessage.sender_child_id === childId,
              status: lastMessage.status,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        childId,
        childName: child.display_name,
        conversations: transformedConversations,
      },
    });
  } catch (error) {
    console.error('Conversations fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
