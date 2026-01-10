import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/explore/trending/posts - Get trending posts (24h window)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const interestSlug = searchParams.get('interest');

    // Content filter params
    const hideAiGenerated = searchParams.get('hideAiGenerated') === 'true';
    const hideAiAssisted = searchParams.get('hideAiAssisted') === 'true';
    const hidePaidPartnership = searchParams.get('hidePaidPartnership') === 'true';
    const hideSensitiveContent = searchParams.get('hideSensitiveContent') === 'true';

    // 24 hour window
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Build provenance filter based on content preferences
    const provenanceFilter: string[] = [];
    if (hideAiGenerated) provenanceFilter.push('ai_generated');
    if (hideAiAssisted) provenanceFilter.push('ai_assisted');

    const where: Record<string, unknown> = {
      visibility: 'public',
      createdAt: { gte: windowStart },
    };

    // Apply content filters
    if (provenanceFilter.length > 0) {
      where.provenance = { notIn: provenanceFilter };
    }
    if (hidePaidPartnership) {
      where.isSponsoredContent = false;
    }
    if (hideSensitiveContent) {
      where.isSensitiveContent = false;
    }

    // Filter by interest if provided
    if (interestSlug) {
      const interest = await prisma.interest.findUnique({
        where: { slug: interestSlug },
        select: { id: true },
      });

      if (interest) {
        where.interests = {
          some: { interestId: interest.id },
        };
      }
    }

    // Get posts with engagement metrics
    const posts = await prisma.post.findMany({
      where,
      select: {
        id: true,
        headline: true,
        description: true,
        contentType: true,
        mediaUrl: true,
        mediaThumbnailUrl: true,
        createdAt: true,
        likesCount: true,
        sharesCount: true,
        savesCount: true,
        viewsCount: true,
        repostsCount: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        // Include media array for multi-image posts
        media: {
          orderBy: { sortOrder: 'asc' },
          take: 1, // Only need first image for thumbnail
          select: {
            mediaUrl: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: [
        { likesCount: 'desc' },
        { sharesCount: 'desc' },
        { viewsCount: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: offset,
      take: limit,
    });

    // Calculate trending score for each post
    const scoredPosts = posts.map((post) => {
      const hoursOld =
        (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      const timeDecay = Math.pow(0.95, hoursOld); // 5% decay per hour
      const engagement =
        post.likesCount * 1 +
        post.sharesCount * 3 +
        post.savesCount * 2 +
        post.viewsCount * 0.01 +
        (post.repostsCount || 0) * 1.2;
      const recencyBonus = hoursOld < 6 ? 10 : hoursOld < 12 ? 5 : 0;

      // For multi-image posts, use first image from media array as thumbnail
      const firstMedia = post.media?.[0];
      const effectiveThumbnail = post.mediaThumbnailUrl || firstMedia?.thumbnailUrl || firstMedia?.mediaUrl || post.mediaUrl;
      const effectiveMediaUrl = post.mediaUrl || firstMedia?.mediaUrl;

      return {
        id: post.id,
        headline: post.headline,
        textContent: post.description,
        contentType: post.contentType,
        mediaUrl: effectiveMediaUrl,
        thumbnailUrl: effectiveThumbnail,
        createdAt: post.createdAt,
        likeCount: post.likesCount,
        shareCount: post.sharesCount,
        saveCount: post.savesCount,
        viewCount: post.viewsCount,
        user: {
          id: post.user.id,
          username: post.user.username,
          displayName: post.user.displayName,
          avatar: post.user.avatarUrl,
        },
        trendingScore: engagement * timeDecay + recencyBonus,
        hasMultipleImages: (post.media?.length || 0) > 0,
      };
    });

    // Sort by trending score
    scoredPosts.sort((a, b) => b.trendingScore - a.trendingScore);

    return NextResponse.json({
      posts: scoredPosts,
      window: '24h',
    });
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending posts' },
      { status: 500 }
    );
  }
}
