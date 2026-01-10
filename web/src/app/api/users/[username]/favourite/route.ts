import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/users/[username]/favourite - Toggle favourite
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
      return NextResponse.json({ error: 'Cannot favourite yourself' }, { status: 400 });
    }

    // Check if already favourited
    const existingFavourite = await prisma.favourite.findUnique({
      where: {
        userId_favouriteId: {
          userId: user.id,
          favouriteId: targetUser.id,
        },
      },
    });

    if (existingFavourite) {
      // Remove from favourites
      await prisma.favourite.delete({
        where: {
          userId_favouriteId: {
            userId: user.id,
            favouriteId: targetUser.id,
          },
        },
      });

      // Update count
      await prisma.user.update({
        where: { id: user.id },
        data: { favouritesCount: { decrement: 1 } },
      });

      return NextResponse.json({ favourited: false });
    } else {
      // Add to favourites
      await prisma.favourite.create({
        data: {
          userId: user.id,
          favouriteId: targetUser.id,
        },
      });

      // Update count
      await prisma.user.update({
        where: { id: user.id },
        data: { favouritesCount: { increment: 1 } },
      });

      // Create notification for the favourited user
      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          type: 'favourite',
          actorId: user.id,
        },
      });

      return NextResponse.json({ favourited: true });
    }
  } catch (error) {
    console.error('Favourite error:', error);
    return NextResponse.json({ error: 'Failed to toggle favourite' }, { status: 500 });
  }
}
