import { useAuth } from './useAuth';
import { canAccessFeature, getUploadLimits, type SubscriptionTier } from '@/lib/stripe';

export type Feature =
  | 'panorama_upload'
  | 'profile_link'
  | 'high_quality_images'
  | '4k_video'
  | 'long_video'
  | 'no_ads'
  | 'reduced_ads';

// Feature to tier mapping
const FEATURE_REQUIREMENTS: Record<Feature, SubscriptionTier> = {
  panorama_upload: 'pro',
  profile_link: 'standard',
  high_quality_images: 'standard',
  '4k_video': 'pro',
  long_video: 'standard',
  no_ads: 'pro',
  reduced_ads: 'standard',
};

export function useTierGate() {
  const { user } = useAuth();
  const userTier = (user?.tier || 'free') as SubscriptionTier;

  const canAccess = (feature: Feature): boolean => {
    const requiredTier = FEATURE_REQUIREMENTS[feature];
    return canAccessFeature(userTier, requiredTier);
  };

  const getRequiredTier = (feature: Feature): SubscriptionTier => {
    return FEATURE_REQUIREMENTS[feature];
  };

  const limits = getUploadLimits(userTier);

  return {
    tier: userTier,
    canAccess,
    getRequiredTier,
    limits,
    isPro: userTier === 'pro',
    isStandard: userTier === 'standard',
    isFree: userTier === 'free',
  };
}
