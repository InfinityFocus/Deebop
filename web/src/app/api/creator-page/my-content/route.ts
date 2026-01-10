import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/creator-page/my-content - Fetch user's own content for the picker
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's posts (published only, limit 50, most recent first)
    const posts = await prisma.post.findMany({
      where: {
        userId: user.id,
        status: 'published',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        headline: true,
        description: true,
        mediaThumbnailUrl: true,
        mediaUrl: true,
        contentType: true,
        createdAt: true,
      },
    });

    // Fetch user's albums (published only, limit 50)
    const albums = await prisma.album.findMany({
      where: {
        ownerId: user.id,
        status: 'published',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        coverImageUrl: true,
        itemsCount: true,
        createdAt: true,
      },
    });

    // Fetch user's events (limit 50)
    const events = await prisma.event.findMany({
      where: {
        hostId: user.id,
      },
      orderBy: { startAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        coverImageUrl: true,
        startAt: true,
        status: true,
      },
    });

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        headline: p.headline,
        description: p.description,
        mediaThumbnailUrl: p.mediaThumbnailUrl,
        mediaUrl: p.mediaUrl,
        contentType: p.contentType,
        createdAt: p.createdAt.toISOString(),
      })),
      albums: albums.map((a) => ({
        id: a.id,
        title: a.title,
        coverImageUrl: a.coverImageUrl,
        itemsCount: a.itemsCount,
        createdAt: a.createdAt.toISOString(),
      })),
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        coverImageUrl: e.coverImageUrl,
        startAt: e.startAt.toISOString(),
        status: e.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching user content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
