import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { supabase } from '@/lib/db';

// GET /api/parent/children - List all children for current parent
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: children, error } = await supabase
      .from('chat.children')
      .select('*')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch children:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch children' },
        { status: 500 }
      );
    }

    // Transform snake_case to camelCase
    const transformedChildren = (children || []).map((child) => ({
      id: child.id,
      parentId: child.parent_id,
      username: child.username,
      displayName: child.display_name,
      avatarId: child.avatar_id,
      ageBand: child.age_band,
      oversightMode: child.oversight_mode,
      messagingPaused: child.messaging_paused,
      quietHoursStart: child.quiet_hours_start,
      quietHoursEnd: child.quiet_hours_end,
      createdAt: child.created_at,
    }));

    return NextResponse.json({ success: true, data: transformedChildren });
  } catch (error) {
    console.error('Children fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/parent/children - Create a new child account
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, displayName, password, avatarId, ageBand, oversightMode } = body;

    // Validate required fields
    if (!username || !displayName || !password) {
      return NextResponse.json(
        { success: false, error: 'Username, display name, and password are required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { success: false, error: 'Username must be 3-20 characters (letters, numbers, underscore)' },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if username is taken
    const { data: existing } = await supabase
      .from('chat.children')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create child
    const { data: child, error } = await supabase
      .from('chat.children')
      .insert({
        parent_id: user.id,
        username,
        display_name: displayName,
        password_hash: passwordHash,
        avatar_id: avatarId || 'cat',
        age_band: ageBand || '6-8',
        oversight_mode: oversightMode || 'approve_first',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create child:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Log action
    await supabase.from('chat.audit_log').insert({
      parent_id: user.id,
      child_id: child.id,
      action: 'child_created',
      details: { username, displayName },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: child.id,
        parentId: child.parent_id,
        username: child.username,
        displayName: child.display_name,
        avatarId: child.avatar_id,
        ageBand: child.age_band,
        oversightMode: child.oversight_mode,
        messagingPaused: child.messaging_paused,
        createdAt: child.created_at,
      },
    });
  } catch (error) {
    console.error('Child creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
