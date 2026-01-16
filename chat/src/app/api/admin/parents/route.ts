import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { getAllParents, getChildrenByParentId } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeChildren = searchParams.get('includeChildren') === 'true';

    const result = await getAllParents(search, page, limit);

    // Optionally include children counts
    if (includeChildren) {
      const parentsWithChildren = await Promise.all(
        result.parents.map(async (parent) => {
          const children = await getChildrenByParentId(parent.id);
          return {
            ...parent,
            childrenCount: children.length,
            children: children.map(c => ({
              id: c.id,
              username: c.username,
              displayName: c.display_name,
              avatarId: c.avatar_id,
              ageBand: c.age_band,
            })),
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: {
          ...result,
          parents: parentsWithChildren,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Admin parents error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parents' },
      { status: 500 }
    );
  }
}
