import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, birthYear } = await request.json();

    // Validate input
    if (!email || !username || !password || !birthYear) {
      return NextResponse.json(
        { error: 'Email, username, password, and birth year are required' },
        { status: 400 }
      );
    }

    // Validate birth year
    const currentYear = new Date().getFullYear();
    const parsedBirthYear = parseInt(birthYear, 10);
    if (isNaN(parsedBirthYear) || parsedBirthYear < currentYear - 120 || parsedBirthYear > currentYear - 13) {
      return NextResponse.json(
        { error: 'You must be at least 13 years old to register' },
        { status: 400 }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-30 characters (letters, numbers, underscores only)' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const user = await register(email, username, password, parsedBirthYear);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
