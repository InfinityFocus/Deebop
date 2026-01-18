import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import {
  hashPassword,
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
import {
  generateVerificationToken,
  getVerificationExpiry,
  sendVerificationEmail,
} from '@/lib/email';

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

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = getVerificationExpiry();

    // Create parent account with verification token
    const parent = await createParent(
      email,
      passwordHash,
      displayName,
      verificationToken,
      verificationExpires
    );

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

    // Send verification email
    const emailResult = await sendVerificationEmail(
      email,
      verificationToken,
      displayName || 'there'
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't fail registration, just log the error
    }

    // Don't log the user in - require email verification first
    return NextResponse.json({
      success: true,
      data: {
        requiresVerification: true,
        email: parent.email,
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
