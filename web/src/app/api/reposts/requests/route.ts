import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/reposts/requests - Get pending repost requests for current user's posts
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all pending reposts for posts authored by current user
    const pendingRequests = await prisma.repost.findMany({
      where: {
        status: 'pending',
        post: {
          userId: user.id,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        post: {
          select: {
            id: true,
            description: true,
            mediaUrl: true,
            contentType: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      requests: pendingRequests.map((r) => ({
        id: r.id,
        created_at: r.createdAt,
        requester: {
          id: r.user.id,
          username: r.user.username,
          display_name: r.user.displayName,
          avatar_url: r.user.avatarUrl,
        },
        post: {
          id: r.post.id,
          content: r.post.description,
          media_url: r.post.mediaUrl,
          content_type: r.post.contentType,
          created_at: r.post.createdAt,
        },
      })),
      count: pendingRequests.length,
    });
  } catch (error) {
    console.error('Get repost requests error:', error);
    return NextResponse.json(
      { error: 'Failed to get repost requests' },
      { status: 500 }
    );
  }
}
