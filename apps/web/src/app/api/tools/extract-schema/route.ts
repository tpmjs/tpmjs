import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { convertJsonSchemaToParameters, extractToolSchema } from '~/lib/schema-extraction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/tools/extract-schema
 * Manually trigger schema extraction for a tool
 *
 * Body:
 * - packageName: npm package name
 * - exportName: exported function name
 *
 * Rate limited to 1 extraction per minute per tool
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageName, exportName } = body;

    if (!packageName || !exportName) {
      return NextResponse.json(
        { success: false, error: 'packageName and exportName are required' },
        { status: 400 }
      );
    }

    console.log('[Extract Schema] Looking up tool:', { packageName, exportName });

    // Find the tool by package name and export name
    const tool = await prisma.tool.findFirst({
      where: {
        exportName,
        package: {
          npmPackageName: packageName,
        },
      },
      include: {
        package: {
          select: {
            npmPackageName: true,
            npmVersion: true,
            env: true,
          },
        },
      },
    });

    if (!tool) {
      console.log('[Extract Schema] Tool not found:', { packageName, exportName });
      return NextResponse.json({ success: false, error: 'Tool not found' }, { status: 404 });
    }

    // Rate limit: 1 minute cooldown
    if (tool.schemaExtractedAt) {
      const timeSinceLastExtraction = Date.now() - tool.schemaExtractedAt.getTime();
      const cooldownMs = 60000; // 1 minute

      if (timeSinceLastExtraction < cooldownMs) {
        const retryAfter = Math.ceil((cooldownMs - timeSinceLastExtraction) / 1000);
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limited',
            message: `Please wait ${retryAfter} seconds before trying again`,
            retryAfter,
          },
          { status: 429 }
        );
      }
    }

    console.log('[Extract Schema] Extracting schema for:', {
      packageName: tool.package.npmPackageName,
      exportName: tool.exportName,
      version: tool.package.npmVersion,
    });

    // Extract schema from executor
    const schemaResult = await extractToolSchema(
      tool.package.npmPackageName,
      tool.exportName,
      tool.package.npmVersion,
      tool.package.env as Record<string, unknown> | null
    );

    if (schemaResult.success) {
      // Update tool with extracted schema
      const updatedTool = await prisma.tool.update({
        where: { id: tool.id },
        data: {
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
          inputSchema: schemaResult.inputSchema as any,
          // Also update parameters array for backward compatibility
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
          parameters: convertJsonSchemaToParameters(schemaResult.inputSchema) as any,
          schemaSource: 'extracted',
          schemaExtractedAt: new Date(),
        },
        select: {
          id: true,
          exportName: true,
          inputSchema: true,
          parameters: true,
          schemaSource: true,
          schemaExtractedAt: true,
        },
      });

      console.log('[Extract Schema] Schema extracted successfully:', {
        toolId: updatedTool.id,
        exportName: updatedTool.exportName,
        schemaSource: updatedTool.schemaSource,
      });

      return NextResponse.json({
        success: true,
        message: 'Schema extracted successfully',
        schemaSource: 'extracted',
        tool: updatedTool,
      });
    }

    // Extraction failed
    console.log('[Extract Schema] Extraction failed:', {
      packageName,
      exportName,
      error: schemaResult.error,
    });

    // Update tool to mark extraction attempt
    await prisma.tool.update({
      where: { id: tool.id },
      data: {
        schemaExtractedAt: new Date(), // Update timestamp even on failure for rate limiting
      },
    });

    return NextResponse.json({
      success: false,
      error: 'Schema extraction failed',
      message: schemaResult.error,
      schemaSource: tool.schemaSource,
    });
  } catch (error) {
    console.error('[Extract Schema] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to extract schema',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
