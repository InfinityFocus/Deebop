import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'local-dev-secret-change-in-production'
);

const COOKIE_NAME = 'deebop-auth';

// Profile limits by tier
export const PROFILE_LIMITS = {
  free: 1,
  standard: 2,
  pro: 5,
} as const;

/**
 * JWT Payload for Multi-Profile System
 *
 * identityId - The login identity (one per email)
 * profileId  - The active profile (userId, can have multiple per identity)
 */
export interface JWTPayload {
  identityId: string;  // Identity ID for login/billing
  profileId: string;   // Active profile (was userId)
  email: string;       // Identity email
  username: string;    // Active profile username
  // Legacy field for backward compatibility during migration
  userId?: string;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT functions
export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload, userId: payload.profileId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const p = payload as unknown as JWTPayload;

    // Handle legacy tokens (before multi-profile) that only have userId
    if (p.userId && !p.profileId) {
      p.profileId = p.userId;
    }
    // Handle old tokens without identityId - need to look it up from the profile
    if (p.profileId && !p.identityId) {
      const profile = await prisma.user.findUnique({
        where: { id: p.profileId },
        select: { identityId: true },
      });
      // Only set if we found a valid identityId
      if (profile?.identityId) {
        p.identityId = profile.identityId;
      }
    }

    return p;
  } catch {
    return null;
  }
}

// Cookie management
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get the logged-in Identity (for tier checks, ban status, billing)
 * Use this when you need to check subscription tier or Identity-level ban
 */
export async function getIdentity() {
  const token = await getAuthCookie();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.identityId) return null;

  const identity = await prisma.identity.findUnique({
    where: { id: payload.identityId },
    select: {
      id: true,
      email: true,
      tier: true,
      stripeCustomerId: true,
      isBanned: true,
      bannedAt: true,
      bannedReason: true,
      createdAt: true,
    },
  });

  return identity;
}

/**
 * Get the current active Profile (for content, social actions)
 * This is the main function for most API routes
 * Replaces the old getCurrentUser() for most use cases
 */
export async function getCurrentProfile() {
  const token = await getAuthCookie();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.profileId) return null;

  const profile = await prisma.user.findUnique({
    where: { id: payload.profileId },
    select: {
      id: true,
      identityId: true,
      isDefault: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      coverImageUrl: true,
      profileLink: true,
      tier: true,
      isPrivate: true,
      isSuspended: true,
      followersCount: true,
      followingCount: true,
      postsCount: true,
      createdAt: true,
      birthYear: true,
    },
  });

  // Check if profile is suspended
  if (profile?.isSuspended) {
    return null;
  }

  return profile;
}

/**
 * Get current user - LEGACY wrapper for backward compatibility
 * Routes should migrate to getCurrentProfile() over time
 */
export async function getCurrentUser() {
  return getCurrentProfile();
}

/**
 * Get all profiles for the current Identity
 */
export async function getIdentityProfiles() {
  const token = await getAuthCookie();
  if (!token) return [];

  const payload = await verifyToken(token);
  if (!payload?.identityId) return [];

  const profiles = await prisma.user.findMany({
    where: { identityId: payload.identityId },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isDefault: true,
      isSuspended: true,
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  return profiles;
}

// Auth actions
export async function register(email: string, username: string, password: string, birthYear: number) {
  // Check if email exists (Identity level)
  const existingIdentity = await prisma.identity.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingIdentity) {
    throw new Error('An account with this email already exists');
  }

  // Also check old users table for email during migration period
  const existingUserEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingUserEmail) {
    throw new Error('An account with this email already exists');
  }

  // Check if username exists
  const existingUsername = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });
  if (existingUsername) {
    throw new Error('Username is already taken');
  }

  // Create Identity + Profile in a transaction
  const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    // Create Identity
    const identity = await tx.identity.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        birthYear,
        tier: 'free',
      },
    });

    // Create default Profile
    const profile = await tx.user.create({
      data: {
        identityId: identity.id,
        isDefault: true,
        email: email.toLowerCase(), // Duplicate for backward compat
        passwordHash, // Duplicate for backward compat
        username: username.toLowerCase(),
        displayName: username,
        birthYear, // Duplicate for backward compat
      },
    });

    return { identity, profile };
  });

  // Create and set token with new structure
  const token = await createToken({
    identityId: result.identity.id,
    profileId: result.profile.id,
    email: result.identity.email,
    username: result.profile.username,
  });
  await setAuthCookie(token);

  return result.profile;
}

export async function login(email: string, password: string) {
  // First, try to find Identity (new structure)
  let identity = await prisma.identity.findUnique({
    where: { email: email.toLowerCase() },
  });

  // If no Identity found, try legacy User table
  if (!identity) {
    const legacyUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!legacyUser) {
      throw new Error('Invalid email or password');
    }

    // Verify password against legacy user
    const valid = await verifyPassword(password, legacyUser.passwordHash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    // Legacy user login - create token with userId as both identityId and profileId
    // This handles users who haven't been migrated yet
    const token = await createToken({
      identityId: legacyUser.identityId || legacyUser.id, // Use identityId if exists
      profileId: legacyUser.id,
      email: legacyUser.email,
      username: legacyUser.username,
    });
    await setAuthCookie(token);

    return legacyUser;
  }

  // Check if Identity is banned
  if (identity.isBanned) {
    throw new Error('This account has been suspended. Please contact support.');
  }

  // Verify password
  const valid = await verifyPassword(password, identity.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  // Get default profile for this identity
  let defaultProfile = await prisma.user.findFirst({
    where: {
      identityId: identity.id,
      isDefault: true,
      isSuspended: false,
    },
  });

  // If no default profile, get any non-suspended profile
  if (!defaultProfile) {
    defaultProfile = await prisma.user.findFirst({
      where: {
        identityId: identity.id,
        isSuspended: false,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  if (!defaultProfile) {
    throw new Error('No active profiles found for this account');
  }

  // Create and set token
  const token = await createToken({
    identityId: identity.id,
    profileId: defaultProfile.id,
    email: identity.email,
    username: defaultProfile.username,
  });
  await setAuthCookie(token);

  return defaultProfile;
}

/**
 * Switch to a different profile under the same Identity
 */
export async function switchProfile(profileId: string) {
  const token = await getAuthCookie();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const payload = await verifyToken(token);
  if (!payload?.identityId) {
    throw new Error('Invalid session');
  }

  // Verify the profile belongs to this identity
  const profile = await prisma.user.findFirst({
    where: {
      id: profileId,
      identityId: payload.identityId,
      isSuspended: false,
    },
  });

  if (!profile) {
    throw new Error('Profile not found or access denied');
  }

  // Get identity for email
  const identity = await prisma.identity.findUnique({
    where: { id: payload.identityId },
  });

  if (!identity) {
    throw new Error('Identity not found');
  }

  // Check if identity is banned
  if (identity.isBanned) {
    throw new Error('This account has been suspended');
  }

  // Create new token for the switched profile
  const newToken = await createToken({
    identityId: identity.id,
    profileId: profile.id,
    email: identity.email,
    username: profile.username,
  });
  await setAuthCookie(newToken);

  return profile;
}

/**
 * Create a new profile under the current Identity
 */
export async function createProfile(username: string, displayName?: string) {
  const identity = await getIdentity();
  if (!identity) {
    throw new Error('Not authenticated');
  }

  // Check profile limit based on tier
  const profileCount = await prisma.user.count({
    where: { identityId: identity.id },
  });

  const limit = PROFILE_LIMITS[identity.tier as keyof typeof PROFILE_LIMITS] || 1;
  if (profileCount >= limit) {
    throw new Error(
      `You have reached the maximum number of profiles (${limit}) for your ${identity.tier} tier. Upgrade to add more profiles.`
    );
  }

  // Check if username is taken
  const existingUsername = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });
  if (existingUsername) {
    throw new Error('Username is already taken');
  }

  // Create new profile
  const profile = await prisma.user.create({
    data: {
      identityId: identity.id,
      isDefault: false,
      email: identity.email, // Share email for backward compat
      passwordHash: '', // Not used for additional profiles
      username: username.toLowerCase(),
      displayName: displayName || username,
      tier: identity.tier, // Inherit tier from identity
    },
  });

  return profile;
}

export async function logout() {
  await clearAuthCookie();
}
