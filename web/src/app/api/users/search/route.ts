import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export async function GET(request: NextRequest) {
  try {
    // Get current user (optional - search works for everyone but we exclude self)
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;
    let currentUserId: string | null = null;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        currentUserId = payload.userId as string;
      } catch {
        // Invalid token, continue without user
      }
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search users by username or display name
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } },
            ],
          },
          // Exclude current user
          currentUserId ? { NOT: { id: currentUserId } } : {},
          // Only active users
          { isSuspended: false },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
      take: 10,
      orderBy: [
        { followersCount: 'desc' },
        { username: 'asc' },
      ],
    });

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        display_name: user.displayName,
        avatar_url: user.avatarUrl,
      })),
    });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
