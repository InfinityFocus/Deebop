import { NextRequest, NextResponse } from 'next/server';
import {
  getParentByVerificationToken,
  verifyParentEmail,
  createTrialSubscription,
} from '@/lib/db';
import { createParentToken, setAuthCookie } from '@/lib/auth';

// GET /api/auth/verify-email?token=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find parent by token
    const parent = await getParentByVerificationToken(token);

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (parent.email_verify_expires && new Date(parent.email_verify_expires) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (parent.email_verified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Verify email
    await verifyParentEmail(parent.id);

    // Create trial subscription for the new user
    await createTrialSubscription(parent.id);

    // Create JWT token and log the user in
    const jwtToken = await createParentToken(parent.id, parent.email);
    await setAuthCookie(jwtToken);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Email verified successfully',
        user: {
          type: 'parent',
          id: parent.id,
          email: parent.email,
          displayName: parent.display_name,
        },
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
