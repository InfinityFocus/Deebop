import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { createNotification } from '@/lib/notifications';

// GET /api/posts/[id]/tags - Get all approved tags for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const user = await getCurrentUser();

    // Get the post to verify it exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Determine which tags to show:
    // - All approved tags
    // - Pending tags if user is the post owner or the tagger
    let whereClause: Prisma.PostTagWhereInput = { postId };

    if (user && (user.id === post.userId)) {
      // Post owner sees all tags
    } else if (user) {
      // Other users see approved tags + their own pending tags
      whereClause = {
        postId,
        OR: [
          { status: 'approved' },
          { taggerId: user.id },
        ],
      };
    } else {
      // Anonymous users only see approved tags
      whereClause = { postId, status: 'approved' };
    }

    const tags = await prisma.postTag.findMany({
      where: whereClause,
      include: {
        taggedUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        tagger: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      tags: tags.map((tag) => ({
        id: tag.id,
        postId: tag.postId,
        mediaId: tag.mediaId,
        positionX: tag.positionX,
        positionY: tag.positionY,
        status: tag.status,
        createdAt: tag.createdAt,
        taggedUser: {
          id: tag.taggedUser.id,
          username: tag.taggedUser.username,
          displayName: tag.taggedUser.displayName,
          avatarUrl: tag.taggedUser.avatarUrl,
        },
        tagger: {
          id: tag.tagger.id,
          username: tag.tagger.username,
        },
      })),
    });
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json({ error: 'Failed to get tags' }, { status: 500 });
  }
}

// POST /api/posts/[id]/tags - Add a tag to a post
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
    const body = await request.json();
    const { taggedUserId, mediaId, positionX, positionY } = body;

    // Validate required fields
    if (!taggedUserId || positionX === undefined || positionY === undefined) {
      return NextResponse.json(
        { error: 'taggedUserId, positionX, and positionY are required' },
        { status: 400 }
      );
    }

    // Validate position is within bounds (0-100 percentage)
    if (positionX < 0 || positionX > 100 || positionY < 0 || positionY > 100) {
      return NextResponse.json(
        { error: 'Position must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        userId: true,
        contentType: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Only allow tagging on visual content (image, video, panorama360)
    if (!['image', 'video', 'panorama360'].includes(post.contentType)) {
      return NextResponse.json(
        { error: 'Tags can only be added to images, videos, and panoramas' },
        { status: 400 }
      );
    }

    // Get the tagged user's preferences
    const taggedUser = await prisma.user.findUnique({
      where: { id: taggedUserId },
      select: {
        id: true,
        username: true,
        allowTagging: true,
        requireTaggingApproval: true,
      },
    });

    if (!taggedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user allows tagging
    if (!taggedUser.allowTagging) {
      return NextResponse.json(
        { error: 'This user does not allow tagging' },
        { status: 403 }
      );
    }

    // Check if tag already exists
    // Use findFirst because mediaId can be null and unique constraints with null don't work as expected
    const existingTag = await prisma.postTag.findFirst({
      where: {
        postId,
        mediaId: mediaId || null,
        taggedUserId,
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: 'User is already tagged in this image' },
        { status: 400 }
      );
    }

    // Determine initial status based on:
    // 1. If tagger is the tagged user themselves -> approved
    // 2. If tagger is the post owner and tagged user doesn't require approval -> approved
    // 3. If tagged user requires approval -> pending
    // 4. Otherwise -> approved
    let initialStatus: 'pending' | 'approved' = 'approved';

    if (user.id !== taggedUserId && taggedUser.requireTaggingApproval) {
      initialStatus = 'pending';
    }

    // Create the tag
    const tag = await prisma.postTag.create({
      data: {
        postId,
        mediaId: mediaId || null,
        taggedUserId,
        taggerId: user.id,
        positionX,
        positionY,
        status: initialStatus,
        approvedAt: initialStatus === 'approved' ? new Date() : null,
      },
      include: {
        taggedUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Create notification
    if (user.id !== taggedUserId) {
      await createNotification({
        userId: taggedUserId,
        type: initialStatus === 'pending' ? 'tag_request' : 'tag',
        actorId: user.id,
        postId,
      });
    }

    return NextResponse.json({
      tag: {
        id: tag.id,
        postId: tag.postId,
        mediaId: tag.mediaId,
        positionX: tag.positionX,
        positionY: tag.positionY,
        status: tag.status,
        createdAt: tag.createdAt,
        taggedUser: tag.taggedUser,
      },
    });
  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
