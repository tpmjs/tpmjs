import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '~/lib/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/admin/users
 * Paginated user list with activity counts, tier, role
 * Requires ADMIN role.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { username: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const orderBy: Record<string, string> = {};
    if (['createdAt', 'name', 'email', 'tier', 'role'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        tier: true,
        role: true,
        signupSource: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            collections: true,
            agents: true,
            activities: true,
            toolLikes: true,
            apiKeys: true,
            tpmjsApiKeys: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit + 1,
    });

    const hasMore = users.length > limit;
    const results = hasMore ? users.slice(0, limit) : users;

    return NextResponse.json({
      success: true,
      data: {
        users: results,
        pagination: {
          page,
          limit,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error('[Admin Users Error]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
