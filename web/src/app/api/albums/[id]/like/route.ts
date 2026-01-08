import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/albums/[id]/like - Toggle like on album
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
      select: { id: true },
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await prisma.albumLike.findUnique({
      where: {
        userId_albumId: {
          userId: user.id,
          albumId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.$transaction(async (tx) => {
        await tx.albumLike.delete({
          where: {
            userId_albumId: {
              userId: user.id,
              albumId,
            },
          },
        });

        await tx.album.update({
          where: { id: albumId },
          data: { likesCount: { decrement: 1 } },
        });
      });

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.$transaction(async (tx) => {
        await tx.albumLike.create({
          data: {
            userId: user.id,
            albumId,
          },
        });

        await tx.album.update({
          where: { id: albumId },
          data: { likesCount: { increment: 1 } },
        });
      });

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Toggle album like error:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
