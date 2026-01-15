import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/parent/children/check-username?username=xxx
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
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

    // Check if username exists
    const { data: existing } = await supabase
      .from('children')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    return NextResponse.json({
      success: true,
      available: !existing,
    });
  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
