import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/child/conversations/[id] - Get conversation with messages
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'child') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get conversation and verify access
    const { data: conversation } = await supabase
      .from('chat.conversations')
      .select('id, child_a_id, child_b_id')
      .eq('id', id)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify user is part of this conversation
    if (conversation.child_a_id !== user.id && conversation.child_b_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get friend details
    const friendId =
      conversation.child_a_id === user.id
        ? conversation.child_b_id
        : conversation.child_a_id;

    const { data: friend } = await supabase
      .from('chat.children')
      .select('id, username, display_name, avatar_id')
      .eq('id', friendId)
      .single();

    // Get messages
    const { data: messages } = await supabase
      .from('chat.messages')
      .select('id, type, content, media_url, media_duration_seconds, status, created_at, sender_child_id')
      .eq('conversation_id', id)
      .neq('status', 'denied') // Don't show denied messages to recipient
      .order('created_at', { ascending: true });

    // Transform messages
    const transformedMessages = (messages || []).map((m) => ({
      id: m.id,
      type: m.type as 'text' | 'emoji' | 'voice',
      content: m.content,
      mediaUrl: m.media_url,
      mediaDuration: m.media_duration_seconds,
      status: m.status as 'pending' | 'approved' | 'delivered' | 'denied',
      createdAt: m.created_at,
      isFromMe: m.sender_child_id === user.id,
    }));

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          friendId,
          friendName: friend?.display_name || 'Unknown',
          friendUsername: friend?.username || 'unknown',
          friendAvatar: friend?.avatar_id || 'cat',
        },
        messages: transformedMessages,
      },
    });
  } catch (error) {
    console.error('Conversation fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
