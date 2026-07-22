import { pathToFileURL } from 'node:url';
import { prisma } from '../packages/db/src/index.js';
import { fetchLatestPackageWithMetadata } from '../packages/npm-client/src/package.js';
import { manualTools } from './manual-tools.js';

// Schema extraction uses the same on-box executor as the production registry.
// Keep the old variable as a compatibility fallback for existing operator env files.
const EXECUTOR_URL =
  process.env.TPMJS_EXECUTOR_URL || process.env.RAILWAY_EXECUTOR_URL || 'http://127.0.0.1:3210';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function extractToolSchema(
  packageName: string,
  toolName: string,
  version: string,
  fetchImpl: typeof fetch = fetch
): Promise<
  | { success: true; inputSchema: Record<string, unknown>; description?: string }
  | { success: false; error: string }
> {
  try {
    const response = await fetchImpl(`${EXECUTOR_URL}/load-and-describe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageName, name: toolName, version, env: {} }),
    });
    const data: unknown = await response.json();
    if (!isRecord(data)) {
      return { success: false, error: 'Executor returned an invalid response' };
    }
    if (!response.ok || data.success !== true) {
      return {
        success: false,
        error: typeof data.error === 'string' ? data.error : 'Failed to extract schema',
      };
    }
    if (!isRecord(data.tool) || !isRecord(data.tool.inputSchema)) {
      return { success: false, error: 'No inputSchema returned from executor' };
    }
    return {
      success: true,
      inputSchema: data.tool.inputSchema,
      ...(typeof data.tool.description === 'string' ? { description: data.tool.description } : {}),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function convertJsonSchemaToParameters(inputSchema: Record<string, unknown>): Array<{
  name: string;
  type: string;
  description: string;
  required: boolean;
}> {
  const properties =
    (inputSchema.properties as Record<string, { type?: string; description?: string }>) || {};
  const required = (inputSchema.required as string[]) || [];
  return Object.entries(properties).map(([name, prop]) => ({
    name,
    type: prop.type || 'unknown',
    description: prop.description || '',
    required: required.includes(name),
  }));
}

export function convertParametersToJsonSchema(
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: string;
  }>
): Record<string, unknown> {
  const properties: Record<string, { type: string; description: string; default?: string }> = {};
  const required: string[] = [];

  for (const param of parameters) {
    const property: { type: string; description: string; default?: string } = {
      type: param.type || 'string',
      description: param.description || '',
    };
    if (param.default !== undefined) {
      property.default = param.default;
    }
    properties[param.name] = property;
    if (param.required) {
      required.push(param.name);
    }
  }

  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}

async function syncManualTools(): Promise<{ processed: number; skipped: number; errors: number }> {
  console.log('\n🔧 Starting manual tools sync...\n');

  let processed = 0;
  const skipped = 0;
  let errors = 0;

  for (const manualTool of manualTools) {
    try {
      console.log(`Processing: ${manualTool.npmPackageName} (${manualTool.name})`);

      // Fetch package metadata from npm
      const npmData = await fetchLatestPackageWithMetadata(manualTool.npmPackageName);

      if (!npmData) {
        console.error(`  ❌ Package not found on npm: ${manualTool.npmPackageName}`);
        errors++;
        continue;
      }

      // Use manual version if specified, otherwise use latest from npm
      const version = manualTool.npmVersion || npmData.version;

      // Get published date
      const publishedAt = npmData.publishedAt || new Date().toISOString();

      // Upsert Package record
      const packageRecord = await prisma.package.upsert({
        where: { npmPackageName: manualTool.npmPackageName },
        create: {
          npmPackageName: manualTool.npmPackageName,
          npmVersion: version,
          npmPublishedAt: new Date(publishedAt),
          npmDescription: npmData.description || null,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          npmRepository: npmData.repository ? (npmData.repository as any) : undefined,
          npmHomepage: npmData.homepage || manualTool.websiteUrl || null,
          npmLicense: npmData.license || null,
          npmKeywords: npmData.keywords || [],
          npmReadme: npmData.readme || null,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          npmAuthor: npmData.author ? (npmData.author as any) : undefined,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          npmMaintainers: npmData.maintainers ? (npmData.maintainers as any) : undefined,
          category: manualTool.category,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          env: manualTool.env ? (manualTool.env as any) : null,
          frameworks: manualTool.frameworks,
          tier: calculateTier(manualTool),
          discoveryMethod: 'manual',
          isOfficial: manualTool.npmPackageName.startsWith('@tpmjs/'),
          npmDownloadsLastMonth: 0,
        },
        update: {
          npmVersion: version,
          npmPublishedAt: new Date(publishedAt),
          npmDescription: npmData.description || null,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          npmRepository: npmData.repository ? (npmData.repository as any) : undefined,
          npmHomepage: npmData.homepage || manualTool.websiteUrl || null,
          npmLicense: npmData.license || null,
          npmKeywords: npmData.keywords || [],
          npmReadme: npmData.readme || null,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          npmAuthor: npmData.author ? (npmData.author as any) : undefined,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          npmMaintainers: npmData.maintainers ? (npmData.maintainers as any) : undefined,
          category: manualTool.category,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          env: manualTool.env ? (manualTool.env as any) : null,
          frameworks: manualTool.frameworks,
          tier: calculateTier(manualTool),
          isOfficial: manualTool.npmPackageName.startsWith('@tpmjs/'),
        },
      });

      console.log(`  ✅ Package upserted: ${packageRecord.id}`);

      // Upsert the tool
      const tool = await prisma.tool.upsert({
        where: {
          packageId_name: {
            packageId: packageRecord.id,
            name: manualTool.name,
          },
        },
        create: {
          packageId: packageRecord.id,
          name: manualTool.name,
          description: manualTool.description,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          parameters: manualTool.parameters ? (manualTool.parameters as any) : null,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          returns: manualTool.returns ? (manualTool.returns as any) : null,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          aiAgent: manualTool.aiAgent ? (manualTool.aiAgent as any) : null,
          toolDiscoverySource: 'manual',
          isActive: true,
          lastSeenVersion: version,
          retiredAt: null,
        },
        update: {
          description: manualTool.description,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          parameters: manualTool.parameters ? (manualTool.parameters as any) : null,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          returns: manualTool.returns ? (manualTool.returns as any) : null,
          // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
          aiAgent: manualTool.aiAgent ? (manualTool.aiAgent as any) : null,
          toolDiscoverySource: 'manual',
          isActive: true,
          lastSeenVersion: version,
          retiredAt: null,
        },
      });

      console.log(`  ✅ Tool upserted: ${tool.name} (${tool.id})`);

      // Try to extract schema from the production executor first
      const schemaResult = await extractToolSchema(
        manualTool.npmPackageName,
        manualTool.name,
        version
      );

      if (schemaResult.success) {
        await prisma.tool.update({
          where: { id: tool.id },
          data: {
            // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
            inputSchema: schemaResult.inputSchema as any,
            // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
            parameters: convertJsonSchemaToParameters(schemaResult.inputSchema) as any,
            schemaSource: 'extracted',
            schemaExtractedAt: new Date(),
            // Update description if not provided manually
            ...(!manualTool.description && schemaResult.description
              ? { description: schemaResult.description }
              : {}),
          },
        });
        console.log(`  ✅ Schema extracted for ${manualTool.name}`);
      } else if (manualTool.parameters && manualTool.parameters.length > 0) {
        // Fallback: Convert parameters from scripts/manual-tools.ts to inputSchema format
        const inputSchema = convertParametersToJsonSchema(manualTool.parameters);
        await prisma.tool.update({
          where: { id: tool.id },
          data: {
            // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility
            inputSchema: inputSchema as any,
            schemaSource: 'author',
            schemaExtractedAt: new Date(),
          },
        });
        console.log(`  ✅ Schema generated from parameters for ${manualTool.name}`);
      } else {
        console.log(`  ⚠️  No schema available for ${manualTool.name}`);
      }

      processed++;
    } catch (error) {
      console.error(
        `  ❌ Error processing ${manualTool.npmPackageName} (${manualTool.name}):`,
        error
      );
      errors++;
    }
  }

  console.log('\n📊 Manual sync complete!');
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total manual tools: ${manualTools.length}\n`);

  return { processed, skipped, errors };
}

function calculateTier(tool: (typeof manualTools)[0]): 'minimal' | 'rich' {
  // Tier is 'rich' if tool has parameters OR returns OR aiAgent
  if (tool.parameters || tool.returns || tool.aiAgent) {
    return 'rich';
  }
  return 'minimal';
}

async function main(): Promise<void> {
  try {
    const result = await syncManualTools();
    if (result.errors > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
