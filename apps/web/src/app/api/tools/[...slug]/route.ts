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

    // Slug can be:
    // - ['@scope', 'package'] -> Get all tools for @scope/package
    // - ['@scope', 'package', 'exportName'] -> Get specific tool @scope/package/exportName
    // - ['package'] -> Get all tools for package
    // - ['package', 'exportName'] -> Get specific tool package/exportName

    let packageName: string;
    let exportName: string | undefined;

    if (slug.length === 1) {
      // Single slug - package name without scope
      packageName = slug[0] || '';
    } else if (slug.length === 2) {
      // Could be: @scope/package OR package/exportName
      if (slug[0]?.startsWith('@')) {
        // @scope/package
        packageName = slug.join('/');
      } else {
        // package + exportName
        packageName = slug[0] || '';
        exportName = slug[1];
      }
    } else {
      // 3+ slugs: @scope/package/exportName
      packageName = slug.slice(0, slug[0]?.startsWith('@') ? 2 : 1).join('/');
      exportName = slug[slug.length - 1];
    }

    if (exportName) {
      // Find specific tool by package name and export name
      const tool = await prisma.tool.findFirst({
        where: {
          package: { npmPackageName: packageName },
          exportName: exportName,
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
    } else {
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
    }
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
