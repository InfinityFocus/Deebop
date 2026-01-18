import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getIdentityFromToken } from '@/lib/auth';
import prisma from '@/lib/db';
import { canAccessFeature, type SubscriptionTier } from '@/lib/stripe';

// GET /api/workspaces - List workspaces for the current identity
export async function GET() {
  try {
    const identity = await getIdentityFromToken();
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Teams tier
    const tier = identity.tier as SubscriptionTier;
    if (!canAccessFeature(tier, 'teams')) {
      return NextResponse.json(
        {
          error: 'Workspaces require Teams tier',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Get workspaces owned by this identity
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { ownerId: identity.id },
      include: {
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
        _count: {
          select: {
            members: true,
            drafts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get workspaces where user is a member (not owner)
    const memberWorkspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            identityId: identity.id,
            joinedAt: { not: null },
          },
        },
        ownerId: { not: identity.id },
      },
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
              take: 1,
            },
          },
        },
        members: {
          where: { identityId: identity.id },
          select: { role: true },
        },
        _count: {
          select: {
            members: true,
            drafts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      owned: ownedWorkspaces.map((w) => ({
        id: w.id,
        name: w.name,
        isOwner: true,
        memberCount: w._count.members,
        draftCount: w._count.drafts,
        createdAt: w.createdAt.toISOString(),
        members: w.members.map((m) => ({
          id: m.id,
          role: m.role,
          joinedAt: m.joinedAt?.toISOString() || null,
          identity: {
            id: m.identity.id,
            email: m.identity.email,
            profiles: m.identity.profiles,
          },
        })),
      })),
      member: memberWorkspaces.map((w) => ({
        id: w.id,
        name: w.name,
        isOwner: false,
        role: w.members[0]?.role || 'editor',
        memberCount: w._count.members,
        draftCount: w._count.drafts,
        createdAt: w.createdAt.toISOString(),
        owner: {
          id: w.owner.id,
          email: w.owner.email,
          profile: w.owner.profiles[0] || null,
        },
      })),
    });
  } catch (error) {
    console.error('List workspaces error:', error);
    return NextResponse.json({ error: 'Failed to list workspaces' }, { status: 500 });
  }
}

// POST /api/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  try {
    const identity = await getIdentityFromToken();
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Teams tier
    const tier = identity.tier as SubscriptionTier;
    if (!canAccessFeature(tier, 'teams')) {
      return NextResponse.json(
        {
          error: 'Workspaces require Teams tier',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ error: 'Workspace name must be 50 characters or less' }, { status: 400 });
    }

    // Create workspace with the identity as owner and admin member
    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        ownerId: identity.id,
        members: {
          create: {
            identityId: identity.id,
            role: 'admin',
            joinedAt: new Date(),
          },
        },
      },
      include: {
        members: {
          include: {
            identity: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            drafts: true,
          },
        },
      },
    });

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        isOwner: true,
        memberCount: workspace._count.members,
        draftCount: workspace._count.drafts,
        createdAt: workspace.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
