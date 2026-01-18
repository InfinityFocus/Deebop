import { NextRequest, NextResponse } from 'next/server';
import { getIdentity } from '@/lib/auth';
import prisma from '@/lib/db';
import type { DraftStatus } from '@prisma/client';

// GET /api/workspaces/[id]/drafts/[draftId] - Get draft details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; draftId: string }> }
) {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, draftId } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          where: { identityId: identity.id },
          select: { role: true, joinedAt: true },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const currentMember = workspace.members[0];
    const isOwner = workspace.ownerId === identity.id;

    if (!currentMember && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
    });

    if (!draft || draft.workspaceId !== id) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Get author info
    const author = await prisma.user.findUnique({
      where: { id: draft.authorId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      draft: {
        id: draft.id,
        contentType: draft.contentType,
        description: draft.description,
        headline: draft.headline,
        mediaUrl: draft.mediaUrl,
        status: draft.status,
        reviewNotes: draft.reviewNotes,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
        author,
      },
    });
  } catch (error) {
    console.error('Get workspace draft error:', error);
    return NextResponse.json({ error: 'Failed to get draft' }, { status: 500 });
  }
}

// PATCH /api/workspaces/[id]/drafts/[draftId] - Update draft or change status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; draftId: string }> }
) {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, draftId } = await params;
    const body = await request.json();
    const { action, description, headline, mediaUrl, reviewNotes, targetProfileIds } = body;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          where: { identityId: identity.id },
          select: { role: true, joinedAt: true },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const currentMember = workspace.members[0];
    const isOwner = workspace.ownerId === identity.id;
    const role = currentMember?.role || (isOwner ? 'admin' : null);

    if (!role) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
    });

    if (!draft || draft.workspaceId !== id) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Handle status change actions
    if (action) {
      switch (action) {
        case 'submit_for_review': {
          // Anyone can submit their own draft for review
          if (draft.status !== 'draft') {
            return NextResponse.json({ error: 'Only drafts can be submitted for review' }, { status: 400 });
          }
          const updated = await prisma.draft.update({
            where: { id: draftId },
            data: { status: 'pending_review' },
          });
          return NextResponse.json({ draft: { id: updated.id, status: updated.status } });
        }

        case 'approve': {
          // Only admin or publisher can approve
          if (role !== 'admin' && role !== 'publisher') {
            return NextResponse.json({ error: 'Only admin or publisher can approve drafts' }, { status: 403 });
          }
          if (draft.status !== 'pending_review') {
            return NextResponse.json({ error: 'Only pending drafts can be approved' }, { status: 400 });
          }
          const updated = await prisma.draft.update({
            where: { id: draftId },
            data: {
              status: 'approved',
              reviewerId: identity.id,
              reviewNotes: reviewNotes || null,
            },
          });
          return NextResponse.json({ draft: { id: updated.id, status: updated.status } });
        }

        case 'reject': {
          // Only admin or publisher can reject
          if (role !== 'admin' && role !== 'publisher') {
            return NextResponse.json({ error: 'Only admin or publisher can reject drafts' }, { status: 403 });
          }
          if (draft.status !== 'pending_review') {
            return NextResponse.json({ error: 'Only pending drafts can be rejected' }, { status: 400 });
          }
          if (!reviewNotes) {
            return NextResponse.json({ error: 'Review notes are required for rejection' }, { status: 400 });
          }
          const updated = await prisma.draft.update({
            where: { id: draftId },
            data: {
              status: 'rejected',
              reviewerId: identity.id,
              reviewNotes,
            },
          });
          return NextResponse.json({ draft: { id: updated.id, status: updated.status } });
        }

        case 'resubmit': {
          // Anyone can resubmit a rejected draft
          if (draft.status !== 'rejected') {
            return NextResponse.json({ error: 'Only rejected drafts can be resubmitted' }, { status: 400 });
          }
          const updated = await prisma.draft.update({
            where: { id: draftId },
            data: {
              status: 'pending_review',
              reviewerId: null,
              reviewNotes: null,
            },
          });
          return NextResponse.json({ draft: { id: updated.id, status: updated.status } });
        }

        case 'publish': {
          // Only admin or publisher can publish
          if (role !== 'admin' && role !== 'publisher') {
            return NextResponse.json({ error: 'Only admin or publisher can publish drafts' }, { status: 403 });
          }
          if (draft.status !== 'approved') {
            return NextResponse.json({ error: 'Only approved drafts can be published' }, { status: 400 });
          }
          if (!targetProfileIds || !Array.isArray(targetProfileIds) || targetProfileIds.length === 0) {
            return NextResponse.json({ error: 'Target profile IDs are required' }, { status: 400 });
          }

          // Validate target profiles belong to workspace members' identities
          const memberIdentityIds = await prisma.workspaceMember.findMany({
            where: {
              workspaceId: id,
              joinedAt: { not: null },
            },
            select: { identityId: true },
          });

          const validProfiles = await prisma.user.findMany({
            where: {
              id: { in: targetProfileIds },
              identityId: { in: memberIdentityIds.map((m) => m.identityId) },
            },
            select: { id: true },
          });

          if (validProfiles.length !== targetProfileIds.length) {
            return NextResponse.json({ error: 'Some target profiles are not valid workspace member profiles' }, { status: 400 });
          }

          // Create posts for each target profile
          const posts = await prisma.$transaction(async (tx) => {
            const createdPosts = [];

            for (const profileId of targetProfileIds) {
              const post = await tx.post.create({
                data: {
                  userId: profileId,
                  contentType: draft.contentType,
                  headline: draft.headline,
                  description: draft.description,
                  mediaUrl: draft.mediaUrl,
                  visibility: 'public',
                  provenance: 'original',
                  status: 'published',
                },
              });
              createdPosts.push(post);
            }

            // Mark draft as published
            await tx.draft.update({
              where: { id: draftId },
              data: { status: 'published' },
            });

            return createdPosts;
          });

          return NextResponse.json({
            success: true,
            publishedTo: posts.map((p) => ({ postId: p.id, profileId: p.userId })),
          });
        }

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    }

    // Handle regular update (content changes)
    if (draft.status !== 'draft' && draft.status !== 'rejected') {
      return NextResponse.json({ error: 'Can only edit drafts in draft or rejected status' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (headline !== undefined) updateData.headline = headline?.trim() || null;
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl || null;

    // If resubmitting after rejection, change status back to draft
    if (draft.status === 'rejected') {
      updateData.status = 'draft';
      updateData.reviewerId = null;
      updateData.reviewNotes = null;
    }

    const updated = await prisma.draft.update({
      where: { id: draftId },
      data: updateData,
    });

    return NextResponse.json({
      draft: {
        id: updated.id,
        contentType: updated.contentType,
        description: updated.description,
        headline: updated.headline,
        mediaUrl: updated.mediaUrl,
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update workspace draft error:', error);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id]/drafts/[draftId] - Delete draft
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; draftId: string }> }
) {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, draftId } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          where: { identityId: identity.id },
          select: { role: true },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const currentMember = workspace.members[0];
    const isOwner = workspace.ownerId === identity.id;
    const role = currentMember?.role || (isOwner ? 'admin' : null);

    if (!role) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
    });

    if (!draft || draft.workspaceId !== id) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Get the author's profile
    const authorProfile = await prisma.user.findUnique({
      where: { id: draft.authorId },
      select: { identityId: true },
    });

    // Author can delete their own drafts, admins can delete any
    const isAuthor = authorProfile?.identityId === identity.id;
    const isAdmin = role === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Only author or admin can delete this draft' }, { status: 403 });
    }

    await prisma.draft.delete({
      where: { id: draftId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete workspace draft error:', error);
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
  }
}
