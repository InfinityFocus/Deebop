import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  createParentToken,
  setAuthCookie,
} from '@/lib/auth';
import { getParentByEmail, createAuditLog } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find parent by email
    const parent = await getParentByEmail(email);
    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, parent.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createParentToken(parent.id, parent.email);

    // Set auth cookie
    await setAuthCookie(token);

    // Log the login
    await createAuditLog(parent.id, 'parent_login', undefined, {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

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
    console.error('Parent login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
