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
 * - name: exported function name
 *
 * Rate limited to 1 extraction per minute per tool
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageName, name } = body;

    if (!packageName || !name) {
      return NextResponse.json(
        { success: false, error: 'packageName and name are required' },
        { status: 400 }
      );
    }

    console.log('[Extract Schema] Looking up tool:', { packageName, name });

    // Find the tool by package name and export name
    const tool = await prisma.tool.findFirst({
      where: {
        name,
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
      console.log('[Extract Schema] Tool not found:', { packageName, name });
      return NextResponse.json({ success: false, error: 'Tool not found' }, { status: 404 });
    }

    // Rate limiting based on last attempt
    // - If last attempt succeeded: 1 hour cooldown (re-extraction rarely needed)
    // - If last attempt failed: 1 minute cooldown (allow retry)
    // - If no previous attempt: no cooldown
    if (tool.schemaExtractionAttemptAt) {
      const timeSinceLastAttempt = Date.now() - tool.schemaExtractionAttemptAt.getTime();
      const lastAttemptFailed = !!tool.schemaExtractionError;
      const cooldownMs = lastAttemptFailed ? 60_000 : 3600_000; // 1 min if failed, 1 hour if succeeded

      if (timeSinceLastAttempt < cooldownMs) {
        const retryAfter = Math.ceil((cooldownMs - timeSinceLastAttempt) / 1000);
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limited',
            message: lastAttemptFailed
              ? `Please wait ${retryAfter} seconds before retrying failed extraction`
              : `Schema was recently extracted. Please wait ${Math.ceil(retryAfter / 60)} minutes before re-extracting`,
            retryAfter,
            lastAttemptFailed,
          },
          { status: 429 }
        );
      }
    }

    console.log('[Extract Schema] Extracting schema for:', {
      packageName: tool.package.npmPackageName,
      name: tool.name,
      version: tool.package.npmVersion,
    });

    // Extract schema from executor
    const schemaResult = await extractToolSchema(
      tool.package.npmPackageName,
      tool.name,
      tool.package.npmVersion,
      tool.package.env as Record<string, unknown> | null
    );

    if (schemaResult.success) {
      // Update tool with extracted schema
      const now = new Date();
      const updatedTool = await prisma.tool.update({
        where: { id: tool.id },
        data: {
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
          inputSchema: schemaResult.inputSchema as any,
          // Also update parameters array for backward compatibility
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
          parameters: convertJsonSchemaToParameters(schemaResult.inputSchema) as any,
          schemaSource: 'extracted',
          schemaExtractedAt: now,
          schemaExtractionAttemptAt: now, // Track attempt for rate limiting
          schemaExtractionError: null, // Clear any previous error on success
        },
        select: {
          id: true,
          name: true,
          inputSchema: true,
          parameters: true,
          schemaSource: true,
          schemaExtractedAt: true,
        },
      });

      console.log('[Extract Schema] Schema extracted successfully:', {
        toolId: updatedTool.id,
        name: updatedTool.name,
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
      name,
      error: schemaResult.error,
    });

    // Update tool to mark extraction attempt and store error (allows retry after 1 min cooldown)
    await prisma.tool.update({
      where: { id: tool.id },
      data: {
        schemaExtractionAttemptAt: new Date(), // Track attempt for rate limiting
        schemaExtractionError: schemaResult.error || 'Unknown extraction error', // Store error to enable retry
        // Note: schemaExtractedAt is NOT updated - it only tracks successful extractions
      },
    });

    return NextResponse.json({
      success: false,
      error: 'Schema extraction failed',
      message: schemaResult.error,
      schemaSource: tool.schemaSource,
      canRetryAfter: 60, // Inform client they can retry after 1 minute
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
