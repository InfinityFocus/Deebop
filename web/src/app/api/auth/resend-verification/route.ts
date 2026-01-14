import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendVerificationEmail, generateVerificationToken, getVerificationExpiry } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user with this email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return NextResponse.json({
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Email is already verified. You can log in.',
        alreadyVerified: true,
      });
    }

    // Generate new verification token
    const verifyToken = generateVerificationToken();
    const verifyExpires = getVerificationExpiry();

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: verifyToken,
        emailVerifyExpires: verifyExpires,
      },
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(
      user.email,
      verifyToken,
      user.username
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
