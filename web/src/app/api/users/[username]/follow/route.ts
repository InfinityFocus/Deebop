import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/users/[username]/follow - Toggle follow
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

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true, isPrivate: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: targetUser.id,
          },
        },
      });

      // Update counts
      await prisma.user.update({
        where: { id: user.id },
        data: { followingCount: { decrement: 1 } },
      });
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { followersCount: { decrement: 1 } },
      });

      return NextResponse.json({ following: false });
    } else {
      // Check if private account - create follow request instead
      if (targetUser.isPrivate) {
        // Check for existing request
        const existingRequest = await prisma.followRequest.findUnique({
          where: {
            requesterId_targetId: {
              requesterId: user.id,
              targetId: targetUser.id,
            },
          },
        });

        if (existingRequest) {
          // Cancel request
          await prisma.followRequest.delete({
            where: { id: existingRequest.id },
          });
          return NextResponse.json({ following: false, requested: false });
        }

        // Create follow request
        await prisma.followRequest.create({
          data: {
            requesterId: user.id,
            targetId: targetUser.id,
          },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: targetUser.id,
            type: 'follow_request',
            actorId: user.id,
          },
        });

        return NextResponse.json({ following: false, requested: true });
      }

      // Follow directly
      await prisma.follow.create({
        data: {
          followerId: user.id,
          followingId: targetUser.id,
        },
      });

      // Update counts
      await prisma.user.update({
        where: { id: user.id },
        data: { followingCount: { increment: 1 } },
      });
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { followersCount: { increment: 1 } },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          type: 'follow',
          actorId: user.id,
        },
      });

      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Failed to toggle follow' }, { status: 500 });
  }
}
