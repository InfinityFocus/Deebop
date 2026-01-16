import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getParentById, getChildById, getChildrenByParentId } from '@/lib/db';

export async function GET() {
  try {
    const payload = await getCurrentUser();

    if (!payload) {
      return NextResponse.json({
        success: true,
        data: { user: null },
      });
    }

    if (payload.type === 'parent') {
      // Get parent details
      const parent = await getParentById(payload.id);
      if (!parent) {
        return NextResponse.json({
          success: true,
          data: { user: null },
        });
      }

      // Get parent's children
      const children = await getChildrenByParentId(parent.id);

      return NextResponse.json({
        success: true,
        data: {
          user: {
            type: 'parent',
            id: parent.id,
            email: parent.email,
            displayName: parent.display_name,
          },
          children: children.map(child => ({
            id: child.id,
            username: child.username,
            displayName: child.display_name,
            avatarId: child.avatar_id,
            ageBand: child.age_band,
            oversightMode: child.oversight_mode,
            messagingPaused: child.messaging_paused,
            voiceMessagingEnabled: child.voice_messaging_enabled,
            quietHoursStart: child.quiet_hours_start,
            quietHoursEnd: child.quiet_hours_end,
            createdAt: child.created_at,
          })),
        },
      });
    }

    if (payload.type === 'child') {
      // Get child details
      const child = await getChildById(payload.id);
      if (!child) {
        return NextResponse.json({
          success: true,
          data: { user: null },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          user: {
            type: 'child',
            id: child.id,
            parentId: child.parent_id,
            username: child.username,
            displayName: child.display_name,
            avatarId: child.avatar_id,
            ageBand: child.age_band,
            oversightMode: child.oversight_mode,
            messagingPaused: child.messaging_paused,
            voiceMessagingEnabled: child.voice_messaging_enabled,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { user: null },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user info' },
      { status: 500 }
    );
  }
}
