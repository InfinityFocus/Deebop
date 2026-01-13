import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { createNotification } from '@/lib/notifications';

// POST /api/reposts/requests/[id]/deny - Deny a repost request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: repostId } = await params;

    // Find the repost request
    const repost = await prisma.repost.findUnique({
      where: { id: repostId },
      include: {
        post: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!repost) {
      return NextResponse.json({ error: 'Repost request not found' }, { status: 404 });
    }

    // Verify the current user owns the post being reposted
    if (repost.post.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only deny reposts of your own posts' },
        { status: 403 }
      );
    }

    // Check if already processed
    if (repost.status !== 'pending') {
      return NextResponse.json(
        { error: `Repost already ${repost.status}` },
        { status: 400 }
      );
    }

    // Update repost to denied
    const updatedRepost = await prisma.repost.update({
      where: { id: repostId },
      data: {
        status: 'denied',
      },
    });

    // Notify the requester that their repost was denied
    await createNotification({
      userId: repost.userId,
      actorId: user.id,
      type: 'repost_denied',
      postId: repost.postId,
    });

    return NextResponse.json({
      success: true,
      repost: {
        id: updatedRepost.id,
        status: updatedRepost.status,
      },
      message: 'Repost request denied',
    });
  } catch (error) {
    console.error('Deny repost error:', error);
    return NextResponse.json(
      { error: 'Failed to deny repost request' },
      { status: 500 }
    );
  }
}
