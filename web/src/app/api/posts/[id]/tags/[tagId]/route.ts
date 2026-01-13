import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// PATCH /api/posts/[id]/tags/[tagId] - Approve or deny a tag
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId, tagId } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve" or "deny"' },
        { status: 400 }
      );
    }

    // Get the tag
    const tag = await prisma.postTag.findUnique({
      where: { id: tagId },
      include: {
        post: {
          select: { userId: true },
        },
        tagger: {
          select: { id: true, username: true },
        },
      },
    });

    if (!tag || tag.postId !== postId) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Only the tagged user can approve/deny
    if (tag.taggedUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the tagged user can approve or deny tags' },
        { status: 403 }
      );
    }

    // Update the tag status
    const newStatus = action === 'approve' ? 'approved' : 'denied';
    const updatedTag = await prisma.postTag.update({
      where: { id: tagId },
      data: {
        status: newStatus,
        approvedAt: action === 'approve' ? new Date() : null,
      },
    });

    // Notify the tagger of the decision
    if (tag.taggerId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: tag.taggerId,
          type: action === 'approve' ? 'tag_approved' : 'tag_denied',
          actorId: user.id,
          postId,
        },
      });
    }

    return NextResponse.json({
      tag: {
        id: updatedTag.id,
        status: updatedTag.status,
        approvedAt: updatedTag.approvedAt,
      },
    });
  } catch (error) {
    console.error('Update tag error:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

// DELETE /api/posts/[id]/tags/[tagId] - Remove a tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId, tagId } = await params;

    // Get the tag
    const tag = await prisma.postTag.findUnique({
      where: { id: tagId },
      include: {
        post: {
          select: { userId: true },
        },
      },
    });

    if (!tag || tag.postId !== postId) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Can delete if:
    // 1. You're the post owner
    // 2. You're the tagged user (removing yourself)
    // 3. You're the tagger
    const canDelete =
      user.id === tag.post.userId ||
      user.id === tag.taggedUserId ||
      user.id === tag.taggerId;

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this tag' },
        { status: 403 }
      );
    }

    // Delete the tag
    await prisma.postTag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
