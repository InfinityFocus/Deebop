import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { AVATARS } from '@/types';

// GET /api/child/profile - Get current child's profile
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'child') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: child, error } = await supabase
      .from('children')
      .select('id, username, display_name, avatar_id, age_band, voice_messaging_enabled')
      .eq('id', user.id)
      .single();

    if (error || !child) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: child.id,
        username: child.username,
        displayName: child.display_name,
        avatarId: child.avatar_id,
        ageBand: child.age_band,
        voiceMessagingEnabled: child.voice_messaging_enabled,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/child/profile - Update current child's avatar
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'child') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { avatarId } = body;

    // Validate avatarId
    if (!avatarId || !AVATARS.find((a) => a.id === avatarId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid avatar' },
        { status: 400 }
      );
    }

    // Update avatar
    const { data: child, error } = await supabase
      .from('children')
      .update({ avatar_id: avatarId })
      .eq('id', user.id)
      .select('id, username, display_name, avatar_id, age_band, voice_messaging_enabled')
      .single();

    if (error) {
      console.error('Failed to update avatar:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update avatar' },
        { status: 500 }
      );
    }

    // Log action
    await supabase.from('audit_log').insert({
      parent_id: user.parentId,
      child_id: user.id,
      action: 'child_avatar_changed',
      details: { avatarId },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: child.id,
        username: child.username,
        displayName: child.display_name,
        avatarId: child.avatar_id,
        ageBand: child.age_band,
        voiceMessagingEnabled: child.voice_messaging_enabled,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
