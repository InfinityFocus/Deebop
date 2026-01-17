import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { checkParentHasAccess } from '@/lib/db';

// GET /api/parent/subscription/access - Quick access check
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const access = await checkParentHasAccess(user.id);

    return NextResponse.json({
      success: true,
      data: access,
    });
  } catch (error) {
    console.error('Subscription access check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
