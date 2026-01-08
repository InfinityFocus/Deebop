import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function getUserId(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch {
    return null;
  }
}

// GET /api/users/me/preferences - Get user preferences
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        doomScrollPreference: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      doomScrollPreference: user.doomScrollPreference,
    });
  } catch (error) {
    console.error('Get user preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to get user preferences' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/me/preferences - Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { doomScrollPreference } = body;

    // Validate doom scroll preference value
    const validPreferences = ['on', 'reduced', 'off'];
    if (doomScrollPreference && !validPreferences.includes(doomScrollPreference)) {
      return NextResponse.json(
        { error: 'Invalid doomScrollPreference value. Must be: on, reduced, or off' },
        { status: 400 }
      );
    }

    const updateData: { doomScrollPreference?: string } = {};

    if (doomScrollPreference) {
      updateData.doomScrollPreference = doomScrollPreference;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        doomScrollPreference: true,
      },
    });

    return NextResponse.json({
      doomScrollPreference: updated.doomScrollPreference,
    });
  } catch (error) {
    console.error('Update user preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    );
  }
}
