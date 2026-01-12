import { NextRequest, NextResponse } from 'next/server';
import { getIdentity, getIdentityProfiles, createProfile, PROFILE_LIMITS } from '@/lib/auth';

// GET /api/profiles - Get all profiles for the current identity
export async function GET() {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const profiles = await getIdentityProfiles();
    const limit = PROFILE_LIMITS[identity.tier as keyof typeof PROFILE_LIMITS] || 1;

    return NextResponse.json({
      profiles,
      tier: identity.tier,
      limit,
      canAddMore: profiles.length < limit,
    });
  } catch (error) {
    console.error('Get profiles error:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}

// POST /api/profiles - Create a new profile
export async function POST(request: NextRequest) {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { username, displayName } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username.toLowerCase())) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters, lowercase letters, numbers, and underscores only' },
        { status: 400 }
      );
    }

    const profile = await createProfile(username, displayName);

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        isDefault: profile.isDefault,
      },
    });
  } catch (error) {
    console.error('Create profile error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create profile' },
      { status: 400 }
    );
  }
}
