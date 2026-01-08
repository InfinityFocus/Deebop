import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Vercel cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET;

// POST /api/cron/publish-drops - Auto-publish scheduled drops
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (for production security)
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Find and publish all scheduled posts that are due
    const publishedPosts = await prisma.post.updateMany({
      where: {
        status: 'scheduled',
        scheduledFor: { lte: now },
      },
      data: {
        status: 'published',
        droppedAt: now,
      },
    });

    // Find and publish all scheduled albums that are due
    const publishedAlbums = await prisma.album.updateMany({
      where: {
        status: 'scheduled',
        scheduledFor: { lte: now },
      },
      data: {
        status: 'published',
        droppedAt: now,
      },
    });

    console.log(
      `[Cron] Published ${publishedPosts.count} posts and ${publishedAlbums.count} albums`
    );

    return NextResponse.json({
      success: true,
      published: {
        posts: publishedPosts.count,
        albums: publishedAlbums.count,
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Publish drops cron error:', error);
    return NextResponse.json({ error: 'Failed to publish drops' }, { status: 500 });
  }
}

// GET endpoint for manual testing / health check
export async function GET(request: NextRequest) {
  try {
    // Count pending drops
    const pendingPosts = await prisma.post.count({
      where: { status: 'scheduled' },
    });
    const pendingAlbums = await prisma.album.count({
      where: { status: 'scheduled' },
    });

    // Count drops due now
    const now = new Date();
    const duePosts = await prisma.post.count({
      where: {
        status: 'scheduled',
        scheduledFor: { lte: now },
      },
    });
    const dueAlbums = await prisma.album.count({
      where: {
        status: 'scheduled',
        scheduledFor: { lte: now },
      },
    });

    return NextResponse.json({
      status: 'ok',
      pending: {
        posts: pendingPosts,
        albums: pendingAlbums,
      },
      due_now: {
        posts: duePosts,
        albums: dueAlbums,
      },
      checked_at: now.toISOString(),
    });
  } catch (error) {
    console.error('Publish drops health check error:', error);
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}
