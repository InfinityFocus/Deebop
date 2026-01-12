import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('deebop-auth')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

// GET /api/explore/near - Get posts and events near user's city
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const cityIdParam = searchParams.get('cityId');
    const tab = searchParams.get('tab') || 'posts'; // 'posts' | 'events' | 'creators'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get city ID from param or user's location
    let cityId = cityIdParam;

    if (!cityId && user) {
      const userLocation = await prisma.userLocation.findUnique({
        where: { userId: user.userId },
        select: { cityId: true },
      });
      cityId = userLocation?.cityId || null;
    }

    if (!cityId) {
      return NextResponse.json({
        error: 'No location set',
        message: 'Set your city to see content near you',
        needsLocation: true,
      });
    }

    // Verify city exists
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      select: {
        id: true,
        name: true,
        countryCode: true,
        countryName: true,
      },
    });

    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    const results: {
      posts?: Array<{
        id: string;
        textContent: string | null;
        contentType: string;
        mediaUrl: string | null;
        thumbnailUrl: string | null;
        createdAt: Date;
        likeCount: number;
        user: { username: string; displayName: string | null; avatar: string | null };
      }>;
      events?: Array<{
        id: string;
        title: string;
        description: string | null;
        coverUrl: string | null;
        startDate: Date;
        location: string | null;
        attendingCount: number;
      }>;
      creators?: Array<{
        id: string;
        username: string;
        displayName: string | null;
        avatar: string | null;
        followerCount: number;
      }>;
    } = {};

    // Get posts in this city
    if (tab === 'posts' || tab === 'all') {
      const postLocations = await prisma.postLocation.findMany({
        where: { cityId },
        select: { postId: true },
      });

      const postIds = postLocations.map((pl) => pl.postId);

      if (postIds.length > 0) {
        const posts = await prisma.post.findMany({
          where: {
            id: { in: postIds },
            status: 'published',
            visibility: 'public',
          },
          select: {
            id: true,
            description: true,
            contentType: true,
            mediaUrl: true,
            mediaThumbnailUrl: true,
            createdAt: true,
            likesCount: true,
            user: {
              select: { username: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        });

        results.posts = posts.map((p) => ({
          id: p.id,
          textContent: p.description,
          contentType: p.contentType,
          mediaUrl: p.mediaUrl,
          thumbnailUrl: p.mediaThumbnailUrl,
          createdAt: p.createdAt,
          likeCount: p.likesCount,
          user: {
            username: p.user.username,
            displayName: p.user.displayName,
            avatar: p.user.avatarUrl,
          },
        }));
      } else {
        results.posts = [];
      }
    }

    // Get events in this city
    if (tab === 'events' || tab === 'all') {
      const events = await prisma.event.findMany({
        where: {
          visibility: 'public',
          locationName: { contains: city.name, mode: 'insensitive' },
          startAt: { gte: new Date() },
        },
        select: {
          id: true,
          title: true,
          description: true,
          coverImageUrl: true,
          startAt: true,
          locationName: true,
          attendingCount: true,
        },
        orderBy: { startAt: 'asc' },
        skip: offset,
        take: limit,
      });

      results.events = events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        coverUrl: e.coverImageUrl,
        startDate: e.startAt,
        location: e.locationName,
        attendingCount: e.attendingCount,
      }));
    }

    // Get creators in this city
    if (tab === 'creators' || tab === 'all') {
      const userLocations = await prisma.userLocation.findMany({
        where: { cityId },
        select: { userId: true },
      });

      const userIds = userLocations.map((ul) => ul.userId);

      if (userIds.length > 0) {
        const users = await prisma.user.findMany({
          where: {
            id: { in: userIds },
          },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            _count: {
              select: { followers: true },
            },
          },
          orderBy: { followers: { _count: 'desc' } },
          skip: offset,
          take: limit,
        });

        results.creators = users.map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          avatar: u.avatarUrl,
          followerCount: u._count.followers,
        }));
      } else {
        results.creators = [];
      }
    }

    return NextResponse.json({
      city,
      results,
      tab,
    });
  } catch (error) {
    console.error('Error fetching near content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nearby content' },
      { status: 500 }
    );
  }
}
