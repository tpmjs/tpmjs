import { prisma } from '@tpmjs/db';
import { fetchLatestPackageWithMetadata } from '@tpmjs/npm-client';
import type { TpmjsToolDefinition } from '@tpmjs/types/tpmjs';
import { validateTpmjsField } from '@tpmjs/types/tpmjs';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';
import { performHealthCheck } from '~/lib/health-check/health-check-service';
import {
  convertJsonSchemaToParameters,
  extractToolSchema,
  listToolExports,
} from '~/lib/schema-extraction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/sync/package
 * Manually sync a specific package by name
 *
 * Body: { packageName: string }
 * Requires Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (env.CRON_SECRET && token !== env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const packageName = body.packageName;

    if (!packageName || typeof packageName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'packageName is required' },
        { status: 400 }
      );
    }

    // Fetch full package metadata
    const pkg = await fetchLatestPackageWithMetadata(packageName);

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: `Package ${packageName} not found on npm` },
        { status: 404 }
      );
    }

    // Check if package has tpmjs keyword
    const hasTpmjsKeyword = pkg.keywords?.includes('tpmjs') || pkg.keywords?.includes('tpmjs-tool');

    if (!hasTpmjsKeyword) {
      return NextResponse.json(
        { success: false, error: `Package ${packageName} does not have tpmjs keyword` },
        { status: 400 }
      );
    }

    // Determine validation based on tpmjs field presence
    let validation: ReturnType<typeof validateTpmjsField>;

    if (!pkg.tpmjs) {
      // No tpmjs field - use auto-discovery with default category
      console.log(
        `Package ${pkg.name} has tpmjs keyword but no tpmjs field - using auto-discovery`
      );
      validation = {
        valid: true,
        tier: 'minimal',
        packageData: {
          category: 'utilities',
        },
        tools: [],
        needsAutoDiscovery: true,
        wasLegacyFormat: false,
      };
    } else {
      validation = validateTpmjsField(pkg.tpmjs);
      if (!validation.valid || !validation.packageData) {
        return NextResponse.json(
          { success: false, error: 'Invalid tpmjs field in package.json' },
          { status: 400 }
        );
      }
    }

    const packageData = validation.packageData!;

    // Extract author name
    const authorName =
      typeof pkg.author === 'string'
        ? pkg.author
        : typeof pkg.author === 'object' && pkg.author?.name
          ? pkg.author.name
          : 'unknown';

    // Upsert Package record
    const packageRecord = await prisma.package.upsert({
      where: { npmPackageName: pkg.name },
      create: {
        npmPackageName: pkg.name,
        npmVersion: pkg.version,
        npmPublishedAt: pkg.publishedAt ? new Date(pkg.publishedAt) : new Date(),
        npmDescription: pkg.description ?? undefined,
        npmRepository: pkg.repository ?? undefined,
        npmHomepage: pkg.homepage ?? undefined,
        npmLicense: pkg.license ?? undefined,
        npmKeywords: pkg.keywords || [],
        npmReadme: pkg.readme ?? undefined,
        npmAuthor: pkg.author ?? undefined,
        npmMaintainers: pkg.maintainers ?? undefined,
        category: packageData.category,
        env: packageData.env ?? undefined,
        frameworks: packageData.frameworks || [],
        tier: validation.tier || 'minimal',
        discoveryMethod: 'manual',
        isOfficial: false,
        npmDownloadsLastMonth: 0,
        githubStars: null,
      },
      update: {
        npmVersion: pkg.version,
        npmPublishedAt: pkg.publishedAt ? new Date(pkg.publishedAt) : new Date(),
        npmDescription: pkg.description ?? undefined,
        npmRepository: pkg.repository ?? undefined,
        npmHomepage: pkg.homepage ?? undefined,
        npmLicense: pkg.license ?? undefined,
        npmKeywords: pkg.keywords || [],
        npmReadme: pkg.readme ?? undefined,
        npmAuthor: pkg.author ?? undefined,
        npmMaintainers: pkg.maintainers ?? undefined,
        category: packageData.category,
        env: packageData.env ?? undefined,
        frameworks: packageData.frameworks || [],
        tier: validation.tier || 'minimal',
      },
    });

    // Determine tools to process
    let toolsToProcess: TpmjsToolDefinition[] = validation.tools || [];
    let toolDiscoverySource: 'auto' | 'manual' = 'manual';

    // If tools need auto-discovery, call the executor
    if (validation.needsAutoDiscovery || toolsToProcess.length === 0) {
      console.log(`Auto-discovering tools for ${pkg.name}...`);
      const exportsResult = await listToolExports(pkg.name, pkg.version, null);

      if (exportsResult.success) {
        toolsToProcess = exportsResult.tools
          .filter((t) => t.isValidTool)
          .map((t) => ({
            name: t.name,
            description: t.description,
            parameters: undefined,
            returns: undefined,
            aiAgent: undefined,
          }));
        toolDiscoverySource = 'auto';
        console.log(
          `Auto-discovered ${toolsToProcess.length} tools for ${pkg.name}: ${toolsToProcess.map((t) => t.name).join(', ')}`
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to auto-discover tools: ${exportsResult.error}`,
            packageCreated: true,
            packageId: packageRecord.id,
          },
          { status: 500 }
        );
      }
    }

    const syncedTools: string[] = [];

    // Upsert each tool
    for (const toolDef of toolsToProcess) {
      const toolName = toolDef.name;
      if (!toolName) continue;

      const upsertedTool = await prisma.tool.upsert({
        where: {
          packageId_name: {
            packageId: packageRecord.id,
            name: toolName,
          },
        },
        create: {
          packageId: packageRecord.id,
          name: toolName,
          description: toolDef.description || 'No description provided',
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          parameters: toolDef.parameters ? (toolDef.parameters as any) : undefined,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          returns: toolDef.returns ? (toolDef.returns as any) : undefined,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          aiAgent: toolDef.aiAgent ? (toolDef.aiAgent as any) : undefined,
          qualityScore: null,
          schemaSource: toolDef.parameters ? 'author' : null,
          toolDiscoverySource,
        },
        update: {
          description: toolDef.description || undefined,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          parameters: toolDef.parameters ? (toolDef.parameters as any) : undefined,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          returns: toolDef.returns ? (toolDef.returns as any) : undefined,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          aiAgent: toolDef.aiAgent ? (toolDef.aiAgent as any) : undefined,
          toolDiscoverySource,
        },
      });

      // Extract schema
      const schemaResult = await extractToolSchema(pkg.name, toolName, pkg.version, null);

      if (schemaResult.success) {
        await prisma.tool.update({
          where: { id: upsertedTool.id },
          data: {
            // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
            inputSchema: schemaResult.inputSchema as any,
            // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
            parameters: convertJsonSchemaToParameters(schemaResult.inputSchema) as any,
            schemaSource: 'extracted',
            schemaExtractedAt: new Date(),
            ...(!toolDef.description && schemaResult.description
              ? { description: schemaResult.description }
              : {}),
          },
        });
      }

      // Trigger health check
      performHealthCheck(upsertedTool.id, 'sync').catch((err) => {
        console.error(`Health check failed for ${pkg.name}/${toolName}:`, err);
      });

      syncedTools.push(toolName);
    }

    return NextResponse.json({
      success: true,
      data: {
        packageId: packageRecord.id,
        packageName: pkg.name,
        version: pkg.version,
        category: packageData.category,
        toolCount: syncedTools.length,
        tools: syncedTools,
        author: authorName,
      },
    });
  } catch (error) {
    console.error('Manual package sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
