import { prisma } from '@tpmjs/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from '~/lib/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/admin/stats
 * Returns latest StatsSnapshot + trend data (last 30 snapshots)
 * Requires ADMIN role.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshots = await prisma.statsSnapshot.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    });

    const latest = snapshots[0] ?? null;

    // Serialize BigInt fields
    const serialized = snapshots.map((s) => ({
      ...s,
      tokensInput: Number(s.tokensInput),
      tokensOutput: Number(s.tokensOutput),
      tokensTotal: Number(s.tokensTotal),
    }));

    // Compute some summary stats
    const totalUsers = await prisma.user.count();
    const totalSessions = await prisma.session.count();

    return NextResponse.json({
      success: true,
      data: {
        latest: latest
          ? {
              ...latest,
              tokensInput: Number(latest.tokensInput),
              tokensOutput: Number(latest.tokensOutput),
              tokensTotal: Number(latest.tokensTotal),
            }
          : null,
        trend: serialized.reverse(), // oldest first for charts
        totalUsers,
        totalSessions,
      },
    });
  } catch (error) {
    console.error('[Admin Stats Error]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
