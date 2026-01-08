import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { canDeleteAlbumItem, canEditAlbumItem } from '@/lib/album-permissions';
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

// PATCH /api/albums/[id]/items/[itemId] - Update item (caption, sort order)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: albumId, itemId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check item exists
    const item = await prisma.albumItem.findUnique({
      where: { id: itemId },
      include: { album: true },
    });

    if (!item || item.albumId !== albumId) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check permission
    const userRole = await getUserAlbumRole(albumId, user.id);
    const isItemUploader = item.uploaderId === user.id;

    if (!canEditAlbumItem(userRole, isItemUploader)) {
      return NextResponse.json({ error: 'You do not have permission to edit this item' }, { status: 403 });
    }

    const body = await request.json();
    const { caption, sortOrder } = body;

    const updateData: any = {};

    if (caption !== undefined) {
      updateData.caption = caption?.trim() || null;
    }

    if (sortOrder !== undefined) {
      if (typeof sortOrder !== 'number' || sortOrder < 0) {
        return NextResponse.json({ error: 'Invalid sort order' }, { status: 400 });
      }
      updateData.sortOrder = sortOrder;
    }

    const updatedItem = await prisma.albumItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      item: {
        id: updatedItem.id,
        content_type: updatedItem.contentType,
        media_url: updatedItem.mediaUrl,
        thumbnail_url: updatedItem.thumbnailUrl,
        caption: updatedItem.caption,
        provenance: updatedItem.provenance,
        sort_order: updatedItem.sortOrder,
        created_at: updatedItem.createdAt.toISOString(),
        uploader: {
          id: updatedItem.uploader.id,
          username: updatedItem.uploader.username,
          display_name: updatedItem.uploader.displayName,
          avatar_url: updatedItem.uploader.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error('Update album item error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE /api/albums/[id]/items/[itemId] - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: albumId, itemId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check item exists
    const item = await prisma.albumItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.albumId !== albumId) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check permission
    const userRole = await getUserAlbumRole(albumId, user.id);
    const isItemUploader = item.uploaderId === user.id;

    if (!canDeleteAlbumItem(userRole, isItemUploader)) {
      return NextResponse.json({ error: 'You do not have permission to delete this item' }, { status: 403 });
    }

    // Delete item and update album count
    await prisma.$transaction(async (tx) => {
      await tx.albumItem.delete({
        where: { id: itemId },
      });

      await tx.album.update({
        where: { id: albumId },
        data: { itemsCount: { decrement: 1 } },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete album item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
