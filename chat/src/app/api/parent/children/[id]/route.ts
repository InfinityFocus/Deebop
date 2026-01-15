import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/parent/children/[id] - Get a specific child
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

    const { id } = await params;

    const { data: child, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', id)
      .eq('parent_id', user.id)
      .single();

    if (error || !child) {
      return NextResponse.json(
        { success: false, error: 'Child not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: child.id,
        parentId: child.parent_id,
        username: child.username,
        displayName: child.display_name,
        avatarId: child.avatar_id,
        ageBand: child.age_band,
        oversightMode: child.oversight_mode,
        messagingPaused: child.messaging_paused,
        quietHoursStart: child.quiet_hours_start,
        quietHoursEnd: child.quiet_hours_end,
        createdAt: child.created_at,
      },
    });
  } catch (error) {
    console.error('Child fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/parent/children/[id] - Update a child
export async function PATCH(
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

    // Verify ownership
    const { data: existing } = await supabase
      .from('children')
      .select('id')
      .eq('id', id)
      .eq('parent_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Child not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (body.displayName !== undefined) updates.display_name = body.displayName;
    if (body.avatarId !== undefined) updates.avatar_id = body.avatarId;
    if (body.ageBand !== undefined) updates.age_band = body.ageBand;
    if (body.oversightMode !== undefined) updates.oversight_mode = body.oversightMode;
    if (body.messagingPaused !== undefined) updates.messaging_paused = body.messagingPaused;
    if (body.quietHoursStart !== undefined) updates.quiet_hours_start = body.quietHoursStart;
    if (body.quietHoursEnd !== undefined) updates.quiet_hours_end = body.quietHoursEnd;

    const { data: child, error } = await supabase
      .from('children')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update child:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update' },
        { status: 500 }
      );
    }

    // Log action
    await supabase.from('audit_log').insert({
      parent_id: user.id,
      child_id: id,
      action: 'child_updated',
      details: updates,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: child.id,
        parentId: child.parent_id,
        username: child.username,
        displayName: child.display_name,
        avatarId: child.avatar_id,
        ageBand: child.age_band,
        oversightMode: child.oversight_mode,
        messagingPaused: child.messaging_paused,
        quietHoursStart: child.quiet_hours_start,
        quietHoursEnd: child.quiet_hours_end,
        createdAt: child.created_at,
      },
    });
  } catch (error) {
    console.error('Child update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/parent/children/[id] - Delete a child account
export async function DELETE(
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

    const { id } = await params;

    // Verify ownership
    const { data: existing } = await supabase
      .from('children')
      .select('id, username, display_name')
      .eq('id', id)
      .eq('parent_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Child not found' },
        { status: 404 }
      );
    }

    // Log action before deletion
    await supabase.from('audit_log').insert({
      parent_id: user.id,
      child_id: id,
      action: 'child_deleted',
      details: { username: existing.username, displayName: existing.display_name },
    });

    // Delete child (cascades to messages, friendships, etc.)
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete child:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Child deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
