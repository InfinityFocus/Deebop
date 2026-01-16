import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getParentById } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.CHAT_JWT_SECRET || 'deebop-chat-dev-secret-change-in-production'
);

const ADMIN_EMAILS = (process.env.CHAT_ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

/**
 * Check if the current user is an admin
 * Admins are parents whose email is in CHAT_ADMIN_EMAILS env var
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-chat-auth')?.value;

    if (!token) return false;

    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Only parents can be admins
    if (payload.type !== 'parent') return false;

    const parent = await getParentById(payload.id as string);
    if (!parent) return false;

    return ADMIN_EMAILS.includes(parent.email.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Get the admin user if authenticated, null otherwise
 */
export async function getAdminUser(): Promise<{ id: string; email: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-chat-auth')?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== 'parent') return null;

    const parent = await getParentById(payload.id as string);
    if (!parent) return null;

    if (!ADMIN_EMAILS.includes(parent.email.toLowerCase())) return null;

    return { id: parent.id, email: parent.email };
  } catch {
    return null;
  }
}
