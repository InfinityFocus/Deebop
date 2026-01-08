/**
 * Deebop Media Processing Worker
 * Handles image compression, video transcoding, and panorama validation
 */

import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { processImage } from './processors/image';
import { processVideo } from './processors/video';
import { processPanorama } from './processors/panorama';

// Redis connection
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Media processing worker
const worker = new Worker(
  'media-processing',
  async (job) => {
    console.log(`Processing job ${job.id}: ${job.name}`);

    const { contentType, inputKey, outputKey, tier, postId } = job.data;

    try {
      let result;

      switch (contentType) {
        case 'image':
          result = await processImage({ tier, inputKey, outputKey });
          break;
        case 'video':
          result = await processVideo({ tier, inputKey, outputKey });
          break;
        case 'panorama360':
          result = await processPanorama({ tier, inputKey, outputKey });
          break;
        default:
          throw new Error(`Unknown content type: ${contentType}`);
      }

      console.log(`Job ${job.id} completed:`, result);
      return result;
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

// Event handlers
worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log('Deebop media worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});
