import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';
import type { TimeoutDB, CreateTimeoutInput } from '@/types';

// Helper to convert DB format to API format
function formatTimeout(t: TimeoutDB) {
  return {
    id: t.id,
    parentId: t.parent_id,
    childId: t.child_id,
    conversationId: t.conversation_id,
    startAt: t.start_at,
    endAt: t.end_at,
    status: t.status,
    reason: t.reason,
    createdAt: t.created_at,
    endedBy: t.ended_by,
  };
}

// GET /api/parent/timeouts - List active/scheduled timeouts for parent's children
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all timeouts for this parent (scheduled or active)
    const { data: timeouts, error } = await supabase
      .from('timeouts')
      .select(`
        *,
        child:child_id(id, username, display_name, avatar_id)
      `)
      .eq('parent_id', user.id)
      .in('status', ['scheduled', 'active'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch timeouts:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch timeouts' },
        { status: 500 }
      );
    }

    // Update status of scheduled timeouts that should now be active
    const now = new Date().toISOString();
    const formattedTimeouts = (timeouts || []).map((t) => {
      // Check if scheduled timeout should now be active
      if (t.status === 'scheduled' && t.start_at <= now && t.end_at > now) {
        // Update in background
        supabase
          .from('timeouts')
          .update({ status: 'active' })
          .eq('id', t.id)
          .then(() => {});
        t.status = 'active';
      }
      // Check if active timeout should now be ended
      if ((t.status === 'scheduled' || t.status === 'active') && t.end_at <= now) {
        // Update in background
        supabase
          .from('timeouts')
          .update({ status: 'ended', ended_by: 'system' })
          .eq('id', t.id)
          .then(() => {});
        return null; // Filter out ended timeouts
      }
      return {
        ...formatTimeout(t),
        child: t.child ? {
          id: t.child.id,
          displayName: t.child.display_name,
          username: t.child.username,
          avatarId: t.child.avatar_id,
        } : null,
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: formattedTimeouts,
    });
  } catch (error) {
    console.error('Timeouts fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/parent/timeouts - Create a new timeout
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateTimeoutInput = await request.json();
    const { childId, conversationId, startIn, duration, reason } = body;

    // Validate required fields
    if (!childId || duration === undefined || startIn === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate duration (1-480 minutes = 8 hours max)
    if (duration < 1 || duration > 480) {
      return NextResponse.json(
        { success: false, error: 'Duration must be between 1 and 480 minutes' },
        { status: 400 }
      );
    }

    // Validate startIn (0-60 minutes)
    if (startIn < 0 || startIn > 60) {
      return NextResponse.json(
        { success: false, error: 'Start delay must be between 0 and 60 minutes' },
        { status: 400 }
      );
    }

    // Verify child belongs to this parent
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

    // If conversation specified, verify it exists and child is part of it
    if (conversationId) {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .or(`child_a_id.eq.${childId},child_b_id.eq.${childId}`)
        .single();

      if (!conversation) {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        );
      }
    }

    // Calculate start and end times
    const now = new Date();
    const startAt = new Date(now.getTime() + startIn * 60 * 1000);
    const endAt = new Date(startAt.getTime() + duration * 60 * 1000);

    // Determine initial status
    const status = startIn === 0 ? 'active' : 'scheduled';

    // Create the timeout
    const { data: timeout, error } = await supabase
      .from('timeouts')
      .insert({
        parent_id: user.id,
        child_id: childId,
        conversation_id: conversationId || null,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        status,
        reason: reason || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create timeout:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create timeout' },
        { status: 500 }
      );
    }

    // Log action
    await supabase.from('audit_log').insert({
      parent_id: user.id,
      child_id: childId,
      action: 'timeout_created',
      details: {
        timeoutId: timeout.id,
        duration,
        startIn,
        reason,
        conversationId: conversationId || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: formatTimeout(timeout),
    });
  } catch (error) {
    console.error('Timeout creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
