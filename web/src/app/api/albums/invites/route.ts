import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/albums/invites - List pending invites for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const invites = await prisma.albumInvite.findMany({
      where: {
        inviteeId: user.id,
        status: status as 'pending' | 'accepted' | 'declined',
      },
      include: {
        album: {
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
            itemsCount: true,
            membersCount: true,
            owner: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        inviter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      invites: invites.map((invite) => ({
        id: invite.id,
        role: invite.role,
        message: invite.message,
        status: invite.status,
        created_at: invite.createdAt.toISOString(),
        responded_at: invite.respondedAt?.toISOString() || null,
        album: {
          id: invite.album.id,
          title: invite.album.title,
          cover_image_url: invite.album.coverImageUrl,
          items_count: invite.album.itemsCount,
          members_count: invite.album.membersCount,
          owner: {
            id: invite.album.owner.id,
            username: invite.album.owner.username,
            display_name: invite.album.owner.displayName,
            avatar_url: invite.album.owner.avatarUrl,
          },
        },
        inviter: {
          id: invite.inviter.id,
          username: invite.inviter.username,
          display_name: invite.inviter.displayName,
          avatar_url: invite.inviter.avatarUrl,
        },
      })),
    });
  } catch (error) {
    console.error('Get album invites error:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
}
