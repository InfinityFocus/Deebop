import { NextResponse } from 'next/server';
import { clearAuthCookie, getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/db';

export async function POST() {
  try {
    const user = await getCurrentUser();

    // Log the logout if we have a child user
    if (user?.type === 'child' && user.parentId) {
      await createAuditLog(user.parentId, 'child_logout', user.id);
    }

    // Clear the auth cookie
    await clearAuthCookie();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Still try to clear the cookie even if there's an error
    await clearAuthCookie();
    return NextResponse.json({
      success: true,
    });
  }
}
