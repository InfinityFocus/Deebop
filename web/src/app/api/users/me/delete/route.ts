import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

// DELETE /api/users/me/delete - Permanently delete user account and all associated data
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the identity ID to delete all profiles under this identity
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { identityId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all user IDs under this identity (all profiles)
    const allProfiles = await prisma.user.findMany({
      where: { identityId: currentUser.identityId },
      select: { id: true },
    });

    const userIds = allProfiles.map((p) => p.id);

    // Delete in order to respect foreign key constraints
    // Using transactions to ensure atomicity

    await prisma.$transaction(async (tx) => {
      // 1. Delete notifications (both sent and received)
      await tx.notification.deleteMany({
        where: {
          OR: [
            { userId: { in: userIds } },
            { actorId: { in: userIds } },
          ],
        },
      });

      // 2. Delete reports (both reported and reporter)
      await tx.report.deleteMany({
        where: {
          OR: [
            { reporterId: { in: userIds } },
          ],
        },
      });

      // 3. Delete reposts
      await tx.repost.deleteMany({
        where: { userId: { in: userIds } },
      });

      // 4. Delete shares
      await tx.share.deleteMany({
        where: { userId: { in: userIds } },
      });

      // 5. Delete saves
      await tx.save.deleteMany({
        where: { userId: { in: userIds } },
      });

      // 6. Delete likes
      await tx.like.deleteMany({
        where: { userId: { in: userIds } },
      });

      // 7. Delete follows (both following and followers)
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: { in: userIds } },
            { followingId: { in: userIds } },
          ],
        },
      });

      // 8. Delete boosts
      await tx.boost.deleteMany({
        where: { userId: { in: userIds } },
      });

      // 9. Delete video jobs
      await tx.videoJob.deleteMany({
        where: { userId: { in: userIds } },
      });

      // 10. Delete video project related data
      await tx.videoOverlay.deleteMany({
        where: {
          project: { userId: { in: userIds } },
        },
      });

      await tx.videoClip.deleteMany({
        where: {
          project: { userId: { in: userIds } },
        },
      });

      await tx.videoProject.deleteMany({
        where: { userId: { in: userIds } },
      });

      // 11. Delete album related data
      await tx.albumInvite.deleteMany({
        where: {
          OR: [
            { album: { ownerId: { in: userIds } } },
            { inviteeId: { in: userIds } },
            { inviterId: { in: userIds } },
          ],
        },
      });

      await tx.albumMember.deleteMany({
        where: {
          OR: [
            { album: { ownerId: { in: userIds } } },
            { userId: { in: userIds } },
          ],
        },
      });

      await tx.albumItem.deleteMany({
        where: {
          OR: [
            { album: { ownerId: { in: userIds } } },
            { uploaderId: { in: userIds } },
          ],
        },
      });

      await tx.albumLike.deleteMany({
        where: { userId: { in: userIds } },
      });

      await tx.albumSave.deleteMany({
        where: { userId: { in: userIds } },
      });

      await tx.album.deleteMany({
        where: { ownerId: { in: userIds } },
      });

      // 12. Delete event related data
      await tx.eventInviteLinkRedemption.deleteMany({
        where: { userId: { in: userIds } },
      });

      await tx.eventInviteLink.deleteMany({
        where: {
          OR: [
            { event: { hostId: { in: userIds } } },
            { createdById: { in: userIds } },
          ],
        },
      });

      await tx.eventInvite.deleteMany({
        where: {
          OR: [
            { event: { hostId: { in: userIds } } },
            { inviteeId: { in: userIds } },
            { inviterId: { in: userIds } },
          ],
        },
      });

      await tx.eventRsvp.deleteMany({
        where: {
          OR: [
            { event: { hostId: { in: userIds } } },
            { userId: { in: userIds } },
          ],
        },
      });

      await tx.event.deleteMany({
        where: { hostId: { in: userIds } },
      });

      // 13. Delete explore related data
      await tx.recentSearch.deleteMany({
        where: { userId: { in: userIds } },
      });

      await tx.userContentPrefs.deleteMany({
        where: { userId: { in: userIds } },
      });

      await tx.userLocation.deleteMany({
        where: { userId: { in: userIds } },
      });

      await tx.userInterest.deleteMany({
        where: { userId: { in: userIds } },
      });

      // 14. Delete favourites
      await tx.favourite.deleteMany({
        where: {
          OR: [
            { userId: { in: userIds } },
            { favouriteId: { in: userIds } },
          ],
        },
      });

      // 15. Delete creator page data
      await tx.creatorPageLink.deleteMany({
        where: {
          page: { userId: { in: userIds } },
        },
      });

      await tx.creatorPage.deleteMany({
        where: { userId: { in: userIds } },
      });

      // 16. Delete posts (this will cascade delete related data)
      await tx.post.deleteMany({
        where: { userId: { in: userIds } },
      });

      // 17. Delete all user profiles under this identity
      await tx.user.deleteMany({
        where: { identityId: currentUser.identityId },
      });

      // 18. Delete the identity itself
      await tx.identity.delete({
        where: { id: currentUser.identityId },
      });
    });

    // Clear the auth cookie
    const cookieStore = await cookies();
    cookieStore.delete('deebop-auth');

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
