/**
 * Backfill script to update Post.mediaDurationSeconds from VideoJob.durationSeconds
 *
 * This fixes posts that were created before the video-job-processor was updated
 * to automatically populate Post.mediaDurationSeconds.
 *
 * Run with: npx tsx scripts/backfill-post-durations.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillPostDurations() {
  console.log('Starting backfill of post durations from VideoJob records...\n');

  // Find all VideoJobs that have a postId and durationSeconds but the Post doesn't have mediaDurationSeconds
  const jobsWithDuration = await prisma.videoJob.findMany({
    where: {
      postId: { not: null },
      durationSeconds: { not: null },
      status: 'completed',
    },
    select: {
      id: true,
      postId: true,
      durationSeconds: true,
      width: true,
      height: true,
      mediaType: true,
      post: {
        select: {
          id: true,
          mediaDurationSeconds: true,
          mediaWidth: true,
          mediaHeight: true,
          contentType: true,
        },
      },
    },
  });

  console.log(`Found ${jobsWithDuration.length} VideoJob records with duration data\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const job of jobsWithDuration) {
    if (!job.postId || !job.post) {
      console.log(`  Skipping job ${job.id} - no linked post`);
      skippedCount++;
      continue;
    }

    // Check if post needs updating
    const needsUpdate =
      job.post.mediaDurationSeconds === null ||
      job.post.mediaWidth === null ||
      job.post.mediaHeight === null;

    if (!needsUpdate) {
      console.log(`  Skipping post ${job.postId} - already has duration/dimensions`);
      skippedCount++;
      continue;
    }

    // Build update data
    const updateData: { mediaDurationSeconds?: number; mediaWidth?: number; mediaHeight?: number } = {};

    if (job.post.mediaDurationSeconds === null && job.durationSeconds !== null) {
      updateData.mediaDurationSeconds = job.durationSeconds;
    }

    if (job.post.mediaWidth === null && job.width !== null) {
      updateData.mediaWidth = job.width;
    }

    if (job.post.mediaHeight === null && job.height !== null) {
      updateData.mediaHeight = job.height;
    }

    if (Object.keys(updateData).length === 0) {
      skippedCount++;
      continue;
    }

    // Update the post
    await prisma.post.update({
      where: { id: job.postId },
      data: updateData,
    });

    console.log(`  Updated post ${job.postId} (${job.post.contentType}): duration=${job.durationSeconds}s, dimensions=${job.width}x${job.height}`);
    updatedCount++;
  }

  console.log(`\nBackfill complete!`);
  console.log(`  Updated: ${updatedCount} posts`);
  console.log(`  Skipped: ${skippedCount} posts`);

  await prisma.$disconnect();
}

backfillPostDurations().catch((error) => {
  console.error('Backfill failed:', error);
  prisma.$disconnect();
  process.exit(1);
});
