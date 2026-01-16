import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { getAllChildren } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const ageBand = searchParams.get('ageBand') || undefined;
    const oversightMode = searchParams.get('oversightMode') || undefined;
    const messagingPausedParam = searchParams.get('messagingPaused');
    const messagingPaused = messagingPausedParam === 'true' ? true : messagingPausedParam === 'false' ? false : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await getAllChildren(
      { search, ageBand, oversightMode, messagingPaused },
      page,
      limit
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Admin children error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch children' },
      { status: 500 }
    );
  }
}
