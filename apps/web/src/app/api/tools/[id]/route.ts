import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/tools/[id]
 * Get tool details by ID or package name
 *
 * Params:
 * - id: Tool ID (number) or NPM package name (string)
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing ID parameter',
        },
        { status: 400 }
      );
    }

    // Try to find by ID first (cuid), then by package name
    const tool = await prisma.tool.findFirst({
      where: {
        OR: [{ id }, { npmPackageName: id }],
      },
    });

    if (!tool) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tool not found',
          message: `No tool found with ID or package name: ${id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tool,
    });
  } catch (error) {
    console.error('Error fetching tool details:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tool details',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
