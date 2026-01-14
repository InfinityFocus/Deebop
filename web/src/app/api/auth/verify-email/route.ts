import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createToken, setAuthCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
      },
      include: {
        identity: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (user.emailVerifyExpires && new Date() > user.emailVerifyExpires) {
      return NextResponse.json(
        { error: 'Verification link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email already verified', alreadyVerified: true }
      );
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    // Log the user in by creating a session
    if (user.identity) {
      const authToken = await createToken({
        identityId: user.identity.id,
        profileId: user.id,
        email: user.identity.email,
        username: user.username,
      });
      await setAuthCookie(authToken);
    }

    return NextResponse.json({
      message: 'Email verified successfully',
      verified: true,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
