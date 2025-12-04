import { tool, jsonSchema } from 'ai';

// Cache for tool wrappers (process-level)
const moduleCache = new Map<string, any>();

// Cache for per-conversation active tools
const conversationTools = new Map<string, Set<string>>();

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
 * Dynamically load a tool via Railway service
 * Railway service runs with --experimental-network-imports and can import from esm.sh
 */
// biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex
export async function loadToolDynamically(
  packageName: string,
  exportName: string,
  version: string,
  importUrl?: string,
  env?: Record<string, string>
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
      return null;
    }

    const data = await response.json();

    if (!data.success) {
      console.error(`❌ Failed to load tool: ${data.error}`);
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

        const execResponse = await fetch(`${RAILWAY_SERVICE_URL}/execute-tool`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageName,
            exportName,
            version,
            importUrl: importUrl || `https://esm.sh/${packageName}@${version}`,
            params,
            env: env || {},
          }),
        });

        const result = await execResponse.json();

        if (!result.success) {
          console.error(`❌ Tool execution failed: ${result.error}`);
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
    console.error(`   Stack:`, error instanceof Error ? error.stack : 'No stack trace');
    return null;
  }
}

/**
 * Load multiple tools in parallel
 */
// biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex
export async function loadToolsBatch(
  toolMetadata: Array<{
    packageName: string;
    exportName: string;
    version: string;
    importUrl?: string;
  }>,
  env?: Record<string, string>
): Promise<Record<string, any>> {
  const promises = toolMetadata.map((meta) =>
    loadToolDynamically(meta.packageName, meta.exportName, meta.version, meta.importUrl, env).then(
      (tool) => ({
        key: getCacheKey(meta.packageName, meta.exportName),
        tool,
      })
    )
  );

  const results = await Promise.all(promises);

  // biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex
  const tools: Record<string, any> = {};
  for (const { key, tool } of results) {
    if (tool) {
      tools[key] = tool;
    }
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
  const tools = conversationTools.get(conversationId)!;
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
