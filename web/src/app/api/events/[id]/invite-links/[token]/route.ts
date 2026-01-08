import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// DELETE /api/events/[id]/invite-links/[token] - Revoke an invite link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; token: string }> }
) {
  try {
    const { id, token } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only host can revoke invite links
    if (event.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can revoke invite links' }, { status: 403 });
    }

    const inviteLink = await prisma.eventInviteLink.findFirst({
      where: {
        eventId: id,
        token,
      },
    });

    if (!inviteLink) {
      return NextResponse.json({ error: 'Invite link not found' }, { status: 404 });
    }

    if (inviteLink.isRevoked) {
      return NextResponse.json({ error: 'Invite link is already revoked' }, { status: 400 });
    }

    await prisma.eventInviteLink.update({
      where: { id: inviteLink.id },
      data: { isRevoked: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Invite link revoked',
    });
  } catch (error) {
    console.error('Revoke invite link error:', error);
    return NextResponse.json({ error: 'Failed to revoke invite link' }, { status: 500 });
  }
}
