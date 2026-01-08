import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('deebop-auth')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

// Default content preferences
const defaultPrefs = {
  hideAiGenerated: false,
  hideAiAssisted: false,
  hidePaidPartnership: false,
  hideSensitiveContent: false,
  boostNewsHeadlines: false,
  applyToDiscoveryFeed: false,
};

// GET /api/user/content-prefs - Get user's content preferences
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prefs = await prisma.userContentPrefs.findUnique({
      where: { userId: user.userId },
      select: {
        hideAiGenerated: true,
        hideAiAssisted: true,
        hidePaidPartnership: true,
        hideSensitiveContent: true,
        boostNewsHeadlines: true,
        applyToDiscoveryFeed: true,
      },
    });

    return NextResponse.json({
      preferences: prefs || defaultPrefs,
    });
  } catch (error) {
    console.error('Error fetching content prefs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content preferences' },
      { status: 500 }
    );
  }
}

// PATCH /api/user/content-prefs - Update content preferences
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const allowedFields = [
      'hideAiGenerated',
      'hideAiAssisted',
      'hidePaidPartnership',
      'hideSensitiveContent',
      'boostNewsHeadlines',
      'applyToDiscoveryFeed',
    ];

    // Filter to only allowed boolean fields
    const updates: Record<string, boolean> = {};
    for (const field of allowedFields) {
      if (typeof body[field] === 'boolean') {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const prefs = await prisma.userContentPrefs.upsert({
      where: { userId: user.userId },
      update: updates,
      create: {
        userId: user.userId,
        ...defaultPrefs,
        ...updates,
      },
      select: {
        hideAiGenerated: true,
        hideAiAssisted: true,
        hidePaidPartnership: true,
        hideSensitiveContent: true,
        boostNewsHeadlines: true,
        applyToDiscoveryFeed: true,
      },
    });

    return NextResponse.json({
      preferences: prefs,
      message: 'Preferences updated',
    });
  } catch (error) {
    console.error('Error updating content prefs:', error);
    return NextResponse.json(
      { error: 'Failed to update content preferences' },
      { status: 500 }
    );
  }
}
