import { NextRequest, NextResponse } from 'next/server';
import {
  getReferralCodeByCode,
  trackReferralClick,
  getParentById,
  getChildrenByParentId,
} from '@/lib/db';
import { referralFromDB } from '@/types';

// GET /api/referral/[code] - Track click and get referral info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const namesParam = searchParams.get('names');

    // Parse child names from query param
    const childNames = namesParam
      ? namesParam.split(',').map(n => decodeURIComponent(n.trim())).filter(n => n.length > 0)
      : null;

    // Get fingerprint from headers (for tracking)
    const fingerprint = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      null;

    // Validate the referral code
    const referralCode = await getReferralCodeByCode(code);

    if (!referralCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Get referrer info for personalization
    const referrer = await getParentById(referralCode.referrer_parent_id);
    const referrerChildren = await getChildrenByParentId(referralCode.referrer_parent_id);

    // Track the click
    const referralDB = await trackReferralClick(code, childNames, fingerprint);
    const referral = referralFromDB(referralDB);

    // Build referrer display info (without exposing sensitive data)
    const referrerInfo = referrer
      ? {
          displayName: referrer.display_name || referrer.email.split('@')[0],
          childrenNames: referrerChildren.map(c => c.display_name),
        }
      : null;

    return NextResponse.json({
      success: true,
      data: {
        referralId: referral.id,
        code: referral.codeUsed,
        childNames: referral.childNames,
        referrer: referrerInfo,
        redirectUrl: '/parent/register',
      },
    });
  } catch (error) {
    console.error('Referral click error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
