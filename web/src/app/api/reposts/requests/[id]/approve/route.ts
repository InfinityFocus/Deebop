import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { createNotification } from '@/lib/notifications';

// POST /api/reposts/requests/[id]/approve - Approve a repost request
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
        { error: 'You can only approve reposts of your own posts' },
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

    // Update repost to approved
    const updatedRepost = await prisma.repost.update({
      where: { id: repostId },
      data: {
        status: 'approved',
        approvedAt: new Date(),
      },
    });

    // Increment repost count on the post
    await prisma.post.update({
      where: { id: repost.postId },
      data: { repostsCount: { increment: 1 } },
    });

    // Notify the requester that their repost was approved
    await createNotification({
      userId: repost.userId,
      actorId: user.id,
      type: 'repost_approved',
      postId: repost.postId,
    });

    return NextResponse.json({
      success: true,
      repost: {
        id: updatedRepost.id,
        status: updatedRepost.status,
        approved_at: updatedRepost.approvedAt,
      },
      message: 'Repost request approved',
    });
  } catch (error) {
    console.error('Approve repost error:', error);
    return NextResponse.json(
      { error: 'Failed to approve repost request' },
      { status: 500 }
    );
  }
}
