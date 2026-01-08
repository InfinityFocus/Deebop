import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/albums/invites/[id]/decline - Decline an invite
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

    // Decline invite
    await prisma.albumInvite.update({
      where: { id: inviteId },
      data: {
        status: 'declined',
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Decline album invite error:', error);
    return NextResponse.json({ error: 'Failed to decline invite' }, { status: 500 });
  }
}
