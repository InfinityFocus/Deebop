import { NextRequest, NextResponse } from 'next/server';
import {
  getReferralsPendingCredit,
  createBillingCredit,
  markReferralCredited,
  getYearlyReferralCreditsCount,
} from '@/lib/db';
import { REFERRAL_CONFIG } from '@/types';

// GET /api/cron/process-referral-credits - Process eligible referrals
// This should be called by a cron job (e.g., daily)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In development, allow without auth; in production, require it
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Get all referrals that are eligible for credit (hold period passed)
    const pendingReferrals = await getReferralsPendingCredit();

    const results = {
      processed: 0,
      credited: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const referral of pendingReferrals) {
      results.processed++;

      try {
        // Check yearly cap before crediting
        const yearlyCount = await getYearlyReferralCreditsCount(referral.referrer_parent_id);

        if (yearlyCount >= REFERRAL_CONFIG.MAX_CREDITS_PER_YEAR) {
          // Skip - referrer has reached yearly cap
          results.skipped++;
          continue;
        }

        // Create the billing credit
        await createBillingCredit(
          referral.referrer_parent_id,
          'referral',
          1, // 1 month credit
          `Referral: ${referral.referee_email || referral.id}`,
          referral.id
        );

        // Mark the referral as credited
        await markReferralCredited(referral.id);

        results.credited++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Referral ${referral.id}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Cron process referral credits error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
