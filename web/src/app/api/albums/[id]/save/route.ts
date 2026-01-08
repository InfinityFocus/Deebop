import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/albums/[id]/save - Toggle save on album
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

    // Check if already saved
    const existingSave = await prisma.albumSave.findUnique({
      where: {
        userId_albumId: {
          userId: user.id,
          albumId,
        },
      },
    });

    if (existingSave) {
      // Unsave
      await prisma.$transaction(async (tx) => {
        await tx.albumSave.delete({
          where: {
            userId_albumId: {
              userId: user.id,
              albumId,
            },
          },
        });

        await tx.album.update({
          where: { id: albumId },
          data: { savesCount: { decrement: 1 } },
        });
      });

      return NextResponse.json({ saved: false });
    } else {
      // Save
      await prisma.$transaction(async (tx) => {
        await tx.albumSave.create({
          data: {
            userId: user.id,
            albumId,
          },
        });

        await tx.album.update({
          where: { id: albumId },
          data: { savesCount: { increment: 1 } },
        });
      });

      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('Toggle album save error:', error);
    return NextResponse.json({ error: 'Failed to toggle save' }, { status: 500 });
  }
}
