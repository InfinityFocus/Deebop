// Storage utilities for identity-level storage calculation
// Storage limits are per-identity (across all profiles under that identity)

import prisma from './db';
import { getUploadLimits, type SubscriptionTier } from './stripe';

export interface StorageUsage {
  usedBytes: number;
  maxBytes: number;
  percentage: number;
  formattedUsed: string;
  formattedMax: string;
}

/**
 * Get total storage usage for an identity (sum across all profiles)
 * This includes album storage only (not regular posts)
 */
export async function getIdentityStorageUsage(identityId: string): Promise<StorageUsage> {
  // Get identity with tier info
  const identity = await prisma.identity.findUnique({
    where: { id: identityId },
    select: {
      tier: true,
      profiles: {
        select: { id: true }
      }
    },
  });

  if (!identity) {
    return {
      usedBytes: 0,
      maxBytes: 0,
      percentage: 0,
      formattedUsed: '0 B',
      formattedMax: '0 B',
    };
  }

  const tier = identity.tier as SubscriptionTier;
  const limits = getUploadLimits(tier);
  const maxBytes = limits.maxAlbumStorage;

  // Get all profile IDs for this identity
  const profileIds = identity.profiles.map(p => p.id);

  if (profileIds.length === 0) {
    return {
      usedBytes: 0,
      maxBytes,
      percentage: 0,
      formattedUsed: '0 B',
      formattedMax: formatBytes(maxBytes),
    };
  }

  // Sum storage usage across all albums owned by any profile under this identity
  const storageResult = await prisma.albumItem.aggregate({
    where: {
      album: {
        ownerId: { in: profileIds }
      }
    },
    _sum: {
      fileSize: true
    }
  });

  const usedBytes = storageResult._sum.fileSize || 0;
  const percentage = maxBytes > 0 ? Math.round((usedBytes / maxBytes) * 100) : 0;

  return {
    usedBytes,
    maxBytes,
    percentage: Math.min(percentage, 100),
    formattedUsed: formatBytes(usedBytes),
    formattedMax: formatBytes(maxBytes),
  };
}

/**
 * Get storage usage for a specific profile (useful for profile-level display)
 */
export async function getProfileStorageUsage(profileId: string): Promise<number> {
  const storageResult = await prisma.albumItem.aggregate({
    where: {
      album: {
        ownerId: profileId
      }
    },
    _sum: {
      fileSize: true
    }
  });

  return storageResult._sum.fileSize || 0;
}

/**
 * Check if an identity has available storage for a file of given size
 */
export async function hasAvailableStorage(
  identityId: string,
  fileSizeBytes: number
): Promise<{ allowed: boolean; currentUsage: StorageUsage }> {
  const usage = await getIdentityStorageUsage(identityId);
  const allowed = (usage.usedBytes + fileSizeBytes) <= usage.maxBytes;

  return { allowed, currentUsage: usage };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get remaining storage in bytes for an identity
 */
export async function getRemainingStorage(identityId: string): Promise<number> {
  const usage = await getIdentityStorageUsage(identityId);
  return Math.max(0, usage.maxBytes - usage.usedBytes);
}
