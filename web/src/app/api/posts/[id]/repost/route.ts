import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { createNotification } from '@/lib/notifications';

// POST /api/posts/[id]/repost - Create a repost
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;

    // Fetch the post with user info
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            isPrivate: true,
            allowReposts: true,
            requireRepostApproval: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Cannot repost own posts
    if (post.userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot repost your own post' },
        { status: 400 }
      );
    }

    // Cannot repost private account content
    if (post.user.isPrivate) {
      return NextResponse.json(
        { error: 'Cannot repost content from private accounts' },
        { status: 403 }
      );
    }

    // Cannot repost if visibility is not public
    if (post.visibility !== 'public') {
      return NextResponse.json(
        { error: 'Can only repost public posts' },
        { status: 403 }
      );
    }

    // Check if user allows reposts
    if (!post.user.allowReposts) {
      return NextResponse.json(
        { error: 'This user does not allow reposts' },
        { status: 403 }
      );
    }

    // Check if already reposted
    const existingRepost = await prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    if (existingRepost) {
      return NextResponse.json(
        { error: 'Already reposted this post', status: existingRepost.status },
        { status: 400 }
      );
    }

    // Determine status based on user's settings
    const status = post.user.requireRepostApproval ? 'pending' : 'approved';
    const approvedAt = status === 'approved' ? new Date() : null;

    // Create repost
    const repost = await prisma.repost.create({
      data: {
        userId: user.id,
        postId,
        status,
        approvedAt,
      },
    });

    // If approved immediately, increment repost count
    if (status === 'approved') {
      await prisma.post.update({
        where: { id: postId },
        data: { repostsCount: { increment: 1 } },
      });
    }

    // Create notification
    const notificationType = status === 'pending' ? 'repost_request' : 'repost';
    await createNotification({
      userId: post.userId,
      actorId: user.id,
      type: notificationType,
      postId,
    });

    return NextResponse.json({
      repost: {
        id: repost.id,
        status: repost.status,
        created_at: repost.createdAt,
        approved_at: repost.approvedAt,
      },
      message:
        status === 'pending'
          ? 'Repost request sent. Waiting for approval.'
          : 'Post reposted successfully.',
    });
  } catch (error) {
    console.error('Create repost error:', error);
    return NextResponse.json(
      { error: 'Failed to create repost' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id]/repost - Remove a repost
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;

    // Find the repost
    const repost = await prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    if (!repost) {
      return NextResponse.json({ error: 'Repost not found' }, { status: 404 });
    }

    // Delete the repost
    await prisma.repost.delete({
      where: { id: repost.id },
    });

    // If it was approved, decrement the count
    if (repost.status === 'approved') {
      await prisma.post.update({
        where: { id: postId },
        data: { repostsCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Repost removed successfully.',
    });
  } catch (error) {
    console.error('Delete repost error:', error);
    return NextResponse.json(
      { error: 'Failed to remove repost' },
      { status: 500 }
    );
  }
}

// GET /api/posts/[id]/repost - Check repost status for current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;

    const repost = await prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    return NextResponse.json({
      reposted: !!repost,
      status: repost?.status || null,
    });
  } catch (error) {
    console.error('Get repost status error:', error);
    return NextResponse.json(
      { error: 'Failed to get repost status' },
      { status: 500 }
    );
  }
}
