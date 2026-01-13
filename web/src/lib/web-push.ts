import webpush from 'web-push';
import { prisma } from './db';
import type { NotificationType } from '@prisma/client';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@deebop.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export function isPushEnabled(): boolean {
  return !!(vapidPublicKey && vapidPrivateKey);
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

// Get notification title and body based on type
function getNotificationContent(
  type: NotificationType,
  actorName: string,
  postHeadline?: string | null
): { title: string; body: string } {
  switch (type) {
    case 'like':
      return {
        title: 'New Like',
        body: `${actorName} liked your post${postHeadline ? `: "${postHeadline}"` : ''}`,
      };
    case 'follow':
      return {
        title: 'New Follower',
        body: `${actorName} started following you`,
      };
    case 'follow_request':
      return {
        title: 'Follow Request',
        body: `${actorName} wants to follow you`,
      };
    case 'share':
      return {
        title: 'Post Shared',
        body: `${actorName} shared your post`,
      };
    case 'mention':
      return {
        title: 'New Mention',
        body: `${actorName} mentioned you in a post`,
      };
    case 'repost':
      return {
        title: 'New Repost',
        body: `${actorName} reposted your content`,
      };
    case 'repost_request':
      return {
        title: 'Repost Request',
        body: `${actorName} wants to repost your content`,
      };
    case 'repost_approved':
      return {
        title: 'Repost Approved',
        body: `${actorName} approved your repost`,
      };
    case 'tag':
      return {
        title: 'You were tagged',
        body: `${actorName} tagged you in a post`,
      };
    case 'tag_request':
      return {
        title: 'Tag Request',
        body: `${actorName} wants to tag you in a post`,
      };
    case 'tag_approved':
      return {
        title: 'Tag Approved',
        body: `${actorName} approved your tag`,
      };
    case 'event_invite':
      return {
        title: 'Event Invitation',
        body: `${actorName} invited you to an event`,
      };
    case 'album_invite':
      return {
        title: 'Album Invitation',
        body: `${actorName} invited you to an album`,
      };
    case 'favourite':
      return {
        title: 'Added to Favourites',
        body: `${actorName} added you to their favourites`,
      };
    default:
      return {
        title: 'New Notification',
        body: `You have a new notification from ${actorName}`,
      };
  }
}

// Check if user should receive push for this notification type
function shouldSendPush(
  type: NotificationType,
  userPrefs: {
    pushEnabled: boolean;
    notifyLikes: boolean;
    notifyFollowers: boolean;
    notifyShares: boolean;
    notifyMentions: boolean;
  }
): boolean {
  if (!userPrefs.pushEnabled) return false;

  switch (type) {
    case 'like':
      return userPrefs.notifyLikes;
    case 'follow':
    case 'follow_request':
      return userPrefs.notifyFollowers;
    case 'share':
    case 'repost':
    case 'repost_request':
    case 'repost_approved':
    case 'repost_denied':
      return userPrefs.notifyShares;
    case 'mention':
    case 'mention_request':
    case 'mention_approved':
    case 'mention_denied':
    case 'tag':
    case 'tag_request':
    case 'tag_approved':
    case 'tag_denied':
      return userPrefs.notifyMentions;
    // Always send for invites and favourites if push is enabled
    case 'event_invite':
    case 'album_invite':
    case 'favourite':
      return true;
    default:
      return true;
  }
}

// Send push notification to a user
export async function sendPushToUser(
  userId: string,
  type: NotificationType,
  actorName: string,
  options?: {
    postId?: string;
    postHeadline?: string | null;
    eventId?: string;
    albumId?: string;
  }
): Promise<void> {
  if (!isPushEnabled()) {
    console.log('Push notifications not configured');
    return;
  }

  try {
    // Get user preferences and subscriptions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        pushEnabled: true,
        notifyLikes: true,
        notifyFollowers: true,
        notifyShares: true,
        notifyMentions: true,
        pushSubscriptions: true,
      },
    });

    if (!user || !user.pushSubscriptions.length) {
      return;
    }

    // Check if user wants this type of notification
    if (!shouldSendPush(type, user)) {
      return;
    }

    const { title, body } = getNotificationContent(
      type,
      actorName,
      options?.postHeadline
    );

    // Build URL for notification click
    let url = '/notifications';
    if (options?.postId) {
      url = `/p/${options.postId}`;
    } else if (options?.eventId) {
      url = `/events/${options.eventId}`;
    } else if (options?.albumId) {
      url = `/albums/${options.albumId}`;
    }

    const payload: PushPayload = {
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-144.png',
      url,
      tag: type, // Group notifications by type
    };

    // Send to all user's subscriptions
    const sendPromises = user.pushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload)
        );
      } catch (error: unknown) {
        // If subscription is invalid/expired, remove it
        const webPushError = error as { statusCode?: number };
        if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          });
        }
        console.error(`Failed to send push to subscription ${sub.id}:`, error);
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Send push to multiple users (for broadcasts)
export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  url?: string
): Promise<void> {
  if (!isPushEnabled()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: { in: userIds },
      user: { pushEnabled: true },
    },
  });

  const payload: PushPayload = {
    title,
    body,
    icon: '/icon-192.png',
    badge: '/icon-144.png',
    url,
  };

  const sendPromises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      );
    } catch (error: unknown) {
      const webPushError = error as { statusCode?: number };
      if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
        await prisma.pushSubscription.delete({
          where: { id: sub.id },
        });
      }
    }
  });

  await Promise.all(sendPromises);
}
