import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Images up to 500KB (compressed)',
      'Videos up to 30s @ 720p',
      'Basic feed access',
      'Full ads',
    ],
  },
  standard: {
    name: 'Standard',
    price: 599, // £5.99 in pence
    priceId: process.env.STRIPE_STANDARD_PRICE_ID,
    features: [
      'Images up to 10MB (original quality)',
      'Videos up to 1min @ 1080p',
      'Reduced ads',
      'Profile link',
    ],
  },
  pro: {
    name: 'Pro',
    price: 1499, // £14.99 in pence
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Images up to 50MB (original quality)',
      'Videos up to 5min @ 4K',
      '360 Panorama uploads (100MB)',
      'No ads',
      'Profile link',
      'Priority support',
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Get price ID for a tier
export function getPriceIdForTier(tier: SubscriptionTier): string | null {
  if (tier === 'free') return null;
  return SUBSCRIPTION_TIERS[tier].priceId || null;
}

// Check if user can access a feature
export function canAccessFeature(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  const tierOrder: SubscriptionTier[] = ['free', 'standard', 'pro'];
  return tierOrder.indexOf(userTier) >= tierOrder.indexOf(requiredTier);
}

// Get upload limits for a tier
export function getUploadLimits(tier: SubscriptionTier) {
  const limits = {
    free: {
      maxImageSize: 500 * 1024, // 500KB
      maxVideoSize: 50 * 1024 * 1024, // 50MB
      maxVideoDuration: 30, // seconds
      maxVideoResolution: 720,
      canUploadPanorama: false,
      maxPanoramaSize: 0,
    },
    standard: {
      maxImageSize: 10 * 1024 * 1024, // 10MB
      maxVideoSize: 200 * 1024 * 1024, // 200MB
      maxVideoDuration: 60, // seconds
      maxVideoResolution: 1080,
      canUploadPanorama: false,
      maxPanoramaSize: 0,
    },
    pro: {
      maxImageSize: 50 * 1024 * 1024, // 50MB
      maxVideoSize: 500 * 1024 * 1024, // 500MB
      maxVideoDuration: 300, // 5 minutes
      maxVideoResolution: 2160, // 4K
      canUploadPanorama: true,
      maxPanoramaSize: 100 * 1024 * 1024, // 100MB
    },
  };
  return limits[tier];
}
