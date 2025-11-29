import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/tools/[...slug]
 *
 * Fetch a single tool by its NPM package name (slug)
 * Supports catch-all routing for scoped packages like @tpmjs/text-transformer
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    // Join slug array to reconstruct package name (e.g., ['@tpmjs', 'text-transformer'] -> '@tpmjs/text-transformer')
    const packageName = slug.join('/');

    // Find the tool by npmPackageName
    const tool = await prisma.tool.findUnique({
      where: {
        npmPackageName: packageName,
      },
    });

    if (!tool) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tool not found',
        },
        { status: 404 }
      );
    }

    // Return the tool data
    return NextResponse.json({
      success: true,
      data: tool,
    });
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tool',
      },
      { status: 500 }
    );
  }
}
