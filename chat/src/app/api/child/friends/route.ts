import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/child/friends - List friends for current child
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'child') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get friendships where current child is either child_id or friend_child_id
    const { data: friendships } = await supabase
      .from('chat.friendships')
      .select(`
        id,
        child_id,
        friend_child_id,
        status,
        friend:chat.children!friend_child_id(id, username, display_name, avatar_id)
      `)
      .eq('child_id', user.id)
      .in('status', ['approved', 'pending']);

    // Get conversations for approved friends
    const approvedFriendIds = (friendships || [])
      .filter((f) => f.status === 'approved')
      .map((f) => f.friend_child_id);

    let conversationMap = new Map<string, string>();

    if (approvedFriendIds.length > 0) {
      const { data: conversations } = await supabase
        .from('chat.conversations')
        .select('id, child_a_id, child_b_id')
        .or(`child_a_id.eq.${user.id},child_b_id.eq.${user.id}`);

      (conversations || []).forEach((conv) => {
        const friendId = conv.child_a_id === user.id ? conv.child_b_id : conv.child_a_id;
        conversationMap.set(friendId, conv.id);
      });
    }

    // Transform data
    const friends = (friendships || []).map((f) => {
      const friend = f.friend as { id: string; username: string; display_name: string; avatar_id: string } | null;

      return {
        id: f.id,
        childId: f.friend_child_id,
        displayName: friend?.display_name || 'Unknown',
        username: friend?.username || 'unknown',
        avatarId: friend?.avatar_id || 'cat',
        conversationId: conversationMap.get(f.friend_child_id) || null,
        status: f.status,
      };
    });

    return NextResponse.json({ success: true, data: friends });
  } catch (error) {
    console.error('Friends fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/child/friends - Send friend request
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'child') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { friendChildId } = body;

    if (!friendChildId) {
      return NextResponse.json(
        { success: false, error: 'Friend ID is required' },
        { status: 400 }
      );
    }

    // Can't friend yourself
    if (friendChildId === user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot add yourself as a friend' },
        { status: 400 }
      );
    }

    // Check if friend exists
    const { data: friend } = await supabase
      .from('chat.children')
      .select('id')
      .eq('id', friendChildId)
      .single();

    if (!friend) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already friends or pending
    const { data: existing } = await supabase
      .from('chat.friendships')
      .select('id, status')
      .eq('child_id', user.id)
      .eq('friend_child_id', friendChildId)
      .single();

    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json(
          { success: false, error: 'Already friends' },
          { status: 400 }
        );
      }
      if (existing.status === 'pending') {
        return NextResponse.json(
          { success: false, error: 'Friend request already sent' },
          { status: 400 }
        );
      }
    }

    // Create friend request
    const { data: friendship, error } = await supabase
      .from('chat.friendships')
      .insert({
        child_id: user.id,
        friend_child_id: friendChildId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create friend request:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send friend request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: friendship.id,
        status: friendship.status,
      },
    });
  } catch (error) {
    console.error('Friend request error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
