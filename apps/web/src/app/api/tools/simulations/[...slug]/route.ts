/**
 * Simulation history endpoint
 * Returns recent simulations for a tool with token usage data
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tools/simulations/[...slug]
 * Returns the last 10 simulations for a tool
 *
 * Slug can be:
 * - Tool ID (single slug)
 * - Package name + export name (multiple slugs)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;

  try {
    let tool;

    if (slug.length === 1) {
      // Single slug - treat as tool ID
      tool = await prisma.tool.findUnique({
        where: { id: slug[0] || '' },
        select: { id: true },
      });
    } else {
      // Multiple slugs - treat as packageName/name
      const packageName = decodeURIComponent(slug.slice(0, -1).join('/'));
      const name = decodeURIComponent(slug[slug.length - 1] || '');

      tool = await prisma.tool.findFirst({
        where: {
          package: { npmPackageName: packageName },
          name: name,
        },
        select: { id: true },
      });
    }

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
