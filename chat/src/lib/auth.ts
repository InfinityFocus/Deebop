import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { hash, compare } from 'bcryptjs';
import { cookies } from 'next/headers';
import type { ChatJWTPayload, UserType } from '@/types';

// ==========================================
// Configuration
// ==========================================

const JWT_SECRET = process.env.CHAT_JWT_SECRET || 'deebop-chat-dev-secret-change-in-production';
const COOKIE_NAME = 'deebop-chat-auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const BCRYPT_ROUNDS = 12;

// Encode secret for jose
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

// ==========================================
// Password Functions
// ==========================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a password with a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

// ==========================================
// JWT Functions
// ==========================================

/**
 * Create a JWT token for a parent
 */
export async function createParentToken(parentId: string, email: string): Promise<string> {
  const payload: ChatJWTPayload = {
    type: 'parent',
    id: parentId,
    email,
  };

  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);
}

/**
 * Create a JWT token for a child
 */
export async function createChildToken(
  childId: string,
  parentId: string,
  username: string
): Promise<string> {
  const payload: ChatJWTPayload = {
    type: 'child',
    id: childId,
    parentId,
    username,
  };

  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<ChatJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as unknown as ChatJWTPayload;
  } catch {
    return null;
  }
}

// ==========================================
// Cookie Functions
// ==========================================

/**
 * Set the auth cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Get the auth cookie value
 */
export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/**
 * Clear the auth cookie (logout)
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ==========================================
// Authentication Helpers
// ==========================================

/**
 * Get the current authenticated user from the cookie
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<ChatJWTPayload | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Check if the current user is a parent
 */
export async function requireParent(): Promise<ChatJWTPayload & { type: 'parent' }> {
  const user = await getCurrentUser();
  if (!user || user.type !== 'parent') {
    throw new Error('Unauthorized: Parent access required');
  }
  return user as ChatJWTPayload & { type: 'parent' };
}

/**
 * Check if the current user is a child
 */
export async function requireChild(): Promise<ChatJWTPayload & { type: 'child' }> {
  const user = await getCurrentUser();
  if (!user || user.type !== 'child') {
    throw new Error('Unauthorized: Child access required');
  }
  return user as ChatJWTPayload & { type: 'child' };
}

/**
 * Check if the current user is authenticated (either parent or child)
 */
export async function requireAuth(): Promise<ChatJWTPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }
  return user;
}

// ==========================================
// Validation Helpers
// ==========================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * - At least 8 characters
 * - Contains at least one letter and one number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

/**
 * Validate username format
 * - 3-20 characters
 * - Only letters, numbers, and underscores
 * - Must start with a letter
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
  return usernameRegex.test(username);
}

/**
 * Validate child password (simpler requirements for kids)
 * - At least 6 characters
 */
export function isValidChildPassword(password: string): boolean {
  return password.length >= 6;
}
