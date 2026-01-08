import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/hashtags - Get trending hashtags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const hashtags = await prisma.hashtag.findMany({
      take: limit,
      orderBy: { postsCount: 'desc' },
      where: {
        postsCount: { gt: 0 },
      },
    });

    return NextResponse.json({
      hashtags: hashtags.map((h) => ({
        id: h.id,
        name: h.name,
        posts_count: h.postsCount,
      })),
    });
  } catch (error) {
    console.error('Get hashtags error:', error);
    return NextResponse.json({ error: 'Failed to fetch hashtags' }, { status: 500 });
  }
}
