import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/users/me/tag-requests - Get pending tag requests for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pendingTags = await prisma.postTag.findMany({
      where: {
        taggedUserId: user.id,
        status: 'pending',
      },
      include: {
        post: {
          select: {
            id: true,
            mediaUrl: true,
            mediaThumbnailUrl: true,
            description: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        tagger: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        media: {
          select: {
            id: true,
            mediaUrl: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      tagRequests: pendingTags.map((tag) => ({
        id: tag.id,
        postId: tag.postId,
        mediaId: tag.mediaId,
        positionX: tag.positionX,
        positionY: tag.positionY,
        createdAt: tag.createdAt,
        post: {
          id: tag.post.id,
          mediaUrl: tag.media?.mediaUrl || tag.post.mediaUrl,
          thumbnailUrl: tag.media?.thumbnailUrl || tag.post.mediaThumbnailUrl,
          description: tag.post.description,
          owner: tag.post.user,
        },
        tagger: tag.tagger,
      })),
    });
  } catch (error) {
    console.error('Get tag requests error:', error);
    return NextResponse.json({ error: 'Failed to get tag requests' }, { status: 500 });
  }
}
