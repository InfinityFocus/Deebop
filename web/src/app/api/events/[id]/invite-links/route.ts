import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import type { CreateInviteLinkPayload, EventInviteLinkDetail } from '@/types/event';

// GET /api/events/[id]/invite-links - List invite links (host only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Only host can see invite links
    if (event.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can view invite links' }, { status: 403 });
    }

    const inviteLinks = await prisma.eventInviteLink.findMany({
      where: { eventId: id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    const formattedLinks: EventInviteLinkDetail[] = inviteLinks.map((link) => {
      const isExpired = link.expiresAt ? link.expiresAt < now : false;
      const remainingUses = link.maxUses - link.usedCount;
      const isUsable = !link.isRevoked && !isExpired && remainingUses > 0;

      return {
        id: link.id,
        eventId: link.eventId,
        token: link.token,
        createdById: link.createdById,
        maxUses: link.maxUses,
        usedCount: link.usedCount,
        expiresAt: link.expiresAt,
        isRevoked: link.isRevoked,
        isRestricted: link.isRestricted,
        createdAt: link.createdAt,
        createdBy: link.createdBy,
        remainingUses,
        isExpired,
        isUsable,
      };
    });

    return NextResponse.json({ inviteLinks: formattedLinks });
  } catch (error) {
    console.error('Get invite links error:', error);
    return NextResponse.json({ error: 'Failed to fetch invite links' }, { status: 500 });
  }
}

// POST /api/events/[id]/invite-links - Create a new invite link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Only host can create invite links
    if (event.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can create invite links' }, { status: 403 });
    }

    // Cannot create links for cancelled events
    if (event.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot create links for a cancelled event' }, { status: 400 });
    }

    const body: CreateInviteLinkPayload = await request.json();
    const { maxUses = 50, expiresAt, isRestricted = false } = body;

    // Validate max uses
    if (maxUses < 1 || maxUses > 1000) {
      return NextResponse.json({ error: 'Max uses must be between 1 and 1000' }, { status: 400 });
    }

    // Parse expiry date if provided
    let parsedExpiresAt: Date | null = null;
    if (expiresAt) {
      parsedExpiresAt = new Date(expiresAt);
      if (isNaN(parsedExpiresAt.getTime())) {
        return NextResponse.json({ error: 'Invalid expiry date format' }, { status: 400 });
      }
      if (parsedExpiresAt < new Date()) {
        return NextResponse.json({ error: 'Expiry date must be in the future' }, { status: 400 });
      }
    }

    const inviteLink = await prisma.eventInviteLink.create({
      data: {
        eventId: id,
        createdById: user.id,
        maxUses,
        expiresAt: parsedExpiresAt,
        isRestricted,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    const response: EventInviteLinkDetail = {
      id: inviteLink.id,
      eventId: inviteLink.eventId,
      token: inviteLink.token,
      createdById: inviteLink.createdById,
      maxUses: inviteLink.maxUses,
      usedCount: inviteLink.usedCount,
      expiresAt: inviteLink.expiresAt,
      isRevoked: inviteLink.isRevoked,
      isRestricted: inviteLink.isRestricted,
      createdAt: inviteLink.createdAt,
      createdBy: inviteLink.createdBy,
      remainingUses: inviteLink.maxUses,
      isExpired: false,
      isUsable: true,
    };

    return NextResponse.json({ inviteLink: response });
  } catch (error) {
    console.error('Create invite link error:', error);
    return NextResponse.json({ error: 'Failed to create invite link' }, { status: 500 });
  }
}
