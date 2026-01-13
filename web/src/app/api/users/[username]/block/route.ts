import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/users/[username]/block - Toggle block
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
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    // Check if already blocked
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: targetUser.id,
        },
      },
    });

    if (existingBlock) {
      // Unblock
      await prisma.block.delete({
        where: {
          blockerId_blockedId: {
            blockerId: user.id,
            blockedId: targetUser.id,
          },
        },
      });

      return NextResponse.json({ blocked: false });
    } else {
      // Block user
      await prisma.block.create({
        data: {
          blockerId: user.id,
          blockedId: targetUser.id,
        },
      });

      // Also remove any follow relationship in both directions
      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: user.id, followingId: targetUser.id },
            { followerId: targetUser.id, followingId: user.id },
          ],
        },
      });

      // Update follow counts
      const [existingFollowToTarget, existingFollowFromTarget] = await Promise.all([
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: user.id,
              followingId: targetUser.id,
            },
          },
        }),
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: targetUser.id,
              followingId: user.id,
            },
          },
        }),
      ]);

      // Batch update counts
      const updates = [];
      if (existingFollowToTarget) {
        updates.push(
          prisma.user.update({
            where: { id: user.id },
            data: { followingCount: { decrement: 1 } },
          }),
          prisma.user.update({
            where: { id: targetUser.id },
            data: { followersCount: { decrement: 1 } },
          })
        );
      }
      if (existingFollowFromTarget) {
        updates.push(
          prisma.user.update({
            where: { id: targetUser.id },
            data: { followingCount: { decrement: 1 } },
          }),
          prisma.user.update({
            where: { id: user.id },
            data: { followersCount: { decrement: 1 } },
          })
        );
      }

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      // Delete any pending follow requests
      await prisma.followRequest.deleteMany({
        where: {
          OR: [
            { requesterId: user.id, targetId: targetUser.id },
            { requesterId: targetUser.id, targetId: user.id },
          ],
        },
      });

      return NextResponse.json({ blocked: true });
    }
  } catch (error) {
    console.error('Block error:', error);
    return NextResponse.json({ error: 'Failed to toggle block' }, { status: 500 });
  }
}

// GET /api/users/[username]/block - Check if user is blocked
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: targetUser.id,
        },
      },
    });

    return NextResponse.json({ blocked: !!block });
  } catch (error) {
    console.error('Check block error:', error);
    return NextResponse.json({ error: 'Failed to check block status' }, { status: 500 });
  }
}
