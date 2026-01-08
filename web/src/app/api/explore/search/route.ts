import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/explore/search - Unified search across all entity types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const tab = searchParams.get('tab') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query.trim()) {
      return NextResponse.json({
        results: {
          hashtags: [],
          creators: [],
          albums: [],
          events: [],
          shouts: [],
        },
        query: '',
      });
    }

    const searchQuery = query.trim();

    const results: {
      hashtags?: Array<{ tag: string; postCount: number }>;
      creators?: Array<{
        id: string;
        username: string;
        displayName: string | null;
        avatar: string | null;
        followerCount: number;
      }>;
      albums?: Array<{
        id: string;
        name: string;
        description: string | null;
        coverUrl: string | null;
        itemCount: number;
        creator: { username: string; displayName: string | null };
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
      shouts?: Array<{
        id: string;
        textContent: string | null;
        createdAt: Date;
        likeCount: number;
        user: { username: string; displayName: string | null; avatar: string | null };
      }>;
    } = {};

    // Search hashtags
    if (tab === 'all' || tab === 'hashtag') {
      const hashtags = await prisma.hashtag.findMany({
        where: {
          name: { contains: searchQuery.toLowerCase().replace('#', ''), mode: 'insensitive' },
        },
        select: {
          name: true,
          postsCount: true,
        },
        orderBy: { postsCount: 'desc' },
        skip: offset,
        take: limit,
      });

      results.hashtags = hashtags.map((h) => ({
        tag: h.name,
        postCount: h.postsCount,
      }));
    }

    // Search creators (users)
    if (tab === 'all' || tab === 'creator') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: searchQuery, mode: 'insensitive' } },
            { displayName: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          followersCount: true,
        },
        orderBy: { followersCount: 'desc' },
        skip: offset,
        take: limit,
      });

      results.creators = users.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatar: u.avatarUrl,
        followerCount: u.followersCount,
      }));
    }

    // Search albums
    if (tab === 'all' || tab === 'album') {
      const albums = await prisma.album.findMany({
        where: {
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ],
          visibility: 'public',
        },
        select: {
          id: true,
          title: true,
          description: true,
          coverImageUrl: true,
          itemsCount: true,
          owner: {
            select: { username: true, displayName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      });

      results.albums = albums.map((a) => ({
        id: a.id,
        name: a.title,
        description: a.description,
        coverUrl: a.coverImageUrl,
        itemCount: a.itemsCount,
        creator: a.owner,
      }));
    }

    // Search events
    if (tab === 'all' || tab === 'event') {
      const events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { locationName: { contains: searchQuery, mode: 'insensitive' } },
          ],
          visibility: 'public',
          startAt: { gte: new Date() }, // Only future events
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

    // Search shouts (text posts)
    if (tab === 'all' || tab === 'shout') {
      const shouts = await prisma.post.findMany({
        where: {
          description: { contains: searchQuery, mode: 'insensitive' },
          contentType: 'shout',
          visibility: 'public',
        },
        select: {
          id: true,
          description: true,
          createdAt: true,
          likesCount: true,
          user: {
            select: { username: true, displayName: true, avatarUrl: true },
          },
        },
        orderBy: { likesCount: 'desc' },
        skip: offset,
        take: limit,
      });

      results.shouts = shouts.map((s) => ({
        id: s.id,
        textContent: s.description,
        createdAt: s.createdAt,
        likeCount: s.likesCount,
        user: {
          username: s.user.username,
          displayName: s.user.displayName,
          avatar: s.user.avatarUrl,
        },
      }));
    }

    return NextResponse.json({
      results,
      query: searchQuery,
      tab,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
