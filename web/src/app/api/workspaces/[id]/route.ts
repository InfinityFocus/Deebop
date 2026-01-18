import { NextRequest, NextResponse } from 'next/server';
import { getIdentityFromToken } from '@/lib/auth';
import prisma from '@/lib/db';
import { canAccessFeature, type SubscriptionTier } from '@/lib/stripe';

// GET /api/workspaces/[id] - Get workspace details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await getIdentityFromToken();
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            profiles: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        members: {
          include: {
            identity: {
              select: {
                id: true,
                email: true,
                profiles: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        drafts: {
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            members: true,
            drafts: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check if user has access to this workspace
    const isMember = workspace.members.some((m) => m.identityId === identity.id);
    const isOwner = workspace.ownerId === identity.id;

    if (!isMember && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const currentMember = workspace.members.find((m) => m.identityId === identity.id);

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        isOwner,
        role: currentMember?.role || 'admin',
        memberCount: workspace._count.members,
        draftCount: workspace._count.drafts,
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
        owner: {
          id: workspace.owner.id,
          email: workspace.owner.email,
          profiles: workspace.owner.profiles,
        },
        members: workspace.members.map((m) => ({
          id: m.id,
          role: m.role,
          invitedAt: m.invitedAt.toISOString(),
          joinedAt: m.joinedAt?.toISOString() || null,
          identity: {
            id: m.identity.id,
            email: m.identity.email,
            profiles: m.identity.profiles,
          },
        })),
        recentDrafts: workspace.drafts.map((d) => ({
          id: d.id,
          contentType: d.contentType,
          headline: d.headline,
          status: d.status,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Get workspace error:', error);
    return NextResponse.json({ error: 'Failed to get workspace' }, { status: 500 });
  }
}

// PATCH /api/workspaces/[id] - Update workspace
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await getIdentityFromToken();
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name } = body;

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

    // Only owner or admin can update workspace
    const isOwner = workspace.ownerId === identity.id;
    const isAdmin = workspace.members.some((m) => m.role === 'admin');

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Only owner or admin can update workspace' }, { status: 403 });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ error: 'Workspace name must be 50 characters or less' }, { status: 400 });
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json({
      workspace: {
        id: updated.id,
        name: updated.name,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update workspace error:', error);
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id] - Delete workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await getIdentityFromToken();
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Only owner can delete workspace
    if (workspace.ownerId !== identity.id) {
      return NextResponse.json({ error: 'Only owner can delete workspace' }, { status: 403 });
    }

    await prisma.workspace.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete workspace error:', error);
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
  }
}
