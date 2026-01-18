import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

/**
 * POST /api/child/heartbeat
 * Updates last_seen_at and sets is_online=true for the current child
 * Called every 60 seconds while the child is active
 * Also called on visibility change (tab becomes visible)
 */
export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'child') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update last_seen_at and is_online
    const { error } = await supabase
      .from('children')
      .update({
        last_seen_at: new Date().toISOString(),
        is_online: true,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Heartbeat update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update presence' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
