import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/child/friends/search?username=xxx
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'child') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username required' },
        { status: 400 }
      );
    }

    // Find user by username
    const { data: child } = await supabase
      .from('chat.children')
      .select('id, username, display_name, avatar_id')
      .eq('username', username.toLowerCase())
      .single();

    if (!child) {
      return NextResponse.json({ success: true, data: null });
    }

    // Can't find yourself
    if (child.id === user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot add yourself as a friend' },
        { status: 400 }
      );
    }

    // Check if already friends or has pending request
    const { data: existing } = await supabase
      .from('chat.friendships')
      .select('id, status')
      .eq('child_id', user.id)
      .eq('friend_child_id', child.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        id: child.id,
        username: child.username,
        displayName: child.display_name,
        avatarId: child.avatar_id,
        isAlreadyFriend: existing?.status === 'approved',
        hasPendingRequest: existing?.status === 'pending',
      },
    });
  } catch (error) {
    console.error('Friend search error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
