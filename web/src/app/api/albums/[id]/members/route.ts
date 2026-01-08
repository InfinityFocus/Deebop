import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { hasAlbumPermission, canInviteWithRole } from '@/lib/album-permissions';
import { AlbumRole } from '@prisma/client';

// Helper to get user's role in an album
async function getUserAlbumRole(albumId: string, userId: string): Promise<AlbumRole | null> {
  const member = await prisma.albumMember.findUnique({
    where: {
      albumId_userId: {
        albumId,
        userId,
      },
    },
  });
  return member?.role || null;
}

// GET /api/albums/[id]/members - List album members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params;
    const user = await getCurrentUser();

    // Check album exists
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: { id: true, visibility: true, ownerId: true },
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // For non-public albums, check access
    if (album.visibility !== 'public' && user) {
      const userRole = await getUserAlbumRole(albumId, user.id);
      if (!userRole && album.ownerId !== user.id) {
        return NextResponse.json({ error: 'Album not found' }, { status: 404 });
      }
    }

    const members = await prisma.albumMember.findMany({
      where: { albumId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // owner first, then co_owner, then contributor
        { joinedAt: 'asc' },
      ],
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        joined_at: m.joinedAt.toISOString(),
        user: {
          id: m.user.id,
          username: m.user.username,
          display_name: m.user.displayName,
          avatar_url: m.user.avatarUrl,
        },
      })),
    });
  } catch (error) {
    console.error('Get album members error:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

// POST /api/albums/[id]/members - Invite a member (creates an invite)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check album exists
    const album = await prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Check permission
    const userRole = await getUserAlbumRole(albumId, user.id);
    if (!hasAlbumPermission(userRole, 'manage_members')) {
      return NextResponse.json({ error: 'You do not have permission to invite members' }, { status: 403 });
    }

    const body = await request.json();
    const { userId: inviteeId, role: targetRole, message } = body;

    if (!inviteeId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate role
    const validRoles: AlbumRole[] = ['co_owner', 'contributor'];
    if (!targetRole || !validRoles.includes(targetRole)) {
      return NextResponse.json({ error: 'Invalid role. Must be co_owner or contributor.' }, { status: 400 });
    }

    // Check if inviter can invite with this role
    if (!canInviteWithRole(userRole, targetRole)) {
      return NextResponse.json({ error: 'You cannot invite members with this role' }, { status: 403 });
    }

    // Check invitee exists
    const invitee = await prisma.user.findUnique({
      where: { id: inviteeId },
      select: { id: true, username: true },
    });

    if (!invitee) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await prisma.albumMember.findUnique({
      where: {
        albumId_userId: {
          albumId,
          userId: inviteeId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this album' }, { status: 400 });
    }

    // Check if invite already exists
    const existingInvite = await prisma.albumInvite.findUnique({
      where: {
        albumId_inviteeId: {
          albumId,
          inviteeId,
        },
      },
    });

    if (existingInvite && existingInvite.status === 'pending') {
      return NextResponse.json({ error: 'An invite is already pending for this user' }, { status: 400 });
    }

    // Create or update invite
    const invite = await prisma.albumInvite.upsert({
      where: {
        albumId_inviteeId: {
          albumId,
          inviteeId,
        },
      },
      create: {
        albumId,
        inviterId: user.id,
        inviteeId,
        role: targetRole,
        message: message?.trim() || null,
        status: 'pending',
      },
      update: {
        inviterId: user.id,
        role: targetRole,
        message: message?.trim() || null,
        status: 'pending',
        respondedAt: null,
      },
      include: {
        invitee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        album: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      invite: {
        id: invite.id,
        role: invite.role,
        message: invite.message,
        status: invite.status,
        created_at: invite.createdAt.toISOString(),
        invitee: {
          id: invite.invitee.id,
          username: invite.invitee.username,
          display_name: invite.invitee.displayName,
          avatar_url: invite.invitee.avatarUrl,
        },
        album: {
          id: invite.album.id,
          title: invite.album.title,
        },
      },
    });
  } catch (error) {
    console.error('Invite album member error:', error);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
