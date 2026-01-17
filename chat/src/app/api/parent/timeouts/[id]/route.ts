import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';
import type { TimeoutDB } from '@/types';

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

// PATCH /api/parent/timeouts/[id] - Update timeout (extend or end early)
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
    const { action, extendMinutes } = body as { action: 'extend' | 'end'; extendMinutes?: number };

    // Validate action
    if (!['extend', 'end'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "extend" or "end"' },
        { status: 400 }
      );
    }

    // Get existing timeout and verify ownership
    const { data: existing } = await supabase
      .from('timeouts')
      .select('*')
      .eq('id', id)
      .eq('parent_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Timeout not found' },
        { status: 404 }
      );
    }

    // Check timeout is active or scheduled
    if (!['scheduled', 'active'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Timeout is not active' },
        { status: 400 }
      );
    }

    let updates: Record<string, unknown> = {};

    if (action === 'end') {
      // End the timeout early
      updates = {
        status: 'ended',
        ended_by: 'parent',
        end_at: new Date().toISOString(),
      };
    } else if (action === 'extend') {
      // Extend the timeout
      if (!extendMinutes || extendMinutes < 1 || extendMinutes > 480) {
        return NextResponse.json(
          { success: false, error: 'Extend minutes must be between 1 and 480' },
          { status: 400 }
        );
      }

      const currentEndAt = new Date(existing.end_at);
      const newEndAt = new Date(currentEndAt.getTime() + extendMinutes * 60 * 1000);

      updates = {
        end_at: newEndAt.toISOString(),
      };
    }

    const { data: timeout, error } = await supabase
      .from('timeouts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update timeout:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update timeout' },
        { status: 500 }
      );
    }

    // Log action
    await supabase.from('audit_log').insert({
      parent_id: user.id,
      child_id: existing.child_id,
      action: action === 'end' ? 'timeout_ended_early' : 'timeout_extended',
      details: {
        timeoutId: id,
        extendMinutes: action === 'extend' ? extendMinutes : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: formatTimeout(timeout),
    });
  } catch (error) {
    console.error('Timeout update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/parent/timeouts/[id] - Cancel a scheduled timeout
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

    // Get existing timeout and verify ownership
    const { data: existing } = await supabase
      .from('timeouts')
      .select('*')
      .eq('id', id)
      .eq('parent_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Timeout not found' },
        { status: 404 }
      );
    }

    // Check timeout is still scheduled or active
    if (!['scheduled', 'active'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Timeout is not active' },
        { status: 400 }
      );
    }

    // Cancel the timeout
    const { error } = await supabase
      .from('timeouts')
      .update({
        status: 'cancelled',
        ended_by: 'parent',
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to cancel timeout:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to cancel timeout' },
        { status: 500 }
      );
    }

    // Log action
    await supabase.from('audit_log').insert({
      parent_id: user.id,
      child_id: existing.child_id,
      action: 'timeout_cancelled',
      details: { timeoutId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Timeout cancellation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
