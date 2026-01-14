import { NextRequest, NextResponse } from 'next/server';
import {
  hashPassword,
  createParentToken,
  setAuthCookie,
  isValidEmail,
  isValidPassword,
} from '@/lib/auth';
import { createParent, getParentByEmail } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName } = body;

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
