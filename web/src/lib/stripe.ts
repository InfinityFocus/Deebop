import Stripe from 'stripe';

// Stripe is optional for beta - only initialize if key is provided
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set - payments are disabled');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// Check if Stripe is configured
export function isStripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// Legacy export for backward compatibility - use getStripe() instead
export const stripe = {
  get instance() {
    return getStripe();
  },
};

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    tagline: 'Get started with the basics',
    features: [
      '1 Profile',
      'Videos up to 30s',
      'Audio up to 1 min',
      'Album storage (2GB)',
      '3 scheduled drops max',
      'Full ads',
    ],
  },
  creator: {
    name: 'Creator',
    price: 399, // £3.99 in pence
    priceId: process.env.STRIPE_CREATOR_PRICE_ID,
    tagline: 'Two profiles, post to one at a time. Repost across profiles when it makes sense.',
    features: [
      '2 Profiles',
      'Videos up to 3 min',
      'Audio up to 5 min',
      '360 Panoramas (100MB)',
      'Album storage (10GB)',
      'Creator Page (basic)',
      'Profile link',
      'Unlimited scheduled drops',
      'Reduced ads',
    ],
  },
  pro: {
    name: 'Pro',
    price: 999, // £9.99 in pence
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    tagline: 'Publish once, share across your profiles when it makes sense.',
    features: [
      '5 Profiles',
      'Videos up to 10 min',
      'Audio up to 30 min',
      '360 Panoramas (100MB)',
      'Album storage (50GB)',
      'Creator Page (full)',
      'Profile link',
      'Multi-profile publishing',
      'Unlimited scheduled drops',
      'No ads',
    ],
  },
  teams: {
    name: 'Teams',
    price: 2499, // £24.99 in pence
    priceId: process.env.STRIPE_TEAMS_PRICE_ID,
    tagline: 'One workspace, many profiles, with role-based publishing controls.',
    features: [
      '30 Profiles',
      'Videos up to 10 min',
      'Audio up to 1 hour',
      '360 Panoramas (100MB)',
      'Album storage (100GB)',
      'Creator Page (full)',
      'Profile link',
      'Multi-profile publishing',
      'Role-gated multi-publish',
      'Workspace with drafts workflow',
      'Unlimited scheduled drops',
      'No ads',
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Get price ID for a tier
export function getPriceIdForTier(tier: SubscriptionTier): string | null {
  if (tier === 'free') return null;
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  return 'priceId' in tierConfig ? tierConfig.priceId || null : null;
}

// Check if user can access a feature
export function canAccessFeature(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  const tierOrder: SubscriptionTier[] = ['free', 'creator', 'pro', 'teams'];
  return tierOrder.indexOf(userTier) >= tierOrder.indexOf(requiredTier);
}

// Get upload limits for a tier
export function getUploadLimits(tier: SubscriptionTier) {
  const limits = {
    free: {
      maxImageSize: 50 * 1024 * 1024, // 50MB (images are resized/compressed server-side)
      maxVideoSize: 50 * 1024 * 1024, // 50MB
      maxVideoDuration: 30, // seconds
      maxAudioDuration: 60, // 1 minute
      maxVideoResolution: 720,
      canUploadPanorama: false,
      maxPanoramaSize: 0,
      maxAlbumStorage: 2 * 1024 * 1024 * 1024, // 2GB
      maxActiveDrops: 3, // max scheduled posts
      canMultiPublish: false,
      hasWorkspace: false,
    },
    creator: {
      maxImageSize: 50 * 1024 * 1024, // 50MB (images are resized/compressed server-side)
      maxVideoSize: 200 * 1024 * 1024, // 200MB
      maxVideoDuration: 180, // 3 minutes
      maxAudioDuration: 300, // 5 minutes
      maxVideoResolution: 1080,
      canUploadPanorama: true,
      maxPanoramaSize: 100 * 1024 * 1024, // 100MB
      maxAlbumStorage: 10 * 1024 * 1024 * 1024, // 10GB
      maxActiveDrops: null, // unlimited
      canMultiPublish: false, // repost only
      hasWorkspace: false,
    },
    pro: {
      maxImageSize: 50 * 1024 * 1024, // 50MB (images are resized/compressed server-side)
      maxVideoSize: 500 * 1024 * 1024, // 500MB
      maxVideoDuration: 600, // 10 minutes
      maxAudioDuration: 1800, // 30 minutes
      maxVideoResolution: 2160, // 4K
      canUploadPanorama: true,
      maxPanoramaSize: 100 * 1024 * 1024, // 100MB
      maxAlbumStorage: 50 * 1024 * 1024 * 1024, // 50GB
      maxActiveDrops: null, // unlimited
      canMultiPublish: true,
      hasWorkspace: false,
    },
    teams: {
      maxImageSize: 50 * 1024 * 1024, // 50MB (images are resized/compressed server-side)
      maxVideoSize: 500 * 1024 * 1024, // 500MB
      maxVideoDuration: 600, // 10 minutes
      maxAudioDuration: 3600, // 1 hour
      maxVideoResolution: 2160, // 4K
      canUploadPanorama: true,
      maxPanoramaSize: 100 * 1024 * 1024, // 100MB
      maxAlbumStorage: 100 * 1024 * 1024 * 1024, // 100GB
      maxActiveDrops: null, // unlimited
      canMultiPublish: true,
      hasWorkspace: true,
    },
  };
  return limits[tier];
}
