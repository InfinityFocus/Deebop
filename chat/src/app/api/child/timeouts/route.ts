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

// GET /api/child/timeouts - Get active timeout affecting this child
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'child') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const now = new Date().toISOString();

    // Query for active timeouts affecting this child
    // Either global (conversation_id IS NULL) or for the specific conversation
    let query = supabase
      .from('timeouts')
      .select('*')
      .eq('child_id', user.id)
      .in('status', ['scheduled', 'active'])
      .lte('start_at', now) // Has started
      .gt('end_at', now); // Has not ended

    const { data: timeouts, error } = await query.order('start_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch timeouts:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch timeout status' },
        { status: 500 }
      );
    }

    // Update status of scheduled timeouts to active
    for (const t of timeouts || []) {
      if (t.status === 'scheduled') {
        await supabase
          .from('timeouts')
          .update({ status: 'active' })
          .eq('id', t.id);
        t.status = 'active';
      }
    }

    // Find the most restrictive timeout that applies
    // Priority: specific conversation timeout > global timeout
    let activeTimeout: TimeoutDB | null = null;

    for (const t of timeouts || []) {
      // If we have a conversation ID, check if this timeout applies
      if (conversationId) {
        if (t.conversation_id === conversationId || t.conversation_id === null) {
          // Prefer specific conversation timeout over global
          if (!activeTimeout || (t.conversation_id !== null && activeTimeout.conversation_id === null)) {
            activeTimeout = t;
          }
          // If both are same type, use earliest end time
          if (activeTimeout && t.conversation_id === activeTimeout.conversation_id) {
            if (new Date(t.end_at) < new Date(activeTimeout.end_at)) {
              activeTimeout = t;
            }
          }
        }
      } else {
        // No conversation specified, just check for any global timeout
        if (t.conversation_id === null) {
          if (!activeTimeout || new Date(t.end_at) < new Date(activeTimeout.end_at)) {
            activeTimeout = t;
          }
        }
      }
    }

    // Also check for upcoming countdown (scheduled but not yet started)
    const { data: upcomingTimeouts } = await supabase
      .from('timeouts')
      .select('*')
      .eq('child_id', user.id)
      .eq('status', 'scheduled')
      .gt('start_at', now)
      .order('start_at', { ascending: true })
      .limit(1);

    const upcomingTimeout = upcomingTimeouts?.[0] || null;
    const showCountdown = upcomingTimeout && (
      !conversationId ||
      upcomingTimeout.conversation_id === null ||
      upcomingTimeout.conversation_id === conversationId
    );

    return NextResponse.json({
      success: true,
      data: {
        // Active timeout (chat is locked)
        activeTimeout: activeTimeout ? formatTimeout(activeTimeout) : null,
        // Upcoming timeout (show countdown banner)
        upcomingTimeout: showCountdown ? formatTimeout(upcomingTimeout) : null,
        // Simple boolean for quick checks
        isPaused: activeTimeout !== null,
      },
    });
  } catch (error) {
    console.error('Timeout status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
