import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/explore/trending/events - Get trending upcoming events (14d window)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    const now = new Date();
    // 14 day window for upcoming events
    const windowEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Get upcoming public events
    const events = await prisma.event.findMany({
      where: {
        visibility: 'public',
        startAt: {
          gte: now,
          lte: windowEnd,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        coverImageUrl: true,
        startAt: true,
        endAt: true,
        locationName: true,
        attendingCount: true,
        maybeCount: true,
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        rsvps: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    // Calculate trending score and format response
    const scoredEvents = events.map((event) => {
      const attendingCount = event.attendingCount;
      const maybeCount = event.maybeCount;
      const totalInterested = event.rsvps.length;

      // Days until event - prioritize soon events
      const daysUntil =
        (new Date(event.startAt).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24);
      const urgencyBonus = daysUntil < 3 ? 20 : daysUntil < 7 ? 10 : 0;

      // Trending formula: attending + maybe * 0.5 + urgency bonus
      const trendingScore =
        attendingCount + maybeCount * 0.5 + urgencyBonus;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        coverUrl: event.coverImageUrl,
        startDate: event.startAt,
        endDate: event.endAt,
        location: event.locationName,
        host: {
          id: event.host.id,
          username: event.host.username,
          displayName: event.host.displayName,
          avatar: event.host.avatarUrl,
        },
        attendingCount,
        maybeCount,
        totalInterested,
        daysUntil: Math.ceil(daysUntil),
        trendingScore,
      };
    });

    // Sort by trending score
    const trendingEvents = scoredEvents
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(offset, offset + limit);

    return NextResponse.json({
      events: trendingEvents,
      window: '14d',
    });
  } catch (error) {
    console.error('Error fetching trending events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending events' },
      { status: 500 }
    );
  }
}
