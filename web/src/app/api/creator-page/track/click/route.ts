import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/creator-page/track/click - Track link click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, blockId, linkIndex } = body;

    if (!pageId || !blockId) {
      return NextResponse.json(
        { error: 'pageId and blockId are required' },
        { status: 400 }
      );
    }

    // Verify page exists and is published
    const page = await prisma.creatorPage.findUnique({
      where: { id: pageId },
      select: { id: true, status: true },
    });

    if (!page || page.status !== 'published') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Verify block exists
    const block = await prisma.creatorPageBlock.findUnique({
      where: { id: blockId },
      select: { id: true, pageId: true },
    });

    if (!block || block.pageId !== pageId) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 });
    }

    // Get referrer from headers
    const referrer = request.headers.get('referer') || null;

    // Create click record
    await prisma.creatorPageClick.create({
      data: {
        pageId,
        blockId,
        linkIndex: typeof linkIndex === 'number' ? linkIndex : null,
        referrer,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
