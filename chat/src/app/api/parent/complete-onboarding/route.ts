import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

// POST /api/parent/complete-onboarding - Mark onboarding as complete
export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update parent's onboarding status
    const { error } = await supabase
      .from('parents')
      .update({ onboarding_completed: true })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to complete onboarding:', error);
      // Don't fail - let them proceed to dashboard anyway
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
