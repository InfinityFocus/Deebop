import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/creator-page/track/view - Track page view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, sessionId } = body;

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    // Verify page exists and is published
    const page = await prisma.creatorPage.findUnique({
      where: { id: pageId },
      select: { id: true, status: true },
    });

    if (!page || page.status !== 'published') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Get referrer from headers
    const referrer = request.headers.get('referer') || null;

    // Create view record
    await prisma.creatorPageView.create({
      data: {
        pageId,
        sessionId: sessionId || null,
        referrer,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
