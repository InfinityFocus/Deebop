/**
 * Cron job to delete media files scheduled for deletion
 * Runs daily to clean up media from posts deleted more than 7 days ago
 *
 * GET /api/cron/cleanup-media
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { deleteFromMinio } from '@/lib/minio';

// Batch size for processing deletions
const BATCH_SIZE = 50;

export async function GET() {
  try {
    const now = new Date();

    // Find all media files scheduled for deletion
    const pendingDeletions = await prisma.pendingMediaDeletion.findMany({
      where: {
        scheduledFor: {
          lte: now,
        },
      },
      take: BATCH_SIZE,
      orderBy: {
        scheduledFor: 'asc',
      },
    });

    if (pendingDeletions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No media scheduled for deletion',
        deleted: 0,
        errors: [],
      });
    }

    const results = {
      deleted: 0,
      errors: [] as Array<{ id: string; storageKey: string; error: string }>,
    };

    // Process each pending deletion
    for (const deletion of pendingDeletions) {
      try {
        // Delete from storage
        await deleteFromMinio(deletion.storageKey);

        // Remove the pending deletion record
        await prisma.pendingMediaDeletion.delete({
          where: { id: deletion.id },
        });

        results.deleted++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to delete media ${deletion.storageKey}:`, error);

        results.errors.push({
          id: deletion.id,
          storageKey: deletion.storageKey,
          error: errorMessage,
        });

        // If the error is "not found" (404), remove the record anyway
        // as the file may have already been deleted
        if (errorMessage.includes('NoSuchKey') || errorMessage.includes('404') || errorMessage.includes('not found')) {
          try {
            await prisma.pendingMediaDeletion.delete({
              where: { id: deletion.id },
            });
            // Remove from errors since we handled it
            results.errors.pop();
            results.deleted++;
          } catch {
            // Ignore error if we can't delete the record
          }
        }
      }
    }

    // Check if there are more items to process
    const remainingCount = await prisma.pendingMediaDeletion.count({
      where: {
        scheduledFor: {
          lte: now,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${results.deleted} media files`,
      deleted: results.deleted,
      errors: results.errors,
      remaining: remainingCount,
    });
  } catch (error) {
    console.error('Media cleanup cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process media cleanup',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
