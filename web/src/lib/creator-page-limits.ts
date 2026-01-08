// Creator Page Tier Limits
// Feature gating for Standard vs Pro tiers

export interface CreatorPageLimits {
  maxBlocks: number;
  maxLinks: number;
  analyticsRangeDays: number;
  canHideBranding: boolean;
  canCustomizeTheme: boolean;
  canViewReferrers: boolean;
  canViewCtr: boolean;
  themes: string[];
}

export const CREATOR_PAGE_LIMITS: Record<'standard' | 'pro', CreatorPageLimits> = {
  standard: {
    maxBlocks: 10,
    maxLinks: 20,
    analyticsRangeDays: 30,
    canHideBranding: false,
    canCustomizeTheme: false,
    canViewReferrers: false,
    canViewCtr: false,
    themes: ['dark', 'light'],
  },
  pro: {
    maxBlocks: 30,
    maxLinks: 100,
    analyticsRangeDays: 90,
    canHideBranding: true,
    canCustomizeTheme: true,
    canViewReferrers: true,
    canViewCtr: true,
    themes: ['dark', 'light', 'gradient', 'custom'],
  },
};

// Get limits for a user tier
export function getLimitsForTier(tier: string): CreatorPageLimits | null {
  if (tier === 'free') {
    return null; // Free users don't have Creator Page access
  }
  return CREATOR_PAGE_LIMITS[tier as 'standard' | 'pro'] || CREATOR_PAGE_LIMITS.standard;
}

// Check if user can access Creator Page
export function canAccessCreatorPage(tier: string): boolean {
  return tier === 'standard' || tier === 'pro';
}

// Count total links across all blocks
export function countTotalLinks(blocks: Array<{ type: string; data: unknown }>): number {
  let total = 0;

  for (const block of blocks) {
    switch (block.type) {
      case 'hero': {
        const data = block.data as { ctaUrl?: string };
        if (data.ctaUrl) total += 1;
        break;
      }
      case 'card':
      case 'affiliate_card': {
        total += 1; // Each card has one CTA link
        break;
      }
      case 'links': {
        const data = block.data as { groups: Array<{ links: unknown[] }> };
        for (const group of data.groups || []) {
          total += group.links?.length || 0;
        }
        break;
      }
      case 'social_links': {
        const data = block.data as { links: unknown[] };
        total += data.links?.length || 0;
        break;
      }
      case 'featured_content': {
        const data = block.data as { items: unknown[] };
        total += data.items?.length || 0; // Each item is a link
        break;
      }
    }
  }

  return total;
}

// Validate blocks against tier limits
export function validateBlockLimits(
  blocks: Array<{ type: string; data: unknown }>,
  tier: string
): { valid: boolean; error?: string } {
  const limits = getLimitsForTier(tier);

  if (!limits) {
    return { valid: false, error: 'Creator Page requires Standard or Pro tier' };
  }

  if (blocks.length > limits.maxBlocks) {
    return {
      valid: false,
      error: `Maximum ${limits.maxBlocks} blocks allowed for ${tier} tier`
    };
  }

  const totalLinks = countTotalLinks(blocks);
  if (totalLinks > limits.maxLinks) {
    return {
      valid: false,
      error: `Maximum ${limits.maxLinks} links allowed for ${tier} tier`
    };
  }

  return { valid: true };
}

// Validate a single URL
export function validateUrl(url: string): { valid: boolean; error?: string } {
  // Must be HTTPS
  if (!url.startsWith('https://')) {
    return { valid: false, error: 'URLs must use HTTPS' };
  }

  // Basic URL format validation
  try {
    const parsed = new URL(url);

    // Block suspicious patterns
    const suspicious = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
    ];

    if (suspicious.some(s => url.toLowerCase().includes(s))) {
      return { valid: false, error: 'Invalid URL format' };
    }

    // Block localhost/internal URLs
    if (parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.endsWith('.local')) {
      return { valid: false, error: 'Local URLs are not allowed' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}
