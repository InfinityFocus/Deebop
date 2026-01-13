import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/users/[username]/mute - Toggle mute (they won't know)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot mute yourself' }, { status: 400 });
    }

    // Check if already muted
    const existingMute = await prisma.mute.findUnique({
      where: {
        muterId_mutedId: {
          muterId: user.id,
          mutedId: targetUser.id,
        },
      },
    });

    if (existingMute) {
      // Unmute
      await prisma.mute.delete({
        where: {
          muterId_mutedId: {
            muterId: user.id,
            mutedId: targetUser.id,
          },
        },
      });

      return NextResponse.json({ muted: false });
    } else {
      // Mute user (no notification - they shouldn't know)
      await prisma.mute.create({
        data: {
          muterId: user.id,
          mutedId: targetUser.id,
        },
      });

      return NextResponse.json({ muted: true });
    }
  } catch (error) {
    console.error('Mute error:', error);
    return NextResponse.json({ error: 'Failed to toggle mute' }, { status: 500 });
  }
}

// GET /api/users/[username]/mute - Check if user is muted
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const mute = await prisma.mute.findUnique({
      where: {
        muterId_mutedId: {
          muterId: user.id,
          mutedId: targetUser.id,
        },
      },
    });

    return NextResponse.json({ muted: !!mute });
  } catch (error) {
    console.error('Check mute error:', error);
    return NextResponse.json({ error: 'Failed to check mute status' }, { status: 500 });
  }
}
