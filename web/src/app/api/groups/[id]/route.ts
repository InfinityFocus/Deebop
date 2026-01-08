import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/groups/[id] - Get a single group with members
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const group = await prisma.audienceGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
        _count: { select: { members: true } },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check ownership
    if (group.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        member_count: group._count.members,
        created_at: group.createdAt.toISOString(),
        updated_at: group.updatedAt.toISOString(),
        members: group.members.map((m) => ({
          id: m.user.id,
          username: m.user.username,
          display_name: m.user.displayName,
          avatar_url: m.user.avatarUrl,
          added_at: m.addedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Get group error:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

// PATCH /api/groups/[id] - Update group name
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
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

    // Check if new name already exists
    if (name.trim() !== group.name) {
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
    }

    const updatedGroup = await prisma.audienceGroup.update({
      where: { id },
      data: { name: name.trim() },
      include: {
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({
      group: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        member_count: updatedGroup._count.members,
        created_at: updatedGroup.createdAt.toISOString(),
        updated_at: updatedGroup.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update group error:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

// DELETE /api/groups/[id] - Delete a group
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

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

    await prisma.audienceGroup.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
