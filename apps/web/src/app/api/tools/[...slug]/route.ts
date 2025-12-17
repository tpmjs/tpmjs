import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { performHealthCheck } from '~/lib/health-check/health-check-service';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Parse tool slug to extract package name and export name
 */
function parseSlug(slug: string[]): { packageName: string; name: string | undefined } {
  let packageName: string;
  let name: string | undefined;

  if (slug.length === 1) {
    // Single slug - package name without scope
    packageName = slug[0] || '';
  } else if (slug.length === 2) {
    // Could be: @scope/package OR package/name
    if (slug[0]?.startsWith('@')) {
      // @scope/package
      packageName = slug.join('/');
    } else {
      // package + name
      packageName = slug[0] || '';
      name = slug[1];
    }
  } else {
    // 3+ slugs: @scope/package/name
    packageName = slug.slice(0, slug[0]?.startsWith('@') ? 2 : 1).join('/');
    name = slug[slug.length - 1];
  }

  return { packageName, name };
}

/**
 * GET /api/tools/[...slug]
 *
 * Fetch a single tool by its NPM package name (slug)
 * Supports catch-all routing for scoped packages like @tpmjs/text-transformer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse> {
  // Check rate limit
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { slug } = await params;
    const { packageName, name } = parseSlug(slug);

    if (name) {
      // Find specific tool by package name and export name
      const tool = await prisma.tool.findFirst({
        where: {
          package: { npmPackageName: packageName },
          name: name,
        },
        include: { package: true },
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

      return NextResponse.json({
        success: true,
        data: tool,
      });
    }
    // Find all tools for the package
    const pkg = await prisma.package.findUnique({
      where: { npmPackageName: packageName },
      include: { tools: true },
    });

    if (!pkg) {
      return NextResponse.json(
        {
          success: false,
          error: 'Package not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        package: pkg,
        tools: pkg.tools,
      },
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

/**
 * POST /api/tools/[...slug]
 *
 * Manually trigger a health check for a specific tool
 * Rate limit: 5-minute cooldown per tool
 *
 * Examples:
 * - POST /api/tools/@tpmjs/hello/hello
 * - POST /api/tools/my-package/myTool
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse> {
  // Check rate limit
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { slug } = await params;
    const { packageName, name } = parseSlug(slug);

    // Health checks require export name
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Export name required for health check',
        },
        { status: 400 }
      );
    }

    // Find the tool
    const tool = await prisma.tool.findFirst({
      where: {
        package: { npmPackageName: packageName },
        name: name,
      },
      select: {
        id: true,
        lastHealthCheck: true,
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

    // Rate limiting: Check if last health check was within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (tool.lastHealthCheck && tool.lastHealthCheck > fiveMinutesAgo) {
      const nextAvailable = new Date(tool.lastHealthCheck.getTime() + 5 * 60 * 1000);
      const secondsRemaining = Math.ceil((nextAvailable.getTime() - Date.now()) / 1000);

      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Try again in ${secondsRemaining} seconds.`,
          retryAfter: secondsRemaining,
        },
        { status: 429 }
      );
    }

    // Perform health check
    console.log(`🏥 Manual health check triggered for ${packageName}/${name}`);
    const result = await performHealthCheck(tool.id, 'manual');

    return NextResponse.json({
      success: true,
      data: {
        toolId: result.toolId,
        packageName: packageName,
        name: name,
        importStatus: result.importStatus,
        importError: result.importError,
        importTimeMs: result.importTimeMs,
        executionStatus: result.executionStatus,
        executionError: result.executionError,
        executionTimeMs: result.executionTimeMs,
        overallStatus: result.overallStatus,
      },
    });
  } catch (error) {
    console.error('Error performing manual health check:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform health check',
      },
      { status: 500 }
    );
  }
}
