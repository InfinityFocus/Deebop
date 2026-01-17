import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getOrCreateReferralCode,
  getReferralsForParent,
  getAvailableCredits,
  getYearlyReferralCreditsCount,
} from '@/lib/db';
import {
  referralCodeFromDB,
  referralFromDB,
  billingCreditFromDB,
  REFERRAL_CONFIG,
  type ParentReferralSummary,
} from '@/types';

// GET /api/parent/referrals - Get referral dashboard data
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create referral code
    const referralCodeDB = await getOrCreateReferralCode(user.id);
    const referralCode = referralCodeFromDB(referralCodeDB);

    // Get all referrals for this parent
    const referralsDB = await getReferralsForParent(user.id);
    const referrals = referralsDB.map(referralFromDB);

    // Calculate stats
    const stats = {
      clicks: referrals.filter(r => r.status === 'clicked').length,
      signups: referrals.filter(r => ['signed_up', 'subscribed', 'eligible', 'credited'].includes(r.status)).length,
      subscriptions: referrals.filter(r => ['subscribed', 'eligible', 'credited'].includes(r.status)).length,
      credited: referrals.filter(r => r.status === 'credited').length,
    };

    // Get available credits
    const creditsDB = await getAvailableCredits(user.id);
    const creditsAvailable = creditsDB.reduce((sum, c) => sum + c.quantity, 0);

    // Get yearly credits used
    const yearlyCreditsUsed = await getYearlyReferralCreditsCount(user.id);

    // Build the base URL for referral links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chat.deebop.com';
    const referralUrl = `${baseUrl}/r/${referralCode.code}`;

    const summary: ParentReferralSummary = {
      code: referralCode.code,
      referralUrl,
      stats,
      referrals,
      creditsAvailable,
      yearlyCreditsUsed,
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Referral fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
