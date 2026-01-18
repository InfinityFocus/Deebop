import { NextRequest, NextResponse } from 'next/server';
import { getIdentity } from '@/lib/auth';
import prisma from '@/lib/db';
import type { WorkspaceRole } from '@prisma/client';

// GET /api/workspaces/[id]/members - List workspace members
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

    const workspace = await prisma.workspace.findUnique({
      where: { id },
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
          orderBy: { invitedAt: 'asc' },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check if user has access
    const isMember = workspace.members.some((m) => m.identityId === identity.id);
    const isOwner = workspace.ownerId === identity.id;

    if (!isMember && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      members: workspace.members.map((m) => ({
        id: m.id,
        role: m.role,
        invitedAt: m.invitedAt.toISOString(),
        joinedAt: m.joinedAt?.toISOString() || null,
        isPending: !m.joinedAt,
        isOwner: workspace.ownerId === m.identityId,
        identity: {
          id: m.identity.id,
          email: m.identity.email,
          profiles: m.identity.profiles,
        },
      })),
    });
  } catch (error) {
    console.error('List workspace members error:', error);
    return NextResponse.json({ error: 'Failed to list members' }, { status: 500 });
  }
}

// POST /api/workspaces/[id]/members - Invite a member by email
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
    const { email, role = 'editor' } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const validRoles: WorkspaceRole[] = ['admin', 'editor', 'publisher', 'analyst'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

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

    // Only owner or admin can invite members
    const isOwner = workspace.ownerId === identity.id;
    const isAdmin = workspace.members.some((m) => m.role === 'admin');

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Only owner or admin can invite members' }, { status: 403 });
    }

    // Find the identity by email
    const inviteeIdentity = await prisma.identity.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        tier: true,
        profiles: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!inviteeIdentity) {
      return NextResponse.json({ error: 'User not found with that email' }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_identityId: {
          workspaceId: id,
          identityId: inviteeIdentity.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member or has pending invite' }, { status: 400 });
    }

    // Create the membership (pending until they accept)
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: id,
        identityId: inviteeIdentity.id,
        role: role as WorkspaceRole,
      },
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
    });

    // TODO: Send email notification about the invite

    return NextResponse.json({
      member: {
        id: member.id,
        role: member.role,
        invitedAt: member.invitedAt.toISOString(),
        joinedAt: null,
        isPending: true,
        identity: {
          id: member.identity.id,
          email: member.identity.email,
          profiles: member.identity.profiles,
        },
      },
    });
  } catch (error) {
    console.error('Invite workspace member error:', error);
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 });
  }
}

// PATCH /api/workspaces/[id]/members - Update member role or accept invite
export async function PATCH(
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
    const { memberId, action, role } = body;

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

    // Handle accept invite action (any invited user can accept their own invite)
    if (action === 'accept') {
      const myMembership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_identityId: {
            workspaceId: id,
            identityId: identity.id,
          },
        },
      });

      if (!myMembership) {
        return NextResponse.json({ error: 'No invite found' }, { status: 404 });
      }

      if (myMembership.joinedAt) {
        return NextResponse.json({ error: 'Already joined' }, { status: 400 });
      }

      const updated = await prisma.workspaceMember.update({
        where: { id: myMembership.id },
        data: { joinedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        joinedAt: updated.joinedAt?.toISOString(),
      });
    }

    // Handle update role action (requires admin)
    if (action === 'update_role' && memberId && role) {
      const isOwner = workspace.ownerId === identity.id;
      const isAdmin = workspace.members.some((m) => m.role === 'admin');

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Only owner or admin can update roles' }, { status: 403 });
      }

      const validRoles: WorkspaceRole[] = ['admin', 'editor', 'publisher', 'analyst'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      const member = await prisma.workspaceMember.findUnique({
        where: { id: memberId },
      });

      if (!member || member.workspaceId !== id) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      // Can't change owner's role
      if (member.identityId === workspace.ownerId) {
        return NextResponse.json({ error: 'Cannot change owner\'s role' }, { status: 400 });
      }

      const updated = await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { role: role as WorkspaceRole },
      });

      return NextResponse.json({
        success: true,
        role: updated.role,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update workspace member error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id]/members - Remove a member
export async function DELETE(
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
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

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

    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== id) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Can't remove owner
    if (member.identityId === workspace.ownerId) {
      return NextResponse.json({ error: 'Cannot remove workspace owner' }, { status: 400 });
    }

    // Users can remove themselves (leave workspace)
    if (member.identityId === identity.id) {
      await prisma.workspaceMember.delete({
        where: { id: memberId },
      });
      return NextResponse.json({ success: true });
    }

    // Otherwise, only owner or admin can remove members
    const isOwner = workspace.ownerId === identity.id;
    const isAdmin = workspace.members.some((m) => m.role === 'admin');

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Only owner or admin can remove members' }, { status: 403 });
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove workspace member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
