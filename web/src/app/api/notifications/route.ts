import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        post: {
          select: {
            id: true,
            contentType: true,
            description: true,
            mediaThumbnailUrl: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
          },
        },
        album: {
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
          },
        },
      },
    });

    let nextCursor: string | undefined;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem?.id;
    }

    // For repost_request notifications, we need to look up the repost ID
    const repostRequestNotifications = notifications.filter(
      (n) => n.type === 'repost_request' && n.postId && n.actorId
    );

    // Batch fetch repost IDs for repost_request notifications
    const repostMap = new Map<string, string>();
    if (repostRequestNotifications.length > 0) {
      const reposts = await prisma.repost.findMany({
        where: {
          OR: repostRequestNotifications.map((n) => ({
            postId: n.postId!,
            userId: n.actorId!,
            status: 'pending',
          })),
        },
        select: {
          id: true,
          postId: true,
          userId: true,
        },
      });

      for (const repost of reposts) {
        const key = `${repost.postId}-${repost.userId}`;
        repostMap.set(key, repost.id);
      }
    }

    // For tag_request notifications, we need to look up the tag ID
    const tagRequestNotifications = notifications.filter(
      (n) => n.type === 'tag_request' && n.postId && n.actorId
    );

    // Batch fetch tag IDs for tag_request notifications
    const tagMap = new Map<string, string>();
    if (tagRequestNotifications.length > 0) {
      const tags = await prisma.postTag.findMany({
        where: {
          OR: tagRequestNotifications.map((n) => ({
            postId: n.postId!,
            taggerId: n.actorId!,
            taggedUserId: user.id,
            status: 'pending',
          })),
        },
        select: {
          id: true,
          postId: true,
          taggerId: true,
        },
      });

      for (const tag of tags) {
        const key = `${tag.postId}-${tag.taggerId}`;
        tagMap.set(key, tag.id);
      }
    }

    // For mention_request notifications, we need to look up the mention ID
    const mentionRequestNotifications = notifications.filter(
      (n) => n.type === 'mention_request' && n.postId && n.actorId
    );

    // Batch fetch mention IDs for mention_request notifications
    const mentionMap = new Map<string, string>();
    if (mentionRequestNotifications.length > 0) {
      const mentions = await prisma.postMention.findMany({
        where: {
          OR: mentionRequestNotifications.map((n) => ({
            postId: n.postId!,
            mentionerId: n.actorId!,
            mentionedUserId: user.id,
            status: 'pending',
          })),
        },
        select: {
          id: true,
          postId: true,
          mentionerId: true,
        },
      });

      for (const mention of mentions) {
        const key = `${mention.postId}-${mention.mentionerId}`;
        mentionMap.set(key, mention.id);
      }
    }

    // Transform for response
    const transformedNotifications = notifications.map((n) => {
      let repostId: string | null = null;
      let tagId: string | null = null;
      let mentionId: string | null = null;

      // Look up repost ID for repost_request notifications
      if (n.type === 'repost_request' && n.postId && n.actorId) {
        const key = `${n.postId}-${n.actorId}`;
        repostId = repostMap.get(key) || null;
      }

      // Look up tag ID for tag_request notifications
      if (n.type === 'tag_request' && n.postId && n.actorId) {
        const key = `${n.postId}-${n.actorId}`;
        tagId = tagMap.get(key) || null;
      }

      // Look up mention ID for mention_request notifications
      if (n.type === 'mention_request' && n.postId && n.actorId) {
        const key = `${n.postId}-${n.actorId}`;
        mentionId = mentionMap.get(key) || null;
      }

      return {
        id: n.id,
        type: n.type,
        is_read: n.isRead,
        created_at: n.createdAt.toISOString(),
        repost_id: repostId,
        tag_id: tagId,
        mention_id: mentionId,
        actor: n.actor
          ? {
              id: n.actor.id,
              username: n.actor.username,
              display_name: n.actor.displayName,
              avatar_url: n.actor.avatarUrl,
            }
          : null,
        post: n.post
          ? {
              id: n.post.id,
              content_type: n.post.contentType,
              text_content: n.post.description,
              media_thumbnail_url: n.post.mediaThumbnailUrl,
            }
          : null,
        event: n.event
          ? {
              id: n.event.id,
              title: n.event.title,
              cover_image_url: n.event.coverImageUrl,
            }
          : null,
        album: n.album
          ? {
              id: n.album.id,
              title: n.album.title,
              cover_image_url: n.album.coverImageUrl,
            }
          : null,
      };
    });

    return NextResponse.json({
      notifications: transformedNotifications,
      nextCursor,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications/read - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds } = await request.json();

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
        },
        data: { isRead: true },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }
}
