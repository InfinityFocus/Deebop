import { useAuth } from './useAuth';
import { canAccessFeature, getUploadLimits, type SubscriptionTier } from '@/lib/stripe';

export type Feature =
  | 'panorama_upload'
  | 'profile_link'
  | 'high_quality_images'
  | '4k_video'
  | 'long_video'
  | 'no_ads'
  | 'reduced_ads'
  | 'creator_page'
  | 'multi_publish'
  | 'workspace';

// Feature to tier mapping
const FEATURE_REQUIREMENTS: Record<Feature, SubscriptionTier> = {
  panorama_upload: 'creator',
  profile_link: 'creator',
  high_quality_images: 'creator',
  '4k_video': 'pro',
  long_video: 'creator',
  no_ads: 'pro',
  reduced_ads: 'creator',
  creator_page: 'creator',
  multi_publish: 'pro',
  workspace: 'teams',
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
    isCreator: userTier === 'creator',
    isTeams: userTier === 'teams',
    isFree: userTier === 'free',
    // Legacy - kept for backward compatibility
    isStandard: userTier === 'creator',
  };
}
