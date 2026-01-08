import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { canChangeRole, canRemoveMember } from '@/lib/album-permissions';
import { AlbumRole } from '@prisma/client';

// Helper to get user's role in an album
async function getUserAlbumRole(albumId: string, userId: string): Promise<AlbumRole | null> {
  const member = await prisma.albumMember.findUnique({
    where: {
      albumId_userId: {
        albumId,
        userId,
      },
    },
  });
  return member?.role || null;
}

// PATCH /api/albums/[id]/members/[memberId] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: albumId, memberId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check member exists
    const member = await prisma.albumMember.findUnique({
      where: { id: memberId },
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
    });

    if (!member || member.albumId !== albumId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check permission
    const userRole = await getUserAlbumRole(albumId, user.id);

    const body = await request.json();
    const { role: newRole } = body;

    // Validate role
    const validRoles: AlbumRole[] = ['co_owner', 'contributor'];
    if (!newRole || !validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role. Must be co_owner or contributor.' }, { status: 400 });
    }

    // Check if user can change this member's role
    if (!canChangeRole(userRole, member.role, newRole)) {
      return NextResponse.json({ error: 'You do not have permission to change this role' }, { status: 403 });
    }

    // Cannot change owner's role
    if (member.role === 'owner') {
      return NextResponse.json({ error: 'Cannot change the owner\'s role' }, { status: 400 });
    }

    const updatedMember = await prisma.albumMember.update({
      where: { id: memberId },
      data: { role: newRole },
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
    });

    return NextResponse.json({
      member: {
        id: updatedMember.id,
        role: updatedMember.role,
        joined_at: updatedMember.joinedAt.toISOString(),
        user: {
          id: updatedMember.user.id,
          username: updatedMember.user.username,
          display_name: updatedMember.user.displayName,
          avatar_url: updatedMember.user.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error('Update album member error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// DELETE /api/albums/[id]/members/[memberId] - Remove member (or leave album)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: albumId, memberId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check member exists
    const member = await prisma.albumMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.albumId !== albumId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if user is trying to leave (remove themselves)
    const isSelf = member.userId === user.id;

    if (isSelf) {
      // User is leaving the album
      if (member.role === 'owner') {
        return NextResponse.json({ error: 'Owner cannot leave. Transfer ownership or delete the album.' }, { status: 400 });
      }

      // Remove member and update count
      await prisma.$transaction(async (tx) => {
        await tx.albumMember.delete({
          where: { id: memberId },
        });

        await tx.album.update({
          where: { id: albumId },
          data: { membersCount: { decrement: 1 } },
        });
      });

      return NextResponse.json({ success: true, message: 'Left album' });
    }

    // User is removing another member
    const userRole = await getUserAlbumRole(albumId, user.id);

    if (!canRemoveMember(userRole, member.role)) {
      return NextResponse.json({ error: 'You do not have permission to remove this member' }, { status: 403 });
    }

    // Remove member and update count
    await prisma.$transaction(async (tx) => {
      await tx.albumMember.delete({
        where: { id: memberId },
      });

      await tx.album.update({
        where: { id: albumId },
        data: { membersCount: { decrement: 1 } },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove album member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
