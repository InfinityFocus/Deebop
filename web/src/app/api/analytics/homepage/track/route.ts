import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const VALID_EVENT_TYPES = ['homepage_view', 'cta_click', 'scroll_depth', 'explore_entry'];

const VALID_CTA_NAMES = [
  'explore',
  'create_account',
  'sign_in',
  'create_event',
  'build_creator_page',
  'features',
];

const VALID_SCROLL_DEPTHS = [25, 50, 75, 100];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, eventType, eventData } = body;

    // Validate required fields
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Validate event-specific data
    if (eventType === 'cta_click') {
      if (!eventData?.ctaName || !VALID_CTA_NAMES.includes(eventData.ctaName)) {
        return NextResponse.json({ success: false }, { status: 400 });
      }
    }

    if (eventType === 'scroll_depth') {
      if (!eventData?.depth || !VALID_SCROLL_DEPTHS.includes(eventData.depth)) {
        return NextResponse.json({ success: false }, { status: 400 });
      }
    }

    // Get referrer and user agent from headers
    const referrer = request.headers.get('referer') || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Create the event
    await prisma.homepageEvent.create({
      data: {
        sessionId,
        eventType,
        eventData: eventData || null,
        referrer,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Silent failure - analytics shouldn't break the page
    console.error('Homepage analytics tracking error:', error);
    return NextResponse.json({ success: true }); // Return success even on error
  }
}
