import { NextRequest, NextResponse } from 'next/server';
import { switchProfile, getAuthCookie, verifyToken } from '@/lib/auth';

// POST /api/auth/switch-profile - Switch to a different profile
export async function POST(request: NextRequest) {
  try {
    const token = await getAuthCookie();
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { profileId } = body;

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const profile = await switchProfile(profileId);

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Switch profile error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to switch profile' },
      { status: 400 }
    );
  }
}
