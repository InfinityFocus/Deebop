import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { createNotification } from '@/lib/notifications';

// PATCH /api/posts/[id]/mentions/[mentionId] - Approve or deny a mention
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mentionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId, mentionId } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve" or "deny"' },
        { status: 400 }
      );
    }

    // Get the mention
    const mention = await prisma.postMention.findUnique({
      where: { id: mentionId },
      include: {
        mentioner: {
          select: { id: true, username: true },
        },
      },
    });

    if (!mention || mention.postId !== postId) {
      return NextResponse.json({ error: 'Mention not found' }, { status: 404 });
    }

    // Only the mentioned user can approve/deny
    if (mention.mentionedUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the mentioned user can approve or deny mentions' },
        { status: 403 }
      );
    }

    // Update the mention status
    const newStatus = action === 'approve' ? 'approved' : 'denied';
    const updatedMention = await prisma.postMention.update({
      where: { id: mentionId },
      data: {
        status: newStatus,
        approvedAt: action === 'approve' ? new Date() : null,
      },
    });

    // Notify the mentioner of the decision
    if (mention.mentionerId !== user.id) {
      await createNotification({
        userId: mention.mentionerId,
        type: action === 'approve' ? 'mention_approved' : 'mention_denied',
        actorId: user.id,
        postId,
      });
    }

    return NextResponse.json({
      mention: {
        id: updatedMention.id,
        status: updatedMention.status,
        approvedAt: updatedMention.approvedAt,
      },
    });
  } catch (error) {
    console.error('Update mention error:', error);
    return NextResponse.json({ error: 'Failed to update mention' }, { status: 500 });
  }
}

// DELETE /api/posts/[id]/mentions/[mentionId] - Remove a mention
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mentionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId, mentionId } = await params;

    // Get the mention
    const mention = await prisma.postMention.findUnique({
      where: { id: mentionId },
      include: {
        post: {
          select: { userId: true },
        },
      },
    });

    if (!mention || mention.postId !== postId) {
      return NextResponse.json({ error: 'Mention not found' }, { status: 404 });
    }

    // Can delete if:
    // 1. You're the post owner (the mentioner)
    // 2. You're the mentioned user (removing yourself)
    const canDelete =
      user.id === mention.post.userId ||
      user.id === mention.mentionedUserId;

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this mention' },
        { status: 403 }
      );
    }

    // Delete the mention
    await prisma.postMention.delete({
      where: { id: mentionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete mention error:', error);
    return NextResponse.json({ error: 'Failed to delete mention' }, { status: 500 });
  }
}
