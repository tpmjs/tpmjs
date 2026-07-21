import { jsonSchema, type Tool, tool } from 'ai';
import { z } from 'zod';

// Cache for tool wrappers (process-level)
type RuntimeTool = Tool;
type RuntimeToolSet = Record<string, RuntimeTool>;

const moduleCache = new Map<string, Map<string, RuntimeTool>>();

// Cache for per-conversation active tools
const conversationTools = new Map<string, Set<string>>();

// Cache for per-conversation env vars (updated on each request)
const conversationEnv = new Map<string, Record<string, string>>();

// Railway service URL
const RAILWAY_SERVICE_URL =
  process.env.RAILWAY_SERVICE_URL || process.env.SANDBOX_EXECUTOR_URL || 'http://localhost:3001';

const LoadToolResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    tool: z.object({
      description: z.string(),
      inputSchema: z.unknown().optional(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.string().optional(),
  }),
]);

const ExecuteToolResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    output: z.unknown(),
    executionTimeMs: z.number().optional(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string().optional(),
  }),
]);

/**
 * Generate the stable logical key used to expose a tool to the model.
 */
function getToolKey(packageName: string, name: string): string {
  return `${packageName}::${name}`;
}

/**
 * Generate the exact artifact key used by the executable-wrapper cache.
 * A package update or alternate import URL must create a fresh wrapper.
 */
function getCacheKey(
  packageName: string,
  name: string,
  version: string,
  importUrl: string | undefined
): string {
  return JSON.stringify([packageName, name, version, importUrl ?? null]);
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

interface RemoteToolDescription {
  description: string;
  inputSchema?: unknown;
}

async function fetchToolDescription(
  packageName: string,
  name: string,
  version: string,
  importUrl: string | undefined,
  env: Record<string, string>
): Promise<RemoteToolDescription> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch(`${RAILWAY_SERVICE_URL}/load-and-describe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName,
        name,
        version,
        importUrl: importUrl || `https://esm.sh/${packageName}@${version}`,
        env,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Railway returned HTTP ${response.status}: ${errorText}`);
    }

    const rawData: unknown = await response.json();
    const parsedData = LoadToolResponseSchema.safeParse(rawData);
    if (!parsedData.success) {
      throw new Error('Railway returned a malformed tool description');
    }
    if (!parsedData.data.success) {
      throw new Error(parsedData.data.error || 'Railway could not load the tool');
    }
    return parsedData.data.tool;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Railway request timed out after 120s for ${packageName}/${name}`, {
        cause: error,
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function executeRemoteTool(
  packageName: string,
  name: string,
  version: string,
  importUrl: string | undefined,
  conversationId: string,
  params: unknown
): Promise<unknown> {
  const currentEnv = getConversationEnv(conversationId);
  console.log(`🔐 Using ${Object.keys(currentEnv).length} env vars for ${conversationId}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch(`${RAILWAY_SERVICE_URL}/execute-tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName,
        name,
        version,
        importUrl: importUrl || `https://esm.sh/${packageName}@${version}`,
        params,
        env: currentEnv,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Tool executor returned HTTP ${response.status}`);
    }

    const rawResult: unknown = await response.json();
    const parsedResult = ExecuteToolResponseSchema.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error('Tool executor returned a malformed response');
    }
    if (!parsedResult.data.success) {
      throw new Error(parsedResult.data.error || 'Tool execution failed');
    }

    console.log(
      `✅ Tool executed successfully in ${parsedResult.data.executionTimeMs ?? 'unknown'}ms`
    );
    return parsedResult.data.output;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Tool execution timed out after 120s for ${packageName}/${name}`, {
        cause: error,
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Dynamically load a tool via Railway service
 * Railway service runs with --experimental-network-imports and can import from esm.sh
 */
export async function loadToolDynamically(
  packageName: string,
  name: string,
  version: string,
  conversationId: string,
  importUrl?: string,
  env?: Record<string, string>
): Promise<RuntimeTool | null> {
  const toolKey = getToolKey(packageName, name);
  const cacheKey = getCacheKey(packageName, name, version, importUrl);
  let toolCache = moduleCache.get(conversationId);
  if (!toolCache) {
    toolCache = new Map();
    moduleCache.set(conversationId, toolCache);
  }

  // Tool wrappers close over a conversation ID, so they must never be shared
  // across conversations (which would route one conversation through another's env).
  const cachedTool = toolCache.get(cacheKey);
  if (cachedTool) {
    console.log(`✅ Cache hit: ${toolKey}@${version}`);
    return cachedTool;
  }

  try {
    console.log(`📦 Loading from Railway: ${packageName}/${name}`);
    console.log(`🔗 Railway URL: ${RAILWAY_SERVICE_URL}`);

    const description = await fetchToolDescription(
      packageName,
      name,
      version,
      importUrl,
      env || {}
    );
    console.log(`✅ Tool loaded from Railway: ${toolKey}@${version}`);
    console.log(`📋 Description: ${description.description}`);

    const toolWrapper = tool({
      description: description.description,
      inputSchema: description.inputSchema
        ? jsonSchema(description.inputSchema)
        : jsonSchema({ type: 'object', properties: {}, additionalProperties: false }),
      execute: async (params: unknown) => {
        console.log(`🚀 Executing ${packageName}/${name} remotely with params:`, params);
        return executeRemoteTool(packageName, name, version, importUrl, conversationId, params);
      },
    });

    toolCache.set(cacheKey, toolWrapper);
    console.log(`✅ Cached tool wrapper: ${toolKey}@${version}`);
    return toolWrapper;
  } catch (error) {
    console.error(`❌ Failed to load ${packageName}#${name}:`, error);
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
    name: string;
    version: string;
    importUrl?: string;
  }>,
  conversationId: string,
  env?: Record<string, string>
): Promise<RuntimeToolSet> {
  console.log(`📦 Loading ${toolMetadata.length} tools for conversation ${conversationId}`);
  console.log('🔑 Env vars being passed:', Object.keys(env || {}));

  const promises = toolMetadata.map((meta) =>
    loadToolDynamically(
      meta.packageName,
      meta.name,
      meta.version,
      conversationId,
      meta.importUrl,
      env
    ).then((tool) => ({
      packageName: meta.packageName,
      name: meta.name,
      key: getToolKey(meta.packageName, meta.name),
      tool,
      success: tool !== null,
    }))
  );

  const results = await Promise.all(promises);

  // Separate successful and failed tools
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  // Build tools object
  const tools: RuntimeToolSet = {};
  for (const result of successful) {
    if (!result.tool) continue;
    tools[result.key] = result.tool;
  }

  // Log collated error summary
  console.log('\n📊 Batch Load Summary:');
  console.log(`   ✅ Successful: ${successful.length}/${toolMetadata.length}`);
  console.log(`   ❌ Failed: ${failed.length}/${toolMetadata.length}`);

  if (failed.length > 0) {
    console.log('\n❌ Failed Tools:');
    for (const result of failed) {
      console.log(`   - ${result.packageName}/${result.name}`);
    }
    console.log('\n💡 Note: Tool failures have been reported to the health service.');
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
  conversationEnv.delete(conversationId);
  moduleCache.delete(conversationId);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    moduleCacheSize: Array.from(moduleCache.values()).reduce(
      (toolCount, cache) => toolCount + cache.size,
      0
    ),
    conversationCount: conversationTools.size,
  };
}
