import { NextRequest, NextResponse } from 'next/server';
import { getIdentity } from '@/lib/auth';
import prisma from '@/lib/db';
import type { ContentType, DraftStatus } from '@prisma/client';

// GET /api/workspaces/[id]/drafts - List workspace drafts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as DraftStatus | null;

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

    // Check if user has access
    const currentMember = workspace.members[0];
    const isOwner = workspace.ownerId === identity.id;

    if (!currentMember && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (currentMember && !currentMember.joinedAt) {
      return NextResponse.json({ error: 'Please accept the workspace invite first' }, { status: 403 });
    }

    // Build filter
    const where: Record<string, unknown> = { workspaceId: id };
    if (status) {
      where.status = status;
    }

    const drafts = await prisma.draft.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    // Get author info for each draft
    const authorIds = [...new Set(drafts.map((d) => d.authorId))];
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });
    const authorMap = new Map(authors.map((a) => [a.id, a]));

    return NextResponse.json({
      drafts: drafts.map((d) => ({
        id: d.id,
        contentType: d.contentType,
        description: d.description,
        headline: d.headline,
        mediaUrl: d.mediaUrl,
        status: d.status,
        reviewNotes: d.reviewNotes,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        author: authorMap.get(d.authorId) || null,
      })),
    });
  } catch (error) {
    console.error('List workspace drafts error:', error);
    return NextResponse.json({ error: 'Failed to list drafts' }, { status: 500 });
  }
}

// POST /api/workspaces/[id]/drafts - Create a draft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { contentType, description, headline, mediaUrl, profileId } = body;

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

    if (currentMember && !currentMember.joinedAt) {
      return NextResponse.json({ error: 'Please accept the workspace invite first' }, { status: 403 });
    }

    // Validate content type
    const validContentTypes: ContentType[] = ['shout', 'image', 'video', 'audio', 'panorama360'];
    if (!contentType || !validContentTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Validate profile belongs to identity
    if (profileId) {
      const profile = await prisma.user.findUnique({
        where: { id: profileId },
        select: { identityId: true },
      });

      if (!profile || profile.identityId !== identity.id) {
        return NextResponse.json({ error: 'Invalid profile' }, { status: 400 });
      }
    }

    // Get the first profile for this identity as the author
    const authorProfile = await prisma.user.findFirst({
      where: { identityId: identity.id },
      select: { id: true },
    });

    if (!authorProfile) {
      return NextResponse.json({ error: 'No profile found' }, { status: 400 });
    }

    const draft = await prisma.draft.create({
      data: {
        workspaceId: id,
        authorId: authorProfile.id,
        contentType: contentType as ContentType,
        description: description?.trim() || null,
        headline: headline?.trim() || null,
        mediaUrl: mediaUrl || null,
        status: 'draft',
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
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create workspace draft error:', error);
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
  }
}
