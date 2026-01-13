import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/users/me/export-data - Download all your data
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data
    const [
      profile,
      posts,
      likes,
      saves,
      following,
      followers,
      blocked,
      muted,
      restricted,
      notifications,
    ] = await Promise.all([
      // Profile
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          coverImageUrl: true,
          profileLink: true,
          tier: true,
          isPrivate: true,
          showActivityStatus: true,
          allowTagging: true,
          requireTaggingApproval: true,
          limitTagsToFollowers: true,
          allowMentions: true,
          requireMentionApproval: true,
          limitMentionsToFollowers: true,
          showLikedPosts: true,
          allowReposts: true,
          requireRepostApproval: true,
          hideFromDiscovery: true,
          dontSuggestAccount: true,
          hideFollowersList: true,
          hideFollowingList: true,
          hideEngagementCounts: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      // Posts
      prisma.post.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          contentType: true,
          headline: true,
          headlineStyle: true,
          textContent: true,
          mediaUrl: true,
          mediaThumbnailUrl: true,
          mediaWidth: true,
          mediaHeight: true,
          mediaDurationSeconds: true,
          visibility: true,
          provenance: true,
          status: true,
          droppedAt: true,
          isSponsoredContent: true,
          isSensitiveContent: true,
          likesCount: true,
          savesCount: true,
          sharesCount: true,
          repostsCount: true,
          viewsCount: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Likes
      prisma.like.findMany({
        where: { userId: user.id },
        include: {
          post: {
            select: {
              id: true,
              headline: true,
              textContent: true,
              user: { select: { username: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Saves
      prisma.save.findMany({
        where: { userId: user.id },
        include: {
          post: {
            select: {
              id: true,
              headline: true,
              textContent: true,
              user: { select: { username: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Following
      prisma.follow.findMany({
        where: { followerId: user.id },
        include: {
          following: {
            select: { id: true, username: true, displayName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Followers
      prisma.follow.findMany({
        where: { followingId: user.id },
        include: {
          follower: {
            select: { id: true, username: true, displayName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Blocked
      prisma.block.findMany({
        where: { blockerId: user.id },
        include: {
          blocked: {
            select: { id: true, username: true, displayName: true },
          },
        },
      }),
      // Muted
      prisma.mute.findMany({
        where: { muterId: user.id },
        include: {
          muted: {
            select: { id: true, username: true, displayName: true },
          },
        },
      }),
      // Restricted
      prisma.restrict.findMany({
        where: { restricterId: user.id },
        include: {
          restricted: {
            select: { id: true, username: true, displayName: true },
          },
        },
      }),
      // Notifications (last 1000)
      prisma.notification.findMany({
        where: { userId: user.id },
        take: 1000,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: profile ? {
        ...profile,
        display_name: profile.displayName,
        avatar_url: profile.avatarUrl,
        cover_image_url: profile.coverImageUrl,
        profile_link: profile.profileLink,
        is_private: profile.isPrivate,
        show_activity_status: profile.showActivityStatus,
        allow_tagging: profile.allowTagging,
        require_tagging_approval: profile.requireTaggingApproval,
        limit_tags_to_followers: profile.limitTagsToFollowers,
        allow_mentions: profile.allowMentions,
        require_mention_approval: profile.requireMentionApproval,
        limit_mentions_to_followers: profile.limitMentionsToFollowers,
        show_liked_posts: profile.showLikedPosts,
        allow_reposts: profile.allowReposts,
        require_repost_approval: profile.requireRepostApproval,
        hide_from_discovery: profile.hideFromDiscovery,
        dont_suggest_account: profile.dontSuggestAccount,
        hide_followers_list: profile.hideFollowersList,
        hide_following_list: profile.hideFollowingList,
        hide_engagement_counts: profile.hideEngagementCounts,
        created_at: profile.createdAt,
        updated_at: profile.updatedAt,
      } : null,
      posts: posts.map((p) => ({
        id: p.id,
        content_type: p.contentType,
        headline: p.headline,
        headline_style: p.headlineStyle,
        text_content: p.textContent,
        media_url: p.mediaUrl,
        media_thumbnail_url: p.mediaThumbnailUrl,
        media_width: p.mediaWidth,
        media_height: p.mediaHeight,
        media_duration_seconds: p.mediaDurationSeconds,
        visibility: p.visibility,
        provenance: p.provenance,
        status: p.status,
        dropped_at: p.droppedAt,
        is_sponsored_content: p.isSponsoredContent,
        is_sensitive_content: p.isSensitiveContent,
        likes_count: p.likesCount,
        saves_count: p.savesCount,
        shares_count: p.sharesCount,
        reposts_count: p.repostsCount,
        views_count: p.viewsCount,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })),
      likes: likes.map((l) => ({
        post_id: l.postId,
        post_headline: l.post.headline,
        post_text: l.post.textContent?.substring(0, 100),
        post_author: l.post.user.username,
        liked_at: l.createdAt,
      })),
      saves: saves.map((s) => ({
        post_id: s.postId,
        post_headline: s.post.headline,
        post_text: s.post.textContent?.substring(0, 100),
        post_author: s.post.user.username,
        saved_at: s.createdAt,
      })),
      following: following.map((f) => ({
        user_id: f.following.id,
        username: f.following.username,
        display_name: f.following.displayName,
        followed_at: f.createdAt,
      })),
      followers: followers.map((f) => ({
        user_id: f.follower.id,
        username: f.follower.username,
        display_name: f.follower.displayName,
        followed_at: f.createdAt,
      })),
      blocked_users: blocked.map((b) => ({
        user_id: b.blocked.id,
        username: b.blocked.username,
        display_name: b.blocked.displayName,
        blocked_at: b.createdAt,
      })),
      muted_users: muted.map((m) => ({
        user_id: m.muted.id,
        username: m.muted.username,
        display_name: m.muted.displayName,
        muted_at: m.createdAt,
      })),
      restricted_users: restricted.map((r) => ({
        user_id: r.restricted.id,
        username: r.restricted.username,
        display_name: r.restricted.displayName,
        restricted_at: r.createdAt,
      })),
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        read: n.read,
        created_at: n.createdAt,
      })),
    };

    // Return as JSON with download headers
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="deebop-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Export data error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
