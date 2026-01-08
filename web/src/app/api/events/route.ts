import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import type { CreateEventPayload, EventCard, EventListType } from '@/types/event';

// GET /api/events - List events
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);

    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = (searchParams.get('type') || 'upcoming') as EventListType;
    const status = searchParams.get('status');

    // Build filter based on type
    let whereClause: any = {};
    const now = new Date();

    switch (type) {
      case 'hosted':
        // Events I'm hosting
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        whereClause = { hostId: user.id };
        break;

      case 'invited':
        // Events I'm invited to (not hosting)
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        whereClause = {
          NOT: { hostId: user.id },
          OR: [
            { invites: { some: { inviteeId: user.id } } },
            { rsvps: { some: { userId: user.id } } },
          ],
        };
        break;

      case 'attending':
        // Events I'm attending
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        whereClause = {
          rsvps: { some: { userId: user.id, status: 'attending' } },
        };
        break;

      case 'past':
        // Past events (completed or past end date)
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        whereClause = {
          AND: [
            {
              OR: [
                { status: 'completed' },
                { endAt: { lt: now } },
              ],
            },
            {
              OR: [
                { hostId: user.id },
                { invites: { some: { inviteeId: user.id } } },
                { rsvps: { some: { userId: user.id } } },
              ],
            },
          ],
        };
        break;

      case 'upcoming':
      default:
        // All my upcoming events (hosting or invited)
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        whereClause = {
          status: 'scheduled',
          endAt: { gte: now },
          OR: [
            { hostId: user.id },
            { invites: { some: { inviteeId: user.id } } },
            { rsvps: { some: { userId: user.id } } },
          ],
        };
        break;
    }

    // Add status filter if provided
    if (status && ['scheduled', 'cancelled', 'completed'].includes(status)) {
      whereClause.status = status;
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { startAt: type === 'past' ? 'desc' : 'asc' },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    let nextCursor: string | undefined;
    if (events.length > limit) {
      const nextItem = events.pop();
      nextCursor = nextItem?.id;
    }

    const formattedEvents: EventCard[] = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      coverImageUrl: event.coverImageUrl,
      startAt: event.startAt,
      endAt: event.endAt,
      locationName: event.locationName,
      locationMode: event.locationMode,
      status: event.status,
      attendingCount: event.attendingCount,
      maybeCount: event.maybeCount,
      host: {
        id: event.host.id,
        username: event.host.username,
        displayName: event.host.displayName,
        avatarUrl: event.host.avatarUrl,
      },
    }));

    return NextResponse.json({
      events: formattedEvents,
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateEventPayload = await request.json();
    const {
      title,
      description,
      coverImageUrl,
      startAt,
      endAt,
      rsvpDeadlineAt,
      locationName,
      locationMode = 'exact',
      visibility = 'unlisted',
      showAttendeeList = true,
      allowMaybeUploads = false,
      uploadWindow = 'during_and_after',
    } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!startAt || !endAt) {
      return NextResponse.json({ error: 'Start and end times are required' }, { status: 400 });
    }

    const parsedStartAt = new Date(startAt);
    const parsedEndAt = new Date(endAt);

    if (isNaN(parsedStartAt.getTime()) || isNaN(parsedEndAt.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (parsedEndAt <= parsedStartAt) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Parse optional RSVP deadline
    let parsedRsvpDeadline: Date | null = null;
    if (rsvpDeadlineAt) {
      parsedRsvpDeadline = new Date(rsvpDeadlineAt);
      if (isNaN(parsedRsvpDeadline.getTime())) {
        return NextResponse.json({ error: 'Invalid RSVP deadline format' }, { status: 400 });
      }
      if (parsedRsvpDeadline > parsedStartAt) {
        return NextResponse.json({ error: 'RSVP deadline must be before event starts' }, { status: 400 });
      }
    }

    // Create event with auto-generated album and initial invite link
    const result = await prisma.$transaction(async (tx) => {
      // Create the event album first
      const album = await tx.album.create({
        data: {
          title: `${title.trim()} Gallery`,
          description: `Event gallery for ${title.trim()}`,
          visibility: 'private', // Event albums are always private, access controlled by event permissions
          albumType: 'event',
          ownerId: user.id,
          status: 'published',
        },
      });

      // Add host as album owner member
      await tx.albumMember.create({
        data: {
          albumId: album.id,
          userId: user.id,
          role: 'owner',
        },
      });

      // Create the event
      const event = await tx.event.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          coverImageUrl: coverImageUrl || null,
          startAt: parsedStartAt,
          endAt: parsedEndAt,
          rsvpDeadlineAt: parsedRsvpDeadline,
          locationName: locationName?.trim() || null,
          locationMode,
          visibility,
          showAttendeeList,
          allowMaybeUploads,
          uploadWindow,
          hostId: user.id,
          albumId: album.id,
        },
        include: {
          host: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Create initial invite link
      const inviteLink = await tx.eventInviteLink.create({
        data: {
          eventId: event.id,
          createdById: user.id,
          maxUses: 50,
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

      return { event, album, inviteLink };
    });

    return NextResponse.json({
      event: {
        id: result.event.id,
        title: result.event.title,
        description: result.event.description,
        coverImageUrl: result.event.coverImageUrl,
        startAt: result.event.startAt,
        endAt: result.event.endAt,
        rsvpDeadlineAt: result.event.rsvpDeadlineAt,
        locationName: result.event.locationName,
        locationMode: result.event.locationMode,
        visibility: result.event.visibility,
        rsvpLocked: result.event.rsvpLocked,
        showAttendeeList: result.event.showAttendeeList,
        allowMaybeUploads: result.event.allowMaybeUploads,
        uploadWindow: result.event.uploadWindow,
        status: result.event.status,
        attendingCount: result.event.attendingCount,
        maybeCount: result.event.maybeCount,
        invitedCount: result.event.invitedCount,
        albumId: result.event.albumId,
        createdAt: result.event.createdAt,
        updatedAt: result.event.updatedAt,
        host: result.event.host,
        isHost: true,
        isInvited: true,
        myRsvpStatus: null,
        canRsvp: false,
        canUpload: true,
        canManage: true,
      },
      album: {
        id: result.album.id,
        title: result.album.title,
      },
      inviteLink: {
        id: result.inviteLink.id,
        token: result.inviteLink.token,
        maxUses: result.inviteLink.maxUses,
        usedCount: result.inviteLink.usedCount,
        expiresAt: result.inviteLink.expiresAt,
        isRevoked: result.inviteLink.isRevoked,
        createdAt: result.inviteLink.createdAt,
        createdBy: result.inviteLink.createdBy,
        remainingUses: result.inviteLink.maxUses - result.inviteLink.usedCount,
        isExpired: false,
        isUsable: true,
      },
    });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
