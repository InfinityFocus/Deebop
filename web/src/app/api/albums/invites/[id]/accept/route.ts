import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/albums/invites/[id]/accept - Accept an invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inviteId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the invite
    const invite = await prisma.albumInvite.findUnique({
      where: { id: inviteId },
      include: {
        album: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Check if invite is for this user
    if (invite.inviteeId !== user.id) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Check if already responded
    if (invite.status !== 'pending') {
      return NextResponse.json({ error: `Invite has already been ${invite.status}` }, { status: 400 });
    }

    // Accept invite - create member and update invite status
    await prisma.$transaction(async (tx) => {
      // Update invite status
      await tx.albumInvite.update({
        where: { id: inviteId },
        data: {
          status: 'accepted',
          respondedAt: new Date(),
        },
      });

      // Create member
      await tx.albumMember.create({
        data: {
          albumId: invite.albumId,
          userId: user.id,
          role: invite.role,
        },
      });

      // Update album member count
      await tx.album.update({
        where: { id: invite.albumId },
        data: { membersCount: { increment: 1 } },
      });
    });

    return NextResponse.json({
      success: true,
      album: {
        id: invite.album.id,
        title: invite.album.title,
      },
      role: invite.role,
    });
  } catch (error) {
    console.error('Accept album invite error:', error);
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }
}
