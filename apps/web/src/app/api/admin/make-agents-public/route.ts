import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/make-agents-public
 * One-off endpoint to update all existing agents to be public.
 * Protected by CRON_SECRET.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Update all agents to be public
    const result = await prisma.agent.updateMany({
      where: { isPublic: false },
      data: { isPublic: true },
    });

    // Get all agents for verification
    const agents = await prisma.agent.findMany({
      select: { id: true, name: true, isPublic: true },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      agents: agents.map((a) => ({ name: a.name, isPublic: a.isPublic })),
    });
  } catch (error) {
    console.error('Failed to update agents:', error);
    return NextResponse.json({ success: false, error: 'Failed to update agents' }, { status: 500 });
  }
}
