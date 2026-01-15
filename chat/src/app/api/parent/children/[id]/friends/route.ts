import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/parent/children/[id]/friends - Get child's friends list
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

    // Get all friendships for this child
    const { data: friendships } = await supabase
      .from('friendships')
      .select('id, child_id, friend_child_id, status, requested_at, approved_at')
      .eq('child_id', childId)
      .in('status', ['approved', 'pending', 'pending_recipient']);

    // Get friend details
    const friendChildIds = (friendships || []).map((f) => f.friend_child_id);
    const { data: friendDetails } = friendChildIds.length > 0
      ? await supabase
          .from('children')
          .select('id, username, display_name, avatar_id, parent_id')
          .in('id', friendChildIds)
      : { data: [] };

    const friendMap = new Map((friendDetails || []).map((f) => [f.id, f]));

    // Get parent names for friends
    const parentIds = [...new Set((friendDetails || []).map((f) => f.parent_id))];
    const { data: parents } = parentIds.length > 0
      ? await supabase
          .from('parents')
          .select('id, display_name, email')
          .in('id', parentIds)
      : { data: [] };

    const parentMap = new Map((parents || []).map((p) => [p.id, p]));

    // Transform data
    const friends = (friendships || []).map((f) => {
      const friend = friendMap.get(f.friend_child_id);
      const friendParent = friend ? parentMap.get(friend.parent_id) : null;

      return {
        friendshipId: f.id,
        childId: f.friend_child_id,
        displayName: friend?.display_name || 'Unknown',
        username: friend?.username || 'unknown',
        avatarId: friend?.avatar_id || 'cat',
        status: f.status,
        requestedAt: f.requested_at,
        approvedAt: f.approved_at,
        parentName: friendParent?.display_name || friendParent?.email || 'Unknown Parent',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        childId,
        childName: child.display_name,
        friends,
      },
    });
  } catch (error) {
    console.error('Friends fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/parent/children/[id]/friends - Remove a friend
export async function DELETE(
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

    const { id: childId } = await params;
    const { friendshipId } = await request.json();

    if (!friendshipId) {
      return NextResponse.json(
        { success: false, error: 'Friendship ID is required' },
        { status: 400 }
      );
    }

    // Verify this child belongs to the parent
    const { data: child } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', user.id)
      .single();

    if (!child) {
      return NextResponse.json(
        { success: false, error: 'Child not found' },
        { status: 404 }
      );
    }

    // Verify this friendship belongs to the child
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id, friend_child_id')
      .eq('id', friendshipId)
      .eq('child_id', childId)
      .single();

    if (!friendship) {
      return NextResponse.json(
        { success: false, error: 'Friendship not found' },
        { status: 404 }
      );
    }

    // Delete both directions of the friendship
    await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    // Delete reciprocal friendship
    await supabase
      .from('friendships')
      .delete()
      .eq('child_id', friendship.friend_child_id)
      .eq('friend_child_id', childId);

    // Log action
    await supabase.from('audit_log').insert({
      parent_id: user.id,
      child_id: childId,
      action: 'friend_removed',
      details: { friendshipId, friendChildId: friendship.friend_child_id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Friend removal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
