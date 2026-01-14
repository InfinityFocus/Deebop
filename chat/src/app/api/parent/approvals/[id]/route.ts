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
      .from('chat.children')
      .select('id')
      .eq('parent_id', user.id);

    const childIds = (children || []).map((c) => c.id);

    if (type === 'friend_request') {
      // Verify ownership of friend request
      const { data: fr } = await supabase
        .from('chat.friendships')
        .select('id, child_id, friend_child_id')
        .eq('id', id)
        .single();

      if (!fr || !childIds.includes(fr.child_id)) {
        return NextResponse.json(
          { success: false, error: 'Friend request not found' },
          { status: 404 }
        );
      }

      if (action === 'approve') {
        // Update friendship status
        await supabase
          .from('chat.friendships')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by_parent_id: user.id,
          })
          .eq('id', id);

        // Create reciprocal friendship
        await supabase
          .from('chat.friendships')
          .upsert({
            child_id: fr.friend_child_id,
            friend_child_id: fr.child_id,
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by_parent_id: user.id,
          });

        // Create conversation if it doesn't exist
        const childA = fr.child_id < fr.friend_child_id ? fr.child_id : fr.friend_child_id;
        const childB = fr.child_id < fr.friend_child_id ? fr.friend_child_id : fr.child_id;

        await supabase
          .from('chat.conversations')
          .upsert({
            child_a_id: childA,
            child_b_id: childB,
          }, {
            onConflict: 'child_a_id,child_b_id',
          });
      } else {
        // Deny - block the request
        await supabase
          .from('chat.friendships')
          .update({ status: 'blocked' })
          .eq('id', id);
      }

      // Log action
      await supabase.from('chat.audit_log').insert({
        parent_id: user.id,
        child_id: fr.child_id,
        action: action === 'approve' ? 'friend_request_approved' : 'friend_request_denied',
        details: { friendshipId: id, friendChildId: fr.friend_child_id },
      });
    } else if (type === 'message') {
      // Verify ownership of message
      const { data: message } = await supabase
        .from('chat.messages')
        .select('id, sender_child_id, conversation_id')
        .eq('id', id)
        .single();

      if (!message || !childIds.includes(message.sender_child_id)) {
        return NextResponse.json(
          { success: false, error: 'Message not found' },
          { status: 404 }
        );
      }

      // Update message status
      const newStatus = action === 'approve' ? 'delivered' : 'denied';
      await supabase
        .from('chat.messages')
        .update({
          status: newStatus,
          delivered_at: action === 'approve' ? new Date().toISOString() : null,
        })
        .eq('id', id);

      // Log approval
      await supabase.from('chat.approvals').insert({
        message_id: id,
        parent_id: user.id,
        decision: action === 'approve' ? 'approved' : 'denied',
      });

      // Log action
      await supabase.from('chat.audit_log').insert({
        parent_id: user.id,
        child_id: message.sender_child_id,
        action: action === 'approve' ? 'message_approved' : 'message_denied',
        details: { messageId: id, conversationId: message.conversation_id },
      });
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
