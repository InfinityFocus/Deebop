import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/parent/children/[id]/conversations/[conversationId] - Get conversation messages for monitoring
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: childId, conversationId } = await params;

    // Verify this child belongs to the parent
    const { data: child } = await supabase
      .from('children')
      .select('id, display_name, avatar_id')
      .eq('id', childId)
      .eq('parent_id', user.id)
      .single();

    if (!child) {
      return NextResponse.json(
        { success: false, error: 'Child not found' },
        { status: 404 }
      );
    }

    // Verify conversation involves this child
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, child_a_id, child_b_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.child_a_id !== childId && conversation.child_b_id !== childId) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get friend details
    const friendId = conversation.child_a_id === childId
      ? conversation.child_b_id
      : conversation.child_a_id;

    const { data: friend } = await supabase
      .from('children')
      .select('id, username, display_name, avatar_id')
      .eq('id', friendId)
      .single();

    // Get all messages in conversation (parents can see all statuses for monitoring)
    const { data: messages } = await supabase
      .from('messages')
      .select('id, type, content, media_key, media_url, media_duration_seconds, status, created_at, sender_child_id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Transform messages
    const transformedMessages = (messages || []).map((m) => ({
      id: m.id,
      type: m.type,
      content: m.content,
      mediaKey: m.media_key,
      mediaUrl: m.media_url,
      mediaDuration: m.media_duration_seconds,
      status: m.status,
      createdAt: m.created_at,
      isFromChild: m.sender_child_id === childId,
      senderName: m.sender_child_id === childId ? child.display_name : friend?.display_name || 'Unknown',
      senderAvatar: m.sender_child_id === childId ? child.avatar_id : friend?.avatar_id || 'cat',
    }));

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          id: conversationId,
          childId,
          childName: child.display_name,
          childAvatar: child.avatar_id,
          friendId,
          friendName: friend?.display_name || 'Unknown',
          friendUsername: friend?.username || 'unknown',
          friendAvatar: friend?.avatar_id || 'cat',
        },
        messages: transformedMessages,
      },
    });
  } catch (error) {
    console.error('Conversation messages fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
