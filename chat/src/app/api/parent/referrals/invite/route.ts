import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrCreateReferralCode } from '@/lib/db';
import { referralCodeFromDB } from '@/types';

// POST /api/parent/referrals/invite - Generate a personalized invite link
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { childNames } = body as { childNames?: string[] };

    // Get the parent's referral code
    const referralCodeDB = await getOrCreateReferralCode(user.id);
    const referralCode = referralCodeFromDB(referralCodeDB);

    // Build the referral URL with optional child names
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chat.deebop.com';
    let referralUrl = `${baseUrl}/r/${referralCode.code}`;

    // Add child names as query param if provided
    if (childNames && childNames.length > 0) {
      const validNames = childNames
        .map(n => n.trim())
        .filter(n => n.length > 0 && n.length <= 50)
        .slice(0, 5); // Max 5 names

      if (validNames.length > 0) {
        referralUrl += `?names=${encodeURIComponent(validNames.join(','))}`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        code: referralCode.code,
        referralUrl,
        childNames: childNames || [],
      },
    });
  } catch (error) {
    console.error('Invite generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
