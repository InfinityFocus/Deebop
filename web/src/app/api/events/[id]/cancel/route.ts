import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/events/[id]/cancel - Cancel an event
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

    // Only host can cancel
    if (event.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can cancel this event' }, { status: 403 });
    }

    // Cannot cancel already cancelled events
    if (event.status === 'cancelled') {
      return NextResponse.json({ error: 'Event is already cancelled' }, { status: 400 });
    }

    // Cannot cancel completed events
    if (event.status === 'completed') {
      return NextResponse.json({ error: 'Cannot cancel a completed event' }, { status: 400 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status: 'cancelled' },
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

    // TODO: Send cancellation notifications to all attendees

    return NextResponse.json({
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        status: updatedEvent.status,
        host: updatedEvent.host,
      },
      message: 'Event cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel event error:', error);
    return NextResponse.json({ error: 'Failed to cancel event' }, { status: 500 });
  }
}
