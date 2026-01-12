import { NextRequest, NextResponse } from 'next/server';
import { getIdentity, getIdentityProfiles } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/profiles/[id] - Get a specific profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const profile = await prisma.user.findFirst({
      where: {
        id,
        identityId: identity.id,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        coverImageUrl: true,
        profileLink: true,
        isDefault: true,
        isSuspended: true,
        followersCount: true,
        followingCount: true,
        postsCount: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT /api/profiles/[id] - Update a profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify profile belongs to this identity
    const existingProfile = await prisma.user.findFirst({
      where: {
        id,
        identityId: identity.id,
      },
    });

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { displayName, bio, profileLink, isDefault } = body;

    // If setting this as default, unset other defaults
    if (isDefault === true) {
      await prisma.user.updateMany({
        where: {
          identityId: identity.id,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const profile = await prisma.user.update({
      where: { id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(profileLink !== undefined && { profileLink }),
        ...(isDefault !== undefined && { isDefault }),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        coverImageUrl: true,
        profileLink: true,
        isDefault: true,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// DELETE /api/profiles/[id] - Delete a profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all profiles for this identity
    const profiles = await getIdentityProfiles();

    // Cannot delete if it's the only profile
    if (profiles.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete your only profile' },
        { status: 400 }
      );
    }

    // Verify profile belongs to this identity
    const profileToDelete = profiles.find(p => p.id === id);
    if (!profileToDelete) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // If deleting the default profile, make another one default
    if (profileToDelete.isDefault) {
      const newDefault = profiles.find(p => p.id !== id && !p.isSuspended);
      if (newDefault) {
        await prisma.user.update({
          where: { id: newDefault.id },
          data: { isDefault: true },
        });
      }
    }

    // Delete the profile (cascades to content)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete profile error:', error);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}
