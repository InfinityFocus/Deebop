import { NextRequest, NextResponse } from 'next/server';
import { getParentByEmail, updateParentVerificationToken } from '@/lib/db';
import {
  generateVerificationToken,
  getVerificationExpiry,
  sendVerificationEmail,
} from '@/lib/email';

// POST /api/auth/resend-verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find parent by email
    const parent = await getParentByEmail(email);

    if (!parent) {
      // Don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        data: { message: 'If an account exists, a verification email has been sent.' },
      });
    }

    // Check if already verified
    if (parent.email_verified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = getVerificationExpiry();

    // Update token in database
    await updateParentVerificationToken(parent.id, verificationToken, verificationExpires);

    // Send verification email
    const emailResult = await sendVerificationEmail(
      email,
      verificationToken,
      parent.display_name || 'there'
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Verification email sent successfully.' },
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend verification email.' },
      { status: 500 }
    );
  }
}
