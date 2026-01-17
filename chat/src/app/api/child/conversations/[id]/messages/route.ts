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
    const { type, content, mediaKey, mediaUrl, mediaDuration } = body;

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

    // Get sender child details
    const { data: senderChild } = await supabase
      .from('children')
      .select('messaging_paused, oversight_mode, parent_id')
      .eq('id', user.id)
      .single();

    if (senderChild?.messaging_paused) {
      return NextResponse.json(
        { success: false, error: 'Messaging is paused for your account' },
        { status: 403 }
      );
    }

    // Check for active timeout on sender (either for this conversation or all chats)
    const now = new Date().toISOString();
    const { data: senderTimeout } = await supabase
      .from('timeouts')
      .select('id, reason')
      .eq('child_id', user.id)
      .in('status', ['scheduled', 'active'])
      .lte('start_at', now)
      .gt('end_at', now)
      .or(`conversation_id.is.null,conversation_id.eq.${id}`)
      .limit(1)
      .single();

    if (senderTimeout) {
      return NextResponse.json(
        { success: false, error: 'Chat is paused', code: 'TIMEOUT_ACTIVE' },
        { status: 403 }
      );
    }

    // Get recipient child details
    const recipientId = conversation.child_a_id === user.id
      ? conversation.child_b_id
      : conversation.child_a_id;

    // Check for active timeout on recipient (they're taking a break)
    const { data: recipientTimeout } = await supabase
      .from('timeouts')
      .select('id, reason')
      .eq('child_id', recipientId)
      .in('status', ['scheduled', 'active'])
      .lte('start_at', now)
      .gt('end_at', now)
      .or(`conversation_id.is.null,conversation_id.eq.${id}`)
      .limit(1)
      .single();

    if (recipientTimeout) {
      return NextResponse.json(
        { success: false, error: 'Your friend is taking a break', code: 'FRIEND_TIMEOUT' },
        { status: 403 }
      );
    }

    const { data: recipientChild } = await supabase
      .from('children')
      .select('oversight_mode, parent_id')
      .eq('id', recipientId)
      .single();

    // Determine message status based on BOTH children's oversight modes
    let status: 'pending' | 'pending_recipient' | 'delivered' = 'delivered';
    const senderOversightMode = senderChild?.oversight_mode || 'approve_first';
    const recipientOversightMode = recipientChild?.oversight_mode || 'approve_first';

    // Check if sender's parent needs to approve first
    let senderParentNeedsApproval = false;
    if (senderOversightMode === 'approve_all') {
      senderParentNeedsApproval = true;
    } else if (senderOversightMode === 'approve_first') {
      // Check if this is first message from sender to this friend
      const { data: existingSentMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', id)
        .eq('sender_child_id', user.id)
        .in('status', ['delivered', 'approved'])
        .limit(1);

      if (!existingSentMessages || existingSentMessages.length === 0) {
        senderParentNeedsApproval = true;
      }
    }

    // Check if recipient's parent needs to approve
    let recipientParentNeedsApproval = false;
    if (recipientOversightMode === 'approve_all') {
      recipientParentNeedsApproval = true;
    } else if (recipientOversightMode === 'approve_first') {
      // Check if this is first message received from this sender
      const { data: existingReceivedMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', id)
        .eq('sender_child_id', user.id)
        .in('status', ['delivered', 'approved'])
        .limit(1);

      if (!existingReceivedMessages || existingReceivedMessages.length === 0) {
        recipientParentNeedsApproval = true;
      }
    }

    // Set initial status based on approval requirements
    if (senderParentNeedsApproval) {
      status = 'pending'; // Waiting for sender's parent
    } else if (recipientParentNeedsApproval) {
      status = 'pending_recipient'; // Sender's parent done, waiting for recipient's parent
    }
    // If neither needs approval (both in monitor mode), status stays 'delivered'

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        sender_child_id: user.id,
        type,
        content: content || null,
        media_key: mediaKey || null,
        media_url: mediaUrl || null,
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
