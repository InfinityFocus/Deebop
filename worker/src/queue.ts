/**
 * Queue utilities for media processing
 * Can be imported by the web app to add jobs
 */

import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const mediaQueue = new Queue('media-processing', { connection });

interface AddMediaJobOptions {
  postId: string;
  contentType: 'image' | 'video' | 'panorama360';
  tier: 'free' | 'standard' | 'pro';
  inputKey: string;
  outputKey: string;
}

export async function addMediaJob(options: AddMediaJobOptions) {
  const job = await mediaQueue.add(options.contentType, options, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  });

  return job.id;
}

export async function getJobStatus(jobId: string) {
  const job = await mediaQueue.getJob(jobId);
  if (!job) return null;

  return {
    id: job.id,
    state: await job.getState(),
    progress: job.progress,
    result: job.returnvalue,
    error: job.failedReason,
  };
}
