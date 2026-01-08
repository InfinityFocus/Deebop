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

// GET /api/users/me/notifications - Get notification preferences
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
        notifyLikes: true,
        notifyFollowers: true,
        notifyShares: true,
        notifyMentions: true,
        emailWeeklyDigest: true,
        emailProductUpdates: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      notifyLikes: user.notifyLikes,
      notifyFollowers: user.notifyFollowers,
      notifyShares: user.notifyShares,
      notifyMentions: user.notifyMentions,
      emailWeeklyDigest: user.emailWeeklyDigest,
      emailProductUpdates: user.emailProductUpdates,
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to get notification preferences' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/me/notifications - Update notification preferences
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
    const {
      notifyLikes,
      notifyFollowers,
      notifyShares,
      notifyMentions,
      emailWeeklyDigest,
      emailProductUpdates,
    } = body;

    const updateData: {
      notifyLikes?: boolean;
      notifyFollowers?: boolean;
      notifyShares?: boolean;
      notifyMentions?: boolean;
      emailWeeklyDigest?: boolean;
      emailProductUpdates?: boolean;
    } = {};

    if (typeof notifyLikes === 'boolean') {
      updateData.notifyLikes = notifyLikes;
    }
    if (typeof notifyFollowers === 'boolean') {
      updateData.notifyFollowers = notifyFollowers;
    }
    if (typeof notifyShares === 'boolean') {
      updateData.notifyShares = notifyShares;
    }
    if (typeof notifyMentions === 'boolean') {
      updateData.notifyMentions = notifyMentions;
    }
    if (typeof emailWeeklyDigest === 'boolean') {
      updateData.emailWeeklyDigest = emailWeeklyDigest;
    }
    if (typeof emailProductUpdates === 'boolean') {
      updateData.emailProductUpdates = emailProductUpdates;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        notifyLikes: true,
        notifyFollowers: true,
        notifyShares: true,
        notifyMentions: true,
        emailWeeklyDigest: true,
        emailProductUpdates: true,
      },
    });

    return NextResponse.json({
      notifyLikes: updated.notifyLikes,
      notifyFollowers: updated.notifyFollowers,
      notifyShares: updated.notifyShares,
      notifyMentions: updated.notifyMentions,
      emailWeeklyDigest: updated.emailWeeklyDigest,
      emailProductUpdates: updated.emailProductUpdates,
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
