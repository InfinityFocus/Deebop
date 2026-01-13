import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/users/[username]/remove-follower - Remove someone from your followers
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the follower to remove
    const follower = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!follower) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (follower.id === user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
    }

    // Check if they actually follow you
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: user.id,
        },
      },
    });

    if (!existingFollow) {
      return NextResponse.json({ error: 'User is not following you' }, { status: 400 });
    }

    // Remove them as a follower
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: user.id,
        },
      },
    });

    // Update counts
    await Promise.all([
      prisma.user.update({
        where: { id: follower.id },
        data: { followingCount: { decrement: 1 } },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { followersCount: { decrement: 1 } },
      }),
    ]);

    // No notification - they shouldn't know they were removed

    return NextResponse.json({ removed: true });
  } catch (error) {
    console.error('Remove follower error:', error);
    return NextResponse.json({ error: 'Failed to remove follower' }, { status: 500 });
  }
}
