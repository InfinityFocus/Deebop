import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

// POST /api/parent/approvals/[id] - Approve or deny a friend request or message
export async function POST(
  request: NextRequest,
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

    const { id } = await params;
    const body = await request.json();
    const { type, action } = body;

    if (!type || !action) {
      return NextResponse.json(
        { success: false, error: 'Type and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get all children IDs for this parent
    const { data: children } = await supabase
      .from('children')
      .select('id')
      .eq('parent_id', user.id);

    const childIds = (children || []).map((c) => c.id);

    if (type === 'friend_request') {
      // Verify ownership of friend request (either as sender's parent or recipient's parent)
      const { data: fr } = await supabase
        .from('friendships')
        .select('id, child_id, friend_child_id, status')
        .eq('id', id)
        .single();

      if (!fr) {
        return NextResponse.json(
          { success: false, error: 'Friend request not found' },
          { status: 404 }
        );
      }

      // Determine if this parent is the sender's parent or recipient's parent
      const isSenderParent = childIds.includes(fr.child_id);
      const isRecipientParent = childIds.includes(fr.friend_child_id);

      if (!isSenderParent && !isRecipientParent) {
        return NextResponse.json(
          { success: false, error: 'Friend request not found' },
          { status: 404 }
        );
      }

      // Validate the approval stage
      if (isSenderParent && fr.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'This request has already been processed' },
          { status: 400 }
        );
      }
      if (isRecipientParent && !isSenderParent && fr.status !== 'pending_recipient') {
        return NextResponse.json(
          { success: false, error: 'This request is not ready for your approval yet' },
          { status: 400 }
        );
      }

      if (action === 'approve') {
        if (isSenderParent && fr.status === 'pending') {
          // Stage 1: Sender's parent approves → move to pending_recipient
          await supabase
            .from('friendships')
            .update({
              status: 'pending_recipient',
              approved_at: new Date().toISOString(),
              approved_by_parent_id: user.id,
            })
            .eq('id', id);

          // Log action
          await supabase.from('audit_log').insert({
            parent_id: user.id,
            child_id: fr.child_id,
            action: 'friend_request_approved_by_sender_parent',
            details: { friendshipId: id, friendChildId: fr.friend_child_id },
          });
        } else if (isRecipientParent && (fr.status === 'pending_recipient' || (isSenderParent && fr.status === 'pending'))) {
          // Stage 2: Recipient's parent approves → fully approved
          // (Also handles case where both children have same parent)
          await supabase
            .from('friendships')
            .update({
              status: 'approved',
              approved_by_recipient_parent_id: user.id,
              // If sender's parent hasn't approved yet (same parent case), set that too
              ...(fr.status === 'pending' ? {
                approved_at: new Date().toISOString(),
                approved_by_parent_id: user.id,
              } : {}),
            })
            .eq('id', id);

          // Create reciprocal friendship
          await supabase
            .from('friendships')
            .upsert({
              child_id: fr.friend_child_id,
              friend_child_id: fr.child_id,
              status: 'approved',
              approved_at: new Date().toISOString(),
              approved_by_parent_id: user.id,
            });

          // Create conversation
          const childA = fr.child_id < fr.friend_child_id ? fr.child_id : fr.friend_child_id;
          const childB = fr.child_id < fr.friend_child_id ? fr.friend_child_id : fr.child_id;

          await supabase
            .from('conversations')
            .upsert({
              child_a_id: childA,
              child_b_id: childB,
            }, {
              onConflict: 'child_a_id,child_b_id',
            });

          // Log action
          await supabase.from('audit_log').insert({
            parent_id: user.id,
            child_id: fr.friend_child_id,
            action: 'friend_request_approved_by_recipient_parent',
            details: { friendshipId: id, senderChildId: fr.child_id },
          });
        }
      } else {
        // Deny - block the request (either parent can deny)
        await supabase
          .from('friendships')
          .update({ status: 'blocked' })
          .eq('id', id);

        // Log action
        const childIdForLog = isSenderParent ? fr.child_id : fr.friend_child_id;
        await supabase.from('audit_log').insert({
          parent_id: user.id,
          child_id: childIdForLog,
          action: 'friend_request_denied',
          details: { friendshipId: id, deniedBy: isSenderParent ? 'sender_parent' : 'recipient_parent' },
        });
      }
    } else if (type === 'message') {
      // Get message with conversation details
      const { data: message } = await supabase
        .from('messages')
        .select('id, sender_child_id, conversation_id, status')
        .eq('id', id)
        .single();

      if (!message) {
        return NextResponse.json(
          { success: false, error: 'Message not found' },
          { status: 404 }
        );
      }

      // Get conversation to determine recipient
      const { data: conversation } = await supabase
        .from('conversations')
        .select('child_a_id, child_b_id')
        .eq('id', message.conversation_id)
        .single();

      if (!conversation) {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        );
      }

      const recipientId = conversation.child_a_id === message.sender_child_id
        ? conversation.child_b_id
        : conversation.child_a_id;

      // Determine if this parent is sender's parent or recipient's parent
      const isSenderParent = childIds.includes(message.sender_child_id);
      const isRecipientParent = childIds.includes(recipientId);

      if (!isSenderParent && !isRecipientParent) {
        return NextResponse.json(
          { success: false, error: 'Message not found' },
          { status: 404 }
        );
      }

      // Validate the approval stage
      if (isSenderParent && message.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'This message has already been processed' },
          { status: 400 }
        );
      }
      if (isRecipientParent && !isSenderParent && message.status !== 'pending_recipient') {
        return NextResponse.json(
          { success: false, error: 'This message is not ready for your approval yet' },
          { status: 400 }
        );
      }

      if (action === 'approve') {
        if (isSenderParent && message.status === 'pending') {
          // Stage 1: Sender's parent approves
          // Check if recipient's parent also needs to approve
          const { data: recipientChild } = await supabase
            .from('children')
            .select('oversight_mode')
            .eq('id', recipientId)
            .single();

          const recipientOversightMode = recipientChild?.oversight_mode || 'approve_first';
          let recipientNeedsApproval = false;

          if (recipientOversightMode === 'approve_all') {
            recipientNeedsApproval = true;
          } else if (recipientOversightMode === 'approve_first') {
            // Check if first message from this sender to recipient
            const { data: existingMessages } = await supabase
              .from('messages')
              .select('id')
              .eq('conversation_id', message.conversation_id)
              .eq('sender_child_id', message.sender_child_id)
              .in('status', ['delivered', 'approved'])
              .limit(1);

            if (!existingMessages || existingMessages.length === 0) {
              recipientNeedsApproval = true;
            }
          }

          const newStatus = recipientNeedsApproval ? 'pending_recipient' : 'delivered';
          await supabase
            .from('messages')
            .update({
              status: newStatus,
              approved_by_sender_parent_id: user.id,
              delivered_at: newStatus === 'delivered' ? new Date().toISOString() : null,
            })
            .eq('id', id);

          // Log action
          await supabase.from('audit_log').insert({
            parent_id: user.id,
            child_id: message.sender_child_id,
            action: 'message_approved_by_sender_parent',
            details: { messageId: id, conversationId: message.conversation_id, nextStatus: newStatus },
          });
        } else if (isRecipientParent && (message.status === 'pending_recipient' || (isSenderParent && message.status === 'pending'))) {
          // Stage 2: Recipient's parent approves → fully delivered
          // (Also handles case where both children have same parent)
          await supabase
            .from('messages')
            .update({
              status: 'delivered',
              approved_by_recipient_parent_id: user.id,
              delivered_at: new Date().toISOString(),
              // If sender's parent hasn't approved yet (same parent case), set that too
              ...(message.status === 'pending' ? {
                approved_by_sender_parent_id: user.id,
              } : {}),
            })
            .eq('id', id);

          // Log action
          await supabase.from('audit_log').insert({
            parent_id: user.id,
            child_id: recipientId,
            action: 'message_approved_by_recipient_parent',
            details: { messageId: id, conversationId: message.conversation_id, senderChildId: message.sender_child_id },
          });
        }

        // Log approval record
        await supabase.from('approvals').insert({
          message_id: id,
          parent_id: user.id,
          decision: 'approved',
        });
      } else {
        // Deny - either parent can deny
        await supabase
          .from('messages')
          .update({ status: 'denied' })
          .eq('id', id);

        // Log approval record
        await supabase.from('approvals').insert({
          message_id: id,
          parent_id: user.id,
          decision: 'denied',
        });

        // Log action
        const childIdForLog = isSenderParent ? message.sender_child_id : recipientId;
        await supabase.from('audit_log').insert({
          parent_id: user.id,
          child_id: childIdForLog,
          action: 'message_denied',
          details: { messageId: id, deniedBy: isSenderParent ? 'sender_parent' : 'recipient_parent' },
        });
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approval action error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
