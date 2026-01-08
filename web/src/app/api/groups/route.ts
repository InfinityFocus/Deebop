import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/groups - List user's audience groups
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groups = await prisma.audienceGroup.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json({
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        member_count: group._count.members,
        created_at: group.createdAt.toISOString(),
        updated_at: group.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get groups error:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST /api/groups - Create a new audience group
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, member_ids } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    // Check if group name already exists for this user
    const existingGroup = await prisma.audienceGroup.findUnique({
      where: {
        ownerId_name: {
          ownerId: user.id,
          name: name.trim(),
        },
      },
    });

    if (existingGroup) {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 400 });
    }

    // Validate member_ids are followers of the user
    if (member_ids?.length > 0) {
      const validFollowers = await prisma.follow.findMany({
        where: {
          followingId: user.id,
          followerId: { in: member_ids },
        },
        select: { followerId: true },
      });

      const validFollowerIds = validFollowers.map((f) => f.followerId);
      const invalidIds = member_ids.filter((id: string) => !validFollowerIds.includes(id));

      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: 'Some users are not your followers' },
          { status: 400 }
        );
      }
    }

    // Create group with members in a transaction
    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.audienceGroup.create({
        data: {
          name: name.trim(),
          ownerId: user.id,
        },
      });

      // Add members if provided
      if (member_ids?.length > 0) {
        await tx.audienceGroupMember.createMany({
          data: member_ids.map((memberId: string) => ({
            groupId: newGroup.id,
            userId: memberId,
          })),
        });
      }

      return newGroup;
    });

    // Fetch the group with member count
    const groupWithCount = await prisma.audienceGroup.findUnique({
      where: { id: group.id },
      include: {
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        member_count: groupWithCount?._count.members || 0,
        created_at: group.createdAt.toISOString(),
        updated_at: group.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
