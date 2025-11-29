/**
 * Simulation history endpoint
 * Returns recent simulations for a tool with token usage data
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tools/[...slug]/simulations
 * Returns the last 10 simulations for a tool
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const packageName = decodeURIComponent(slug.join('/'));

  try {
    // Fetch tool
    const tool = await prisma.tool.findUnique({
      where: { npmPackageName: packageName },
      select: { id: true },
    });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Fetch recent simulations with token usage
    const simulations = await prisma.simulation.findMany({
      where: { toolId: tool.id },
      include: {
        tokenUsage: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ simulations });
  } catch (error) {
    console.error('Simulations endpoint error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
