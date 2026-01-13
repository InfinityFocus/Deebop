import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/users/me/mention-requests - Get pending mention requests for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pendingMentions = await prisma.postMention.findMany({
      where: {
        mentionedUserId: user.id,
        status: 'pending',
      },
      include: {
        post: {
          select: {
            id: true,
            contentType: true,
            headline: true,
            description: true,
            mediaUrl: true,
            mediaThumbnailUrl: true,
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
        mentioner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      mentionRequests: pendingMentions.map((mention) => ({
        id: mention.id,
        postId: mention.postId,
        createdAt: mention.createdAt,
        post: {
          id: mention.post.id,
          contentType: mention.post.contentType,
          headline: mention.post.headline,
          description: mention.post.description,
          mediaUrl: mention.post.mediaUrl,
          thumbnailUrl: mention.post.mediaThumbnailUrl,
          owner: mention.post.user,
        },
        mentioner: mention.mentioner,
      })),
    });
  } catch (error) {
    console.error('Get mention requests error:', error);
    return NextResponse.json({ error: 'Failed to get mention requests' }, { status: 500 });
  }
}
