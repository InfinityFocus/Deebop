/**
 * Script to link existing Posts to their VideoJobs by matching media URLs
 * Also updates Post.mediaDurationSeconds from VideoJob.durationSeconds
 *
 * Run with: npx tsx scripts/link-posts-to-videojobs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function linkPostsToVideoJobs() {
  console.log('Linking Posts to VideoJobs by URL matching...\n');

  // Get all completed VideoJobs that don't have a postId
  const unlinkedJobs = await prisma.videoJob.findMany({
    where: {
      postId: null,
      status: 'completed',
      outputUrl: { not: null },
    },
    select: {
      id: true,
      outputUrl: true,
      durationSeconds: true,
      width: true,
      height: true,
      mediaType: true,
    },
  });

  console.log(`Found ${unlinkedJobs.length} unlinked completed VideoJobs\n`);

  let linkedCount = 0;
  let updatedCount = 0;
  let notFoundCount = 0;

  for (const job of unlinkedJobs) {
    if (!job.outputUrl) continue;

    // Find a Post with matching mediaUrl
    const matchingPost = await prisma.post.findFirst({
      where: {
        mediaUrl: job.outputUrl,
      },
      select: {
        id: true,
        contentType: true,
        mediaDurationSeconds: true,
        mediaWidth: true,
        mediaHeight: true,
      },
    });

    if (!matchingPost) {
      console.log(`  No matching post found for job ${job.id} (${job.mediaType})`);
      notFoundCount++;
      continue;
    }

    console.log(`  Found matching post ${matchingPost.id} for job ${job.id} (${job.mediaType})`);

    // Link the VideoJob to the Post
    await prisma.videoJob.update({
      where: { id: job.id },
      data: { postId: matchingPost.id },
    });
    linkedCount++;

    // Update Post with duration/dimensions if missing
    const updateData: {
      mediaDurationSeconds?: number;
      mediaWidth?: number;
      mediaHeight?: number;
    } = {};

    if (matchingPost.mediaDurationSeconds === null && job.durationSeconds !== null) {
      updateData.mediaDurationSeconds = job.durationSeconds;
    }

    if (matchingPost.mediaWidth === null && job.width !== null) {
      updateData.mediaWidth = job.width;
    }

    if (matchingPost.mediaHeight === null && job.height !== null) {
      updateData.mediaHeight = job.height;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.post.update({
        where: { id: matchingPost.id },
        data: updateData,
      });
      console.log(`    Updated post with: duration=${job.durationSeconds}s, dimensions=${job.width}x${job.height}`);
      updatedCount++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`VideoJobs linked to Posts: ${linkedCount}`);
  console.log(`Posts updated with duration/dimensions: ${updatedCount}`);
  console.log(`VideoJobs with no matching Post: ${notFoundCount}`);

  await prisma.$disconnect();
}

linkPostsToVideoJobs().catch((error) => {
  console.error('Script failed:', error);
  prisma.$disconnect();
  process.exit(1);
});
