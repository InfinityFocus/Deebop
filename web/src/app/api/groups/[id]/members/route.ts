import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/groups/[id]/members - Add members to group
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { user_ids } = body;

    if (!user_ids?.length) {
      return NextResponse.json({ error: 'user_ids is required' }, { status: 400 });
    }

    // Check ownership
    const group = await prisma.audienceGroup.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate all user_ids are followers
    const validFollowers = await prisma.follow.findMany({
      where: {
        followingId: user.id,
        followerId: { in: user_ids },
      },
      select: { followerId: true },
    });

    const validFollowerIds = validFollowers.map((f) => f.followerId);
    const invalidIds = user_ids.filter((userId: string) => !validFollowerIds.includes(userId));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: 'Some users are not your followers' },
        { status: 400 }
      );
    }

    // Get existing members to avoid duplicates
    const existingMembers = await prisma.audienceGroupMember.findMany({
      where: {
        groupId: id,
        userId: { in: user_ids },
      },
      select: { userId: true },
    });

    const existingMemberIds = existingMembers.map((m) => m.userId);
    const newMemberIds = user_ids.filter((userId: string) => !existingMemberIds.includes(userId));

    // Add new members
    if (newMemberIds.length > 0) {
      await prisma.audienceGroupMember.createMany({
        data: newMemberIds.map((userId: string) => ({
          groupId: id,
          userId,
        })),
      });
    }

    // Get updated member count
    const updatedGroup = await prisma.audienceGroup.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({
      added_count: newMemberIds.length,
      skipped_count: existingMemberIds.length,
      total_members: updatedGroup?._count.members || 0,
    });
  } catch (error) {
    console.error('Add members error:', error);
    return NextResponse.json({ error: 'Failed to add members' }, { status: 500 });
  }
}

// DELETE /api/groups/[id]/members - Remove members from group
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { user_ids } = body;

    if (!user_ids?.length) {
      return NextResponse.json({ error: 'user_ids is required' }, { status: 400 });
    }

    // Check ownership
    const group = await prisma.audienceGroup.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove members
    const result = await prisma.audienceGroupMember.deleteMany({
      where: {
        groupId: id,
        userId: { in: user_ids },
      },
    });

    // Get updated member count
    const updatedGroup = await prisma.audienceGroup.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({
      removed_count: result.count,
      total_members: updatedGroup?._count.members || 0,
    });
  } catch (error) {
    console.error('Remove members error:', error);
    return NextResponse.json({ error: 'Failed to remove members' }, { status: 500 });
  }
}
