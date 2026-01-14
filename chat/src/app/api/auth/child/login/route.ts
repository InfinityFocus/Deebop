import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  createChildToken,
  setAuthCookie,
} from '@/lib/auth';
import { getChildByUsername, createAuditLog } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find child by username
    const child = await getChildByUsername(username);
    if (!child) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, child.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if messaging is paused
    if (child.messaging_paused) {
      return NextResponse.json(
        { success: false, error: 'Your account is currently paused. Please ask your parent.' },
        { status: 403 }
      );
    }

    // Create JWT token
    const token = await createChildToken(child.id, child.parent_id, child.username);

    // Set auth cookie
    await setAuthCookie(token);

    // Log the login (using parent's ID for audit)
    await createAuditLog(child.parent_id, 'child_login', child.id, {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          type: 'child',
          id: child.id,
          parentId: child.parent_id,
          username: child.username,
          displayName: child.display_name,
          avatarId: child.avatar_id,
          ageBand: child.age_band,
          oversightMode: child.oversight_mode,
          messagingPaused: child.messaging_paused,
        },
      },
    });
  } catch (error) {
    console.error('Child login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
