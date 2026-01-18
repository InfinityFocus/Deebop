import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { canAccessFeature, type SubscriptionTier } from '@/lib/stripe';

// POST /api/posts/[id]/repost-to-profile
// Creates a copy of a post on another profile owned by the same identity
// This is for Creator tier users who can't multi-publish but can repost to their own profiles
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
    const { targetProfileId } = body;

    if (!targetProfileId) {
      return NextResponse.json({ error: 'Target profile ID is required' }, { status: 400 });
    }

    // Get the original post
    const originalPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            identityId: true,
          },
        },
        media: true,
      },
    });

    if (!originalPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Verify the original post belongs to the current user
    if (originalPost.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only repost your own posts to other profiles' },
        { status: 403 }
      );
    }

    // Get the target profile and verify it belongs to the same identity
    const targetProfile = await prisma.user.findUnique({
      where: { id: targetProfileId },
      select: {
        id: true,
        username: true,
        displayName: true,
        identityId: true,
      },
    });

    if (!targetProfile) {
      return NextResponse.json({ error: 'Target profile not found' }, { status: 404 });
    }

    // Verify both profiles belong to the same identity
    if (originalPost.user.identityId !== targetProfile.identityId) {
      return NextResponse.json(
        { error: 'Target profile must belong to the same account' },
        { status: 403 }
      );
    }

    // Can't repost to the same profile
    if (originalPost.userId === targetProfileId) {
      return NextResponse.json(
        { error: 'Cannot repost to the same profile' },
        { status: 400 }
      );
    }

    // Check if user has at least Creator tier (or is Pro/Teams)
    const userTier = (user.tier || 'free') as SubscriptionTier;
    if (!canAccessFeature(userTier, 'creator')) {
      return NextResponse.json(
        {
          error: 'Reposting to other profiles requires Creator tier or above',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Create the reposted post on the target profile
    const repostedPost = await prisma.$transaction(async (tx) => {
      // Create the new post with attribution to original
      const newPost = await tx.post.create({
        data: {
          userId: targetProfileId,
          contentType: originalPost.contentType,
          headline: originalPost.headline,
          headlineStyle: originalPost.headlineStyle,
          description: originalPost.description
            ? `${originalPost.description}\n\n[Reposted from @${originalPost.user.username}]`
            : `[Reposted from @${originalPost.user.username}]`,
          mediaUrl: originalPost.mediaUrl,
          mediaThumbnailUrl: originalPost.mediaThumbnailUrl,
          mediaDurationSeconds: originalPost.mediaDurationSeconds,
          mediaWidth: originalPost.mediaWidth,
          mediaHeight: originalPost.mediaHeight,
          visibility: originalPost.visibility,
          provenance: originalPost.provenance,
          status: 'published',
          isSponsoredContent: originalPost.isSponsoredContent,
          isSensitiveContent: originalPost.isSensitiveContent,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              tier: true,
            },
          },
        },
      });

      // Copy media if it's a carousel post
      if (originalPost.media && originalPost.media.length > 0) {
        await tx.postMedia.createMany({
          data: originalPost.media.map((m) => ({
            postId: newPost.id,
            mediaUrl: m.mediaUrl,
            thumbnailUrl: m.thumbnailUrl,
            mediaWidth: m.mediaWidth,
            mediaHeight: m.mediaHeight,
            sortOrder: m.sortOrder,
            altText: m.altText,
          })),
        });
      }

      return newPost;
    });

    return NextResponse.json({
      success: true,
      post: {
        id: repostedPost.id,
        content_type: repostedPost.contentType,
        headline: repostedPost.headline,
        text_content: repostedPost.description,
        media_url: repostedPost.mediaUrl,
        created_at: repostedPost.createdAt.toISOString(),
        user: {
          id: repostedPost.user.id,
          username: repostedPost.user.username,
          display_name: repostedPost.user.displayName,
          avatar_url: repostedPost.user.avatarUrl,
        },
      },
      original_post_id: originalPost.id,
      original_author: {
        username: originalPost.user.username,
        display_name: originalPost.user.displayName,
      },
    });
  } catch (error) {
    console.error('Repost to profile error:', error);
    return NextResponse.json({ error: 'Failed to repost to profile' }, { status: 500 });
  }
}
