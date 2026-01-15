import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

// POST /api/child/conversations/[id]/messages - Send a message
export async function POST(
  request: NextRequest,
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
    const body = await request.json();
    const { type, content, mediaKey, mediaDuration } = body;

    // Validate type
    if (!['text', 'emoji', 'voice'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid message type' },
        { status: 400 }
      );
    }

    // Validate content
    if ((type === 'text' || type === 'emoji') && !content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    if (type === 'voice' && !mediaKey) {
      return NextResponse.json(
        { success: false, error: 'Media key is required for voice messages' },
        { status: 400 }
      );
    }

    // Get conversation and verify access
    const { data: conversation } = await supabase
      .from('conversations')
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

    // Check if messaging is paused for this child
    const { data: child } = await supabase
      .from('children')
      .select('messaging_paused, oversight_mode, parent_id')
      .eq('id', user.id)
      .single();

    if (child?.messaging_paused) {
      return NextResponse.json(
        { success: false, error: 'Messaging is paused for your account' },
        { status: 403 }
      );
    }

    // Determine message status based on oversight mode
    let status: 'pending' | 'delivered' = 'delivered';
    const oversightMode = child?.oversight_mode || 'approve_first';

    if (oversightMode === 'approve_all') {
      // Every message needs approval
      status = 'pending';
    } else if (oversightMode === 'approve_first') {
      // Check if this is first message to this friend
      const friendId =
        conversation.child_a_id === user.id
          ? conversation.child_b_id
          : conversation.child_a_id;

      const { data: existingMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', id)
        .eq('sender_child_id', user.id)
        .in('status', ['delivered', 'approved'])
        .limit(1);

      if (!existingMessages || existingMessages.length === 0) {
        // First message to this friend needs approval
        status = 'pending';
      }
    }
    // If oversight_mode is 'monitor', status stays 'delivered'

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        sender_child_id: user.id,
        type,
        content: content || null,
        media_key: mediaKey || null,
        media_duration_seconds: mediaDuration || null,
        status,
        delivered_at: status === 'delivered' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create message:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        type: message.type,
        content: message.content,
        status: message.status,
        createdAt: message.created_at,
      },
    });
  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
