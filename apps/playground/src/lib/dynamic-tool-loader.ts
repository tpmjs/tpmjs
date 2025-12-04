import { jsonSchema, tool } from 'ai';

// Cache for tool wrappers (process-level)
// biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex
const moduleCache = new Map<string, any>();

// Cache for per-conversation active tools
const conversationTools = new Map<string, Set<string>>();

// Cache for per-conversation env vars (updated on each request)
const conversationEnv = new Map<string, Record<string, string>>();

// Railway service URL
const RAILWAY_SERVICE_URL =
  process.env.RAILWAY_SERVICE_URL || process.env.SANDBOX_EXECUTOR_URL || 'http://localhost:3001';

/**
 * Generate cache key for a tool
 */
function getCacheKey(packageName: string, exportName: string): string {
  return `${packageName}::${exportName}`;
}

/**
 * Set environment variables for a conversation
 * This allows tools to access the latest env vars even when cached
 */
export function setConversationEnv(conversationId: string, env: Record<string, string>): void {
  console.log(`🔑 Setting env for conversation ${conversationId}:`, Object.keys(env));
  conversationEnv.set(conversationId, env);
}

/**
 * Get environment variables for a conversation
 */
function getConversationEnv(conversationId: string): Record<string, string> {
  return conversationEnv.get(conversationId) || {};
}

/**
 * Report tool failure and trigger async health check
 * Non-blocking - logs error and triggers health check in background
 */
async function reportToolFailure(
  packageName: string,
  exportName: string,
  error: string,
  phase: 'import' | 'execution'
): Promise<void> {
  try {
    // Lazy load Prisma to avoid module initialization failures
    const { prisma } = await import('@tpmjs/db');

    // Find the tool in the database
    const tool = await prisma.tool.findFirst({
      where: {
        exportName,
        package: {
          npmPackageName: packageName,
        },
      },
      select: { id: true },
    });

    if (!tool) {
      console.warn(`⚠️  Tool not found in database for health check: ${packageName}/${exportName}`);
      return;
    }

    console.log(`🏥 Triggering health check for ${packageName}/${exportName} (${tool.id})`);

    // Update health status immediately (optimistic)
    await prisma.tool.update({
      where: { id: tool.id },
      data: {
        [phase === 'import' ? 'importHealth' : 'executionHealth']: 'BROKEN',
        healthCheckError: error,
        lastHealthCheck: new Date(),
      },
    });

    console.log(`✅ Health status updated for ${packageName}/${exportName}`);
  } catch (err) {
    console.error('❌ Failed to report tool failure:', err);
  }
}

/**
 * Dynamically load a tool via Railway service
 * Railway service runs with --experimental-network-imports and can import from esm.sh
 */
export async function loadToolDynamically(
  packageName: string,
  exportName: string,
  version: string,
  conversationId: string,
  importUrl?: string,
  env?: Record<string, string>
  // biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex
): Promise<any | null> {
  const cacheKey = getCacheKey(packageName, exportName);

  // Check cache first
  if (moduleCache.has(cacheKey)) {
    console.log(`✅ Cache hit: ${cacheKey}`);
    return moduleCache.get(cacheKey);
  }

  try {
    console.log(`📦 Loading from Railway: ${packageName}/${exportName}`);
    console.log(`🔗 Railway URL: ${RAILWAY_SERVICE_URL}`);

    // Call Railway service to load and describe tool
    const response = await fetch(`${RAILWAY_SERVICE_URL}/load-and-describe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName,
        exportName,
        version,
        importUrl: importUrl || `https://esm.sh/${packageName}@${version}`,
        env: env || {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Railway service error (${response.status}): ${errorText}`);

      // Trigger health check update in background (non-blocking)
      reportToolFailure(
        packageName,
        exportName,
        `Railway service error (${response.status}): ${errorText}`,
        'import'
      ).catch((err) =>
        console.error(`Failed to report tool failure for ${packageName}/${exportName}:`, err)
      );

      return null;
    }

    const data = await response.json();

    if (!data.success) {
      console.error(`❌ Failed to load tool: ${data.error}`);

      // Trigger health check update in background (non-blocking)
      reportToolFailure(packageName, exportName, data.error || 'Unknown error', 'import').catch(
        (err) =>
          console.error(`Failed to report tool failure for ${packageName}/${exportName}:`, err)
      );

      return null;
    }

    console.log(`✅ Tool loaded from Railway: ${cacheKey}`);
    console.log(`📋 Description: ${data.tool.description}`);

    // Create a proper AI SDK tool wrapper that executes remotely
    // Railway returns plain JSON Schema - wrap it with jsonSchema() for AI SDK
    const toolWrapper = tool({
      description: data.tool.description,
      inputSchema: data.tool.inputSchema
        ? jsonSchema(data.tool.inputSchema)
        : jsonSchema({ type: 'object', properties: {}, additionalProperties: false }),
      // biome-ignore lint/suspicious/noExplicitAny: Tool params are dynamic
      execute: async (params: any) => {
        console.log(`🚀 Executing ${packageName}/${exportName} remotely with params:`, params);

        // Get the latest env vars for this conversation (not from closure!)
        const currentEnv = getConversationEnv(conversationId);
        console.log(
          `🔐 Using env vars for conversation ${conversationId}:`,
          Object.keys(currentEnv)
        );

        const execResponse = await fetch(`${RAILWAY_SERVICE_URL}/execute-tool`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageName,
            exportName,
            version,
            importUrl: importUrl || `https://esm.sh/${packageName}@${version}`,
            params,
            env: currentEnv,
          }),
        });

        const result = await execResponse.json();

        if (!result.success) {
          console.error(`❌ Tool execution failed: ${result.error}`);

          // Trigger health check update in background (non-blocking)
          reportToolFailure(
            packageName,
            exportName,
            result.error || 'Tool execution failed',
            'execution'
          ).catch((err) =>
            console.error(`Failed to report tool failure for ${packageName}/${exportName}:`, err)
          );

          throw new Error(result.error || 'Tool execution failed');
        }

        console.log(`✅ Tool executed successfully in ${result.executionTimeMs}ms`);
        return result.output;
      },
    });

    // Cache the wrapper
    moduleCache.set(cacheKey, toolWrapper);
    console.log(`✅ Cached tool wrapper: ${cacheKey}`);

    return toolWrapper;
  } catch (error) {
    console.error(`❌ Failed to load ${packageName}#${exportName}:`, error);
    console.error('   Stack:', error instanceof Error ? error.stack : 'No stack trace');
    return null;
  }
}

/**
 * Load multiple tools in parallel with collated error reporting
 */
export async function loadToolsBatch(
  toolMetadata: Array<{
    packageName: string;
    exportName: string;
    version: string;
    importUrl?: string;
  }>,
  conversationId: string,
  env?: Record<string, string>
  // biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex
): Promise<Record<string, any>> {
  console.log(`📦 Loading ${toolMetadata.length} tools for conversation ${conversationId}`);
  console.log('🔑 Env vars being passed:', Object.keys(env || {}));

  const promises = toolMetadata.map((meta) =>
    loadToolDynamically(
      meta.packageName,
      meta.exportName,
      meta.version,
      conversationId,
      meta.importUrl,
      env
    ).then((tool) => ({
      packageName: meta.packageName,
      exportName: meta.exportName,
      key: getCacheKey(meta.packageName, meta.exportName),
      tool,
      success: tool !== null,
    }))
  );

  const results = await Promise.all(promises);

  // Separate successful and failed tools
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  // Build tools object
  // biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex
  const tools: Record<string, any> = {};
  for (const result of successful) {
    tools[result.key] = result.tool;
  }

  // Log collated error summary
  console.log('\n📊 Batch Load Summary:');
  console.log(`   ✅ Successful: ${successful.length}/${toolMetadata.length}`);
  console.log(`   ❌ Failed: ${failed.length}/${toolMetadata.length}`);

  if (failed.length > 0) {
    console.log('\n❌ Failed Tools:');
    for (const result of failed) {
      console.log(`   - ${result.packageName}/${result.exportName}`);
      console.log('     (Health check triggered automatically)');
    }
    console.log('\n💡 Note: Failed tools have been marked as broken in the database.');
    console.log('   Check individual error logs above for detailed failure reasons.');
  }

  return tools;
}

/**
 * Track tools for a conversation
 */
export function addConversationTools(conversationId: string, toolKeys: string[]): void {
  if (!conversationTools.has(conversationId)) {
    conversationTools.set(conversationId, new Set());
  }
  const tools = conversationTools.get(conversationId);
  if (!tools) return; // Should never happen after the check above
  for (const key of toolKeys) {
    tools.add(key);
  }
}

/**
 * Get all tools for a conversation
 */
export function getConversationTools(conversationId: string): string[] {
  return Array.from(conversationTools.get(conversationId) || []);
}

/**
 * Clear conversation tools (on session end)
 */
export function clearConversationTools(conversationId: string): void {
  conversationTools.delete(conversationId);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    moduleCacheSize: moduleCache.size,
    conversationCount: conversationTools.size,
  };
}
