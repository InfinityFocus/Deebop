import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import {
  hashPassword,
  createParentToken,
  setAuthCookie,
  isValidEmail,
  isValidPassword,
} from '@/lib/auth';
import {
  createParent,
  getParentByEmail,
  findUnlinkedReferralByCode,
  getReferralCodeByCode,
  runReferralAntiAbuseChecks,
  updateReferralOnSignup,
  invalidateReferral,
} from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName, referralCode } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters with at least one letter and one number' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingParent = await getParentByEmail(email);
    if (existingParent) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create parent account
    const parent = await createParent(email, passwordHash, displayName);

    // Handle referral if code provided
    if (referralCode && typeof referralCode === 'string') {
      try {
        // Validate referral code exists
        const codeRecord = await getReferralCodeByCode(referralCode);

        if (codeRecord) {
          // Run anti-abuse checks
          const abuseCheck = await runReferralAntiAbuseChecks(
            codeRecord.referrer_parent_id,
            email
          );

          // Get IP hash for tracking
          const forwardedFor = request.headers.get('x-forwarded-for');
          const realIp = request.headers.get('x-real-ip');
          const ip = forwardedFor?.split(',')[0] || realIp || null;
          const ipHash = ip
            ? createHash('sha256').update(ip).digest('hex').substring(0, 16)
            : null;

          // Find unlinked referral record (created when link was clicked)
          const unlinkedReferral = await findUnlinkedReferralByCode(referralCode);

          if (unlinkedReferral) {
            if (abuseCheck.valid) {
              // Update referral with signup info
              await updateReferralOnSignup(
                unlinkedReferral.id,
                parent.id,
                email,
                ipHash
              );
            } else {
              // Invalidate the referral due to anti-abuse check failure
              await invalidateReferral(
                unlinkedReferral.id,
                abuseCheck.reason || 'anti_abuse_check_failed',
                'system'
              );
            }
          }
        }
      } catch (referralError) {
        // Log but don't fail registration due to referral issues
        console.error('Referral processing error:', referralError);
      }
    }

    // Create JWT token
    const token = await createParentToken(parent.id, parent.email);

    // Set auth cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          type: 'parent',
          id: parent.id,
          email: parent.email,
          displayName: parent.display_name,
        },
      },
    });
  } catch (error) {
    console.error('Parent registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
