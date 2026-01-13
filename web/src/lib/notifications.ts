import { prisma } from './db';
import { sendPushToUser } from './web-push';
import type { NotificationType } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  actorId?: string;
  postId?: string;
  eventId?: string;
  albumId?: string;
}

/**
 * Create a notification and send push notification if user has push enabled.
 * This is the central function for all notification creation.
 */
export async function createNotification({
  userId,
  type,
  actorId,
  postId,
  eventId,
  albumId,
}: CreateNotificationParams): Promise<void> {
  // Create database notification
  await prisma.notification.create({
    data: {
      userId,
      type,
      actorId,
      postId,
      eventId,
      albumId,
    },
  });

  // Get actor name for push notification
  let actorName = 'Someone';
  let postHeadline: string | null = null;

  if (actorId) {
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { displayName: true, username: true },
    });
    if (actor) {
      actorName = actor.displayName || actor.username;
    }
  }

  if (postId) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { headline: true },
    });
    postHeadline = post?.headline || null;
  }

  // Send push notification (async, don't await to not block response)
  sendPushToUser(userId, type, actorName, {
    postId,
    postHeadline,
    eventId,
    albumId,
  }).catch((err) => {
    console.error('Failed to send push notification:', err);
  });
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: { isRead: true },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
