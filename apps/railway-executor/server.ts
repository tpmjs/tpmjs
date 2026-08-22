/**
 * TPMJS Dynamic Tool Executor (Deno)
 * Uses Deno's native HTTP import support
 */

// Build-time dependencies are registry-pinned in package.json and integrity-locked
// in deno.lock. Runtime tool packages remain dynamic by design.
import * as zodV4 from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

type ExecutorErrorStage = 'request' | 'load' | 'execute' | 'executor';
type ExecutorErrorCode =
  | 'INVALID_REQUEST'
  | 'AUTHENTICATION_REQUIRED'
  | 'PACKAGE_IMPORT_FAILED'
  | 'TOOL_NOT_FOUND'
  | 'TOOL_CONFIGURATION_REQUIRED'
  | 'INVALID_TOOL'
  | 'SCHEMA_UNAVAILABLE'
  | 'TOOL_EXECUTION_FAILED'
  | 'EXECUTOR_UNAVAILABLE'
  | 'EXECUTION_TIMEOUT'
  | 'EXECUTOR_INTERNAL_ERROR';

interface ExecutorFailure {
  error: string;
  errorStage: ExecutorErrorStage;
  errorCode: ExecutorErrorCode;
  retryable: boolean;
}

// biome-ignore lint/suspicious/noExplicitAny: Third-party module namespace values are runtime-defined.
type DynamicModule = Record<string, any>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function failureResponse(
  failure: ExecutorFailure,
  options: {
    status?: number;
    executionTimeMs?: number;
    extra?: Record<string, unknown>;
  } = {}
): Response {
  return Response.json(
    {
      success: false,
      ...(options.extra || {}),
      ...failure,
      ...(options.executionTimeMs === undefined
        ? {}
        : { executionTimeMs: options.executionTimeMs }),
    },
    { status: options.status ?? 500 }
  );
}

// ─── Crash Protection ───────────────────────────────────────────────────────
// Catch unhandled promise rejections so they don't crash the process
globalThis.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  console.error('⚠️  Unhandled promise rejection (caught, process continues):', event.reason);
});

// Catch uncaught errors
globalThis.addEventListener('error', (event) => {
  console.error('⚠️  Uncaught error (caught, process continues):', event.error || event.message);
  event.preventDefault();
});

// ─── Auth ────────────────────────────────────────────────────────────────────
// Every endpoint except GET /health requires `Authorization: Bearer
// <EXECUTOR_API_KEY>`. Auth is fail-closed: if the key is unset, all requests
// are refused — a missing env var must never expose arbitrary code execution.
// For local development only, set EXECUTOR_ALLOW_UNAUTHENTICATED=true to run
// without a key. Same contract as the agent-sandbox server.
const EXECUTOR_API_KEY = Deno.env.get('EXECUTOR_API_KEY');
const ALLOW_UNAUTHENTICATED = Deno.env.get('EXECUTOR_ALLOW_UNAUTHENTICATED') === 'true';

function checkAuth(req: Request): boolean {
  if (!EXECUTOR_API_KEY) return ALLOW_UNAUTHENTICATED;
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === EXECUTOR_API_KEY;
}

/**
 * Import a tool package module. Primary path is esm.sh (CDN-cached); if the
 * esm.sh build fails (packages with native/Node-only deps that its denonext
 * transform can't handle — bindings, ssh2, node:sqlite, canvas…), fall back to
 * Deno-native npm: resolution, which handles optional native deps correctly.
 */
async function importToolModule(
  packageName: string,
  version: string,
  importUrl?: string
): Promise<DynamicModule> {
  if (importUrl) {
    console.log(`📦 Importing (explicit): ${importUrl}`);
    return await import(importUrl);
  }
  const esmUrl = `https://esm.sh/${packageName}@${version}`;
  try {
    console.log(`📦 Importing: ${esmUrl}`);
    return await import(esmUrl);
  } catch (esmError) {
    const npmSpecifier = `npm:${packageName}@${version}`;
    const message = esmError instanceof Error ? esmError.message : String(esmError);
    console.log(`↩️  esm.sh import failed (${message}); retrying via ${npmSpecifier}`);
    return await import(npmSpecifier);
  }
}

// Cache TTL: 2 minutes
const CACHE_TTL_MS = 2 * 60 * 1000;

// Max cache entries to prevent unbounded memory growth
const MAX_CACHE_SIZE = 200;

// Cache entry with expiration
interface CacheEntry {
  // biome-ignore lint/suspicious/noExplicitAny: Tool types are dynamic and vary by package
  module: any;
  expiresAt: number;
  isFactory: boolean;
}

// Cache for imported tool modules with TTL
const moduleCache = new Map<string, CacheEntry>();

/**
 * Get module from cache if not expired
 */
function getCachedModule(cacheKey: string): CacheEntry | null {
  const entry = moduleCache.get(cacheKey);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    moduleCache.delete(cacheKey);
    console.log(`🗑️  Cache expired: ${cacheKey}`);
    return null;
  }

  return entry;
}

/**
 * Store module in cache with TTL
 */
// biome-ignore lint/suspicious/noExplicitAny: Tool types are dynamic and vary by package
function setCachedModule(cacheKey: string, module: any, isFactory: boolean): void {
  // Evict oldest entries if cache is full
  if (moduleCache.size >= MAX_CACHE_SIZE) {
    const entriesToEvict = Math.max(1, Math.floor(MAX_CACHE_SIZE * 0.2)); // Evict 20%
    const keys = Array.from(moduleCache.keys());
    for (let i = 0; i < entriesToEvict && i < keys.length; i++) {
      moduleCache.delete(keys[i]);
    }
    console.log(`🗑️  Evicted ${entriesToEvict} cache entries (cache was full at ${MAX_CACHE_SIZE})`);
  }

  moduleCache.set(cacheKey, {
    module,
    expiresAt: Date.now() + CACHE_TTL_MS,
    isFactory,
  });
  console.log(`📦 Cached (TTL ${CACHE_TTL_MS / 1000}s): ${cacheKey}`);
}

/**
 * Cleanup expired cache entries
 */
function cleanupExpiredCache(): void {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, entry] of moduleCache.entries()) {
    if (now > entry.expiresAt) {
      moduleCache.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🗑️  Cleaned ${cleaned} expired cache entries`);
  }
}

// Run cache cleanup every minute
setInterval(cleanupExpiredCache, 60 * 1000);

// Web app API URL for health status reporting
const TPMJS_API_URL = Deno.env.get('TPMJS_API_URL') || 'https://tpmjs.com';

/**
 * Report tool execution result to centralized health service
 * Non-blocking - fires and forgets to avoid slowing down execution
 */
async function reportToolHealth(
  packageName: string,
  name: string,
  success: boolean,
  failure?: ExecutorFailure
): Promise<void> {
  try {
    const response = await fetch(`${TPMJS_API_URL}/api/tools/report-health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName,
        name,
        success,
        ...(failure || {}),
      }),
    });

    if (response.ok) {
      console.log(
        `📊 Health reported for ${packageName}/${name}: ${success ? 'SUCCESS' : 'FAILURE'}`
      );
    } else {
      console.warn(`⚠️  Failed to report health: ${response.status}`);
    }
  } catch (err) {
    // Non-blocking - just log
    console.error('❌ Failed to report tool health:', err);
  }
}

/**
 * Update tool schema in TPM.js database
 * Non-blocking - fires and forgets to keep schemas up to date
 */
async function updateToolSchema(
  packageName: string,
  name: string,
  description: string,
  // biome-ignore lint/suspicious/noExplicitAny: JSON Schema can have any structure
  inputSchema: any
): Promise<void> {
  try {
    const response = await fetch(`${TPMJS_API_URL}/api/tools/update-schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName,
        name,
        description,
        inputSchema,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(
        `📋 Schema updated for ${packageName}/${name}:`,
        data.updated ? 'UPDATED' : 'NO CHANGE'
      );
    } else {
      const errorText = await response.text();
      console.warn(`⚠️  Failed to update schema: ${response.status}`, errorText);
    }
  } catch (err) {
    // Non-blocking - just log
    console.error('❌ Failed to update tool schema:', err);
  }
}

/**
 * Sanitize JSON Schema to fix common issues
 * - Replaces invalid type "None" with "object"
 * - Ensures type is always set
 * - Ensures object schemas have properties
 */
// biome-ignore lint/suspicious/noExplicitAny: JSON Schema can have any structure
function sanitizeJsonSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    console.warn('⚠️  Invalid schema (not an object), returning default object schema');
    return { type: 'object', properties: {}, additionalProperties: false };
  }

  // Clone the schema to avoid mutating the original
  const sanitized = { ...schema };

  // Fix invalid type "None" (common in Python-based tools)
  if (sanitized.type === 'None' || sanitized.type === 'none' || sanitized.type === null) {
    console.warn(`⚠️  Invalid schema type "${sanitized.type}", replacing with "object"`);
    sanitized.type = 'object';
    if (!sanitized.properties) {
      sanitized.properties = {};
    }
    if (sanitized.additionalProperties === undefined) {
      sanitized.additionalProperties = false;
    }
  }

  // Ensure type is set
  if (!sanitized.type) {
    console.warn('⚠️  Schema missing type, defaulting to "object"');
    sanitized.type = 'object';
    if (!sanitized.properties) {
      sanitized.properties = {};
    }
    if (sanitized.additionalProperties === undefined) {
      sanitized.additionalProperties = false;
    }
  }

  // Recursively sanitize nested schemas
  if (sanitized.properties && typeof sanitized.properties === 'object') {
    for (const [key, value] of Object.entries(sanitized.properties)) {
      if (value && typeof value === 'object') {
        sanitized.properties[key] = sanitizeJsonSchema(value);
      }
    }
  }

  // Sanitize array items
  if (sanitized.items && typeof sanitized.items === 'object') {
    sanitized.items = sanitizeJsonSchema(sanitized.items);
  }

  // Sanitize anyOf/oneOf/allOf
  for (const key of ['anyOf', 'oneOf', 'allOf']) {
    if (Array.isArray(sanitized[key])) {
      // biome-ignore lint/suspicious/noExplicitAny: JSON Schema types are dynamic
      sanitized[key] = sanitized[key].map((s: any) => sanitizeJsonSchema(s));
    }
  }

  return sanitized;
}

/**
 * Load and describe a tool from esm.sh
 */
async function loadAndDescribe(req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch (error) {
    return failureResponse(
      {
        error: `Request body must be valid JSON: ${errorMessage(error)}`,
        errorStage: 'request',
        errorCode: 'INVALID_REQUEST',
        retryable: false,
      },
      { status: 400 }
    );
  }

  try {
    const { packageName, name, version, importUrl, env } = body;

    if (
      typeof packageName !== 'string' ||
      typeof name !== 'string' ||
      typeof version !== 'string'
    ) {
      return failureResponse(
        {
          error: 'Missing required fields: packageName, name, version',
          errorStage: 'request',
          errorCode: 'INVALID_REQUEST',
          retryable: false,
        },
        { status: 400 }
      );
    }

    // Version-scoped: a re-synced package must never be served from the previous version's module.
    const cacheKey = `${packageName}@${version}::${name}`;

    // biome-ignore lint/suspicious/noImplicitAnyLet: Tool type is determined dynamically after import
    let toolModule;

    // Check cache first (with TTL)
    const cachedEntry = getCachedModule(cacheKey);
    if (cachedEntry) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      toolModule = cachedEntry.module;
    } else {
      // Dynamic import: esm.sh with npm: fallback (Deno supports both natively)
      const module = await importToolModule(
        packageName,
        version,
        typeof importUrl === 'string' ? importUrl : undefined
      );
      let rawExport = module[name];

      if (!rawExport) {
        console.error(`❌ Export "${name}" not found. Available:`, Object.keys(module));
        return failureResponse(
          {
            error: `Export "${name}" not found in module`,
            errorStage: 'load',
            errorCode: 'TOOL_NOT_FOUND',
            retryable: false,
          },
          { status: 404, extra: { availableExports: Object.keys(module) } }
        );
      }

      // Check if it's a factory function (not a direct tool)
      if (typeof rawExport === 'function' && !rawExport.description && !rawExport.execute) {
        console.log(`🏭 Detected factory function for ${cacheKey}, attempting to call...`);

        let factoryResult = null;

        // Strategy 1: Try calling with no arguments
        try {
          console.log(`  Trying: ${name}()`);
          factoryResult = rawExport();
          if (factoryResult?.description && factoryResult?.execute) {
            console.log('  ✅ Success with no-args factory');
            rawExport = factoryResult;
          }
        } catch (error) {
          console.log('  ❌ No-args failed:', errorMessage(error));
        }

        // Strategy 2: Try calling with env vars as config object
        if (!factoryResult && env && typeof env === 'object') {
          // Build multiple config variations to try
          const configVariations = [];

          // Variation 1: Raw env vars (e.g., { VALYU_API_KEY: 'xxx' })
          configVariations.push({ ...env });

          // Variation 2: Normalized to camelCase apiKey (e.g., { apiKey: 'xxx' })
          const apiKeyValue = Object.entries(env).find(([key]) =>
            key.toUpperCase().includes('API_KEY')
          )?.[1];
          if (apiKeyValue) {
            configVariations.push({ apiKey: apiKeyValue });
          }

          // Variation 3: Normalized to key (e.g., { key: 'xxx' })
          if (apiKeyValue) {
            configVariations.push({ key: apiKeyValue });
          }

          // Try each config variation
          for (const config of configVariations) {
            try {
              console.log(`  Trying: ${name}(`, Object.keys(config), ')');
              factoryResult = rawExport(config);
              if (factoryResult?.description && factoryResult?.execute) {
                console.log('  ✅ Success with config:', Object.keys(config));
                rawExport = factoryResult;
                break;
              }
            } catch (error) {
              console.log('  ❌ Config', Object.keys(config), 'failed:', errorMessage(error));
            }
          }
        }

        // Strategy 3: Try calling with first env var value (single-arg pattern)
        if (!factoryResult && env && typeof env === 'object') {
          try {
            const firstValue = Object.values(env)[0];
            if (firstValue) {
              console.log(`  Trying: ${name}(firstEnvValue)`);
              factoryResult = rawExport(firstValue);
              if (factoryResult?.description && factoryResult?.execute) {
                console.log('  ✅ Success with single-arg factory');
                rawExport = factoryResult;
              }
            }
          } catch (error) {
            console.log('  ❌ Single-arg failed:', errorMessage(error));
          }
        }

        // If all factory strategies failed, return error
        if (!factoryResult) {
          console.error('❌ Factory function detected but all call strategies failed');
          return failureResponse(
            {
              error: `Tool "${name}" is a factory function but couldn't be initialized. Tried: no-args, config object, and single-arg patterns.`,
              errorStage: 'load',
              errorCode: 'TOOL_CONFIGURATION_REQUIRED',
              retryable: false,
            },
            {
              status: 400,
              extra: {
                hint: 'This tool may require specific configuration. Check package documentation.',
              },
            }
          );
        }
      }

      toolModule = rawExport;

      // Validate it's an AI SDK tool
      if (!toolModule.description || !toolModule.execute) {
        console.error('❌ Invalid AI SDK tool structure:', {
          hasDescription: !!toolModule.description,
          hasExecute: !!toolModule.execute,
          hasInputSchema: !!toolModule.inputSchema,
          keys: Object.keys(toolModule),
        });
        return failureResponse(
          {
            error: 'Invalid AI SDK tool structure (missing description or execute)',
            errorStage: 'load',
            errorCode: 'INVALID_TOOL',
            retryable: false,
          },
          { status: 400, extra: { toolKeys: Object.keys(toolModule) } }
        );
      }

      // Cache it with TTL (mark as non-factory for loadAndDescribe)
      setCachedModule(cacheKey, toolModule, false);
    }

    // Extract tool definition - try multiple schema formats
    let rawJsonSchema = null;

    if (toolModule.inputSchema) {
      // Strategy 1: Try Zod v4 native JSON Schema export
      if (typeof toolModule.inputSchema.toJSONSchema === 'function') {
        console.log(`📋 Using Zod v4 toJSONSchema() for ${cacheKey}`);
        try {
          rawJsonSchema = toolModule.inputSchema.toJSONSchema();
        } catch (error) {
          console.warn(`⚠️  Zod toJSONSchema() failed for ${cacheKey}:`, error);
        }
      } else if (typeof toolModule.inputSchema.jsonSchema === 'function') {
        console.log(`📋 Using Zod v4 jsonSchema() for ${cacheKey}`);
        try {
          rawJsonSchema = toolModule.inputSchema.jsonSchema();
        } catch (error) {
          console.warn(`⚠️  Zod jsonSchema() failed for ${cacheKey}:`, error);
        }
      }

      // Strategy 2: Try AI SDK v6 jsonSchema() wrapper (has .schema property)
      if (!rawJsonSchema && toolModule.inputSchema.schema) {
        console.log(`📋 Using AI SDK jsonSchema.schema for ${cacheKey}`);
        rawJsonSchema = toolModule.inputSchema.schema;
      }

      // Strategy 2.5: Try AI SDK jsonSchema() wrapper (has .jsonSchema property)
      // Note: Some versions use .jsonSchema instead of .schema
      if (
        !rawJsonSchema &&
        toolModule.inputSchema.jsonSchema &&
        typeof toolModule.inputSchema.jsonSchema === 'object'
      ) {
        console.log(`📋 Using AI SDK jsonSchema.jsonSchema for ${cacheKey}`);
        rawJsonSchema = toolModule.inputSchema.jsonSchema;
      }

      // Strategy 3: Try Zod v4 schema (detect via _zod property - new in Zod v4)
      if (!rawJsonSchema && toolModule.inputSchema._zod) {
        console.log(`📋 Detected Zod v4 schema for ${cacheKey}`);
        try {
          if (zodV4.toJSONSchema) {
            rawJsonSchema = zodV4.toJSONSchema(toolModule.inputSchema);
            console.log(
              `✅ Successfully converted Zod v4 schema using z.toJSONSchema for ${cacheKey}`
            );
          } else {
            console.warn(
              '⚠️  Zod v4 toJSONSchema not found. Available exports:',
              Object.keys(zodV4)
            );
          }
        } catch (error) {
          console.warn(`⚠️  Zod v4 toJSONSchema conversion failed for ${cacheKey}:`, error);
        }
      }

      // Strategy 4: Try Zod v3 schema (detect via _def property and convert)
      if (!rawJsonSchema && toolModule.inputSchema._def) {
        console.log(
          `📋 Detected Zod schema (v3), converting with zod-to-json-schema for ${cacheKey}`
        );
        try {
          rawJsonSchema = zodToJsonSchema(toolModule.inputSchema);
          console.log(`✅ Successfully converted Zod schema for ${cacheKey}`);
        } catch (error) {
          console.warn(`⚠️  zod-to-json-schema conversion failed for ${cacheKey}:`, error);
        }
      }
    }

    // If no schema found, fail with helpful error
    if (!rawJsonSchema) {
      console.error(`❌ No valid schema found for ${cacheKey}`, {
        hasInputSchema: !!toolModule.inputSchema,
        inputSchemaType: typeof toolModule.inputSchema,
        hasToJSONSchema: typeof toolModule.inputSchema?.toJSONSchema === 'function',
        hasJsonSchemaFunction: typeof toolModule.inputSchema?.jsonSchema === 'function',
        hasJsonSchemaProperty:
          !!toolModule.inputSchema?.jsonSchema &&
          typeof toolModule.inputSchema?.jsonSchema === 'object',
        hasSchema: !!toolModule.inputSchema?.schema,
        keys: toolModule.inputSchema ? Object.keys(toolModule.inputSchema) : [],
      });
      return failureResponse(
        {
          error: `Tool "${name}" has no valid inputSchema. Tools must use AI SDK jsonSchema(), Zod v4 (._zod), or Zod v3 (._def) schemas.`,
          errorStage: 'load',
          errorCode: 'SCHEMA_UNAVAILABLE',
          retryable: false,
        },
        {
          status: 400,
          extra: {
            debug: {
              hasInputSchema: !!toolModule.inputSchema,
              availableMethods: toolModule.inputSchema ? Object.keys(toolModule.inputSchema) : [],
              hasZodV4: !!toolModule.inputSchema?._zod,
              hasZodV3Def: !!toolModule.inputSchema?._def,
            },
          },
        }
      );
    }

    console.log(`✅ Extracted schema for ${cacheKey}`);

    // Sanitize schema - fix common issues with invalid schemas
    const sanitizedSchema = sanitizeJsonSchema(rawJsonSchema);

    // Update TPM.js database with the schema (async, non-blocking)
    updateToolSchema(packageName, name, toolModule.description, sanitizedSchema).catch((err) => {
      console.warn('⚠️  Failed to update schema in database:', err);
    });

    return Response.json({
      success: true,
      tool: {
        name,
        description: toolModule.description,
        inputSchema: sanitizedSchema, // Plain JSON Schema - fully serializable
      },
    });
  } catch (error) {
    console.error('❌ Failed to load tool:', error);
    return failureResponse(
      {
        error: errorMessage(error),
        errorStage: 'load',
        errorCode: 'PACKAGE_IMPORT_FAILED',
        retryable: true,
      },
      { status: 500 }
    );
  }
}

/**
 * Execute a tool with parameters
 */
async function executeTool(req: Request): Promise<Response> {
  const startTime = Date.now();
  // Declare these before try block so they're available in catch for error reporting
  let packageName = 'unknown';
  let toolName = 'unknown';
  try {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch (error) {
      return failureResponse(
        {
          error: `Request body must be valid JSON: ${errorMessage(error)}`,
          errorStage: 'request',
          errorCode: 'INVALID_REQUEST',
          retryable: false,
        },
        { status: 400, executionTimeMs: Date.now() - startTime }
      );
    }
    const { packageName: pkg, name, version, importUrl, params, env } = body;
    packageName = typeof pkg === 'string' ? pkg : 'unknown';
    toolName = typeof name === 'string' ? name : 'unknown';

    // Never log env VALUES: they are caller credentials (collection env vars / API keys).
    console.log('📥 Execute request:', {
      packageName,
      name: toolName,
      version,
      envKeys: env && typeof env === 'object' ? Object.keys(env) : [],
    });

    if (typeof pkg !== 'string' || typeof name !== 'string' || typeof version !== 'string') {
      return failureResponse(
        {
          error: 'Missing required fields: packageName, name, version',
          errorStage: 'request',
          errorCode: 'INVALID_REQUEST',
          retryable: false,
        },
        { status: 400, executionTimeMs: Date.now() - startTime }
      );
    }

    // Version-scoped: a re-synced package must never be served from the previous version's module.
    const cacheKey = `${packageName}@${version}::${toolName}`;

    // Inject environment variables FIRST - before cache check and factory calls
    // This ensures process.env is set when factory functions read from it.
    // Only flat string/number/boolean maps are accepted: arrays and nested
    // objects (e.g. a package's env-var DESCRIPTOR list [{name, required,…}]
    // sent by mistake) would otherwise inject garbage vars like 0="[object
    // Object]" into the process.
    if (env && typeof env === 'object' && !Array.isArray(env)) {
      const envEntries = Object.entries(env).filter(
        ([, value]) =>
          typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      );
      if (envEntries.length > 0) {
        console.log(
          `🔐 Injecting ${envEntries.length} environment variables:`,
          envEntries.map(([k]) => k)
        );
        for (const [key, value] of envEntries) {
          const stringValue = String(value);

          // Set in Deno environment (for esm.sh imports)
          Deno.env.set(key, stringValue);

          // ALSO set in Node.js process.env (for npm: imports)
          // @ts-expect-error - process is available in Node.js compatibility mode
          if (typeof globalThis.process !== 'undefined' && globalThis.process.env) {
            // @ts-expect-error - process.env exists in Node compat mode
            globalThis.process.env[key] = stringValue;
          }

          console.log(`  ✅ Set ${key} (${stringValue.length} chars)`);
        }
      } else {
        console.log('⚠️  No env vars provided in request');
      }
    } else {
      console.log('⚠️  No env object in request body');
    }

    // biome-ignore lint/suspicious/noImplicitAnyLet: Tool type is determined dynamically after import
    let toolModule;
    let needsImport = true;

    // Check cache first (with TTL) - but skip cache for factory functions
    // since they may read env vars at creation time
    const cachedEntry = getCachedModule(cacheKey);
    if (cachedEntry && !cachedEntry.isFactory) {
      console.log(`✅ Cache hit (non-factory): ${cacheKey}`);
      toolModule = cachedEntry.module;
      needsImport = false;
    } else if (cachedEntry?.isFactory) {
      console.log(`🏭 Cache hit but factory - will re-import: ${cacheKey}`);
    }

    if (needsImport) {
      const module = await importToolModule(
        packageName,
        version,
        typeof importUrl === 'string' ? importUrl : undefined
      );
      let rawExport = module[toolName];

      if (!rawExport) {
        return failureResponse(
          {
            error: 'Tool not found',
            errorStage: 'load',
            errorCode: 'TOOL_NOT_FOUND',
            retryable: false,
          },
          { status: 404, executionTimeMs: Date.now() - startTime }
        );
      }

      // Track if this is a factory function - we won't cache factory-created tools
      // because they may read env vars at creation time
      let isFactoryFunction = false;

      // Check if it's a factory function (not a direct tool)
      if (typeof rawExport === 'function' && !rawExport.description && !rawExport.execute) {
        console.log(`🏭 Detected factory function for ${cacheKey}, attempting to call...`);
        isFactoryFunction = true;

        let factoryResult = null;

        // Strategy 1: Try calling with no arguments
        try {
          console.log(`  Trying: ${toolName}()`);
          factoryResult = rawExport();
          if (factoryResult?.execute) {
            console.log('  ✅ Success with no-args factory');
            rawExport = factoryResult;
          }
        } catch (error) {
          console.log('  ❌ No-args failed:', errorMessage(error));
        }

        // Strategy 2: Try calling with env vars as config object
        if (!factoryResult && env && typeof env === 'object') {
          // Build multiple config variations to try
          const configVariations = [];

          // Variation 1: Raw env vars (e.g., { VALYU_API_KEY: 'xxx' })
          configVariations.push({ ...env });

          // Variation 2: Normalized to camelCase apiKey (e.g., { apiKey: 'xxx' })
          const apiKeyValue = Object.entries(env).find(([key]) =>
            key.toUpperCase().includes('API_KEY')
          )?.[1];
          if (apiKeyValue) {
            configVariations.push({ apiKey: apiKeyValue });
          }

          // Variation 3: Normalized to key (e.g., { key: 'xxx' })
          if (apiKeyValue) {
            configVariations.push({ key: apiKeyValue });
          }

          // Try each config variation
          for (const config of configVariations) {
            try {
              console.log(`  Trying: ${toolName}(`, Object.keys(config), ')');
              factoryResult = rawExport(config);
              if (factoryResult?.execute) {
                console.log('  ✅ Success with config:', Object.keys(config));
                rawExport = factoryResult;
                break;
              }
            } catch (error) {
              console.log('  ❌ Config', Object.keys(config), 'failed:', errorMessage(error));
            }
          }
        }

        // Strategy 3: Try calling with first env var value (single-arg pattern)
        if (!factoryResult && env && typeof env === 'object') {
          try {
            const firstValue = Object.values(env)[0];
            if (firstValue) {
              console.log(`  Trying: ${toolName}(firstEnvValue)`);
              factoryResult = rawExport(firstValue);
              if (factoryResult?.execute) {
                console.log('  ✅ Success with single-arg factory');
                rawExport = factoryResult;
              }
            }
          } catch (error) {
            console.log('  ❌ Single-arg failed:', errorMessage(error));
          }
        }

        if (!factoryResult) {
          return failureResponse(
            {
              error: `Tool "${toolName}" is a factory function but couldn't be initialized`,
              errorStage: 'load',
              errorCode: 'TOOL_CONFIGURATION_REQUIRED',
              retryable: false,
            },
            { status: 400, executionTimeMs: Date.now() - startTime }
          );
        }
      }

      toolModule = rawExport;

      if (!toolModule.execute) {
        return failureResponse(
          {
            error: 'Tool missing execute function',
            errorStage: 'load',
            errorCode: 'INVALID_TOOL',
            retryable: false,
          },
          { status: 400, executionTimeMs: Date.now() - startTime }
        );
      }

      // Cache with TTL - mark factory functions so we know to re-import them
      setCachedModule(cacheKey, toolModule, isFactoryFunction);
    }

    // Note: Environment variables are already injected at the start of this function
    // before cache check and factory calls, so they're available when tools read process.env

    // Execute the tool with AI SDK execution context
    // Some tools expect a second argument with { abortSignal, ... }
    const abortController = new AbortController();
    const executionContext = {
      abortSignal: abortController.signal,
      // Add other context properties that AI SDK tools might expect
      messages: [],
      toolCallId: `exec_${Date.now()}`,
    };

    console.log(`🚀 Executing ${cacheKey} with params:`, params);
    // biome-ignore lint/suspicious/noImplicitAnyLet: Tool output is dynamic
    let result;
    try {
      result = await toolModule.execute(params || {}, executionContext);
    } catch (executeError) {
      const executionTimeMs = Date.now() - startTime;
      const message = executeError instanceof Error ? executeError.message : String(executeError);
      console.error('❌ Tool threw during execute():', message);
      const failure: ExecutorFailure = {
        error: message,
        errorStage: 'execute',
        errorCode: 'TOOL_EXECUTION_FAILED',
        retryable: false,
      };
      reportToolHealth(packageName, toolName, false, failure).catch(() => {});

      // The tool imported, initialized, and RAN — the throw came from inside
      // tool.execute() (input validation, missing credentials, a remote API
      // failure). That is not an executor/infrastructure failure, so respond
      // 200 with a structured errorStage instead of a blanket 500: callers
      // (health checks) can classify by stage instead of regexing messages.
      return failureResponse(failure, { status: 200, executionTimeMs });
    }

    const executionTimeMs = Date.now() - startTime;
    console.log(`✅ Execution complete in ${executionTimeMs}ms`);

    // Report successful execution to health service (non-blocking)
    reportToolHealth(packageName, toolName, true).catch(() => {});

    return Response.json({
      success: true,
      output: result,
      executionTimeMs,
    });
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    console.error('❌ Tool execution failed:', error);

    // Report failed execution to health service (non-blocking)
    const failure: ExecutorFailure = {
      error: errorMessage(error),
      errorStage: 'load',
      errorCode: 'PACKAGE_IMPORT_FAILED',
      retryable: true,
    };
    reportToolHealth(packageName, toolName, false, failure).catch(() => {});

    return failureResponse(failure, { status: 500, executionTimeMs });
  }
}

/**
 * List all exports from a package and identify which are valid AI SDK tools
 */
async function listExports(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { packageName, version, importUrl, env } = body;

    if (!packageName || !version) {
      return Response.json(
        {
          success: false,
          error: 'Missing required fields: packageName, version',
        },
        { status: 400 }
      );
    }

    // Dynamic import from esm.sh
    const url = importUrl || `https://esm.sh/${packageName}@${version}`;
    console.log(`📦 Listing exports from: ${url}`);

    const module = await import(url);
    const allExports = Object.keys(module);

    // Filter out 'default' and identify which exports are valid tools
    const tools: Array<{
      name: string;
      isValidTool: boolean;
      description?: string;
      error?: string;
    }> = [];

    for (const exportKey of allExports) {
      if (exportKey === 'default') continue;

      let rawExport = module[exportKey];

      // Check if it's a factory function
      if (typeof rawExport === 'function' && !rawExport.description && !rawExport.execute) {
        // Try to call factory with no args
        try {
          const factoryResult = rawExport();
          if (factoryResult?.description && factoryResult?.execute) {
            rawExport = factoryResult;
          } else if (env && typeof env === 'object') {
            // Try with env config
            const configResult = rawExport({ ...env });
            if (configResult?.description && configResult?.execute) {
              rawExport = configResult;
            }
          }
        } catch {
          // Factory call failed, continue checking
        }
      }

      // Check if it's a valid AI SDK tool
      if (rawExport?.description && rawExport?.execute) {
        tools.push({
          name: exportKey,
          isValidTool: true,
          description: rawExport.description,
        });
      } else if (typeof rawExport === 'object' && rawExport !== null) {
        // It's an object but not a valid tool - might be a factory that needs specific config
        tools.push({
          name: exportKey,
          isValidTool: false,
          error: 'Not a valid AI SDK tool (missing description or execute)',
        });
      }
      // Skip non-object exports (they're definitely not tools)
    }

    console.log(`✅ Found ${tools.length} potential tool exports in ${packageName}`);

    return Response.json({
      success: true,
      packageName,
      version,
      exports: allExports,
      tools,
    });
  } catch (error) {
    console.error('❌ Failed to list exports:', error);
    return Response.json(
      {
        success: false,
        error: errorMessage(error),
      },
      { status: 500 }
    );
  }
}

// Track startup time for uptime reporting
const startedAt = Date.now();

/**
 * Health check
 */
function health(): Response {
  return Response.json({
    status: 'ok',
    protocolVersion: '1.1',
    implementationVersion: Deno.env.get('TPMJS_EXECUTOR_VERSION') || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    cacheSize: moduleCache.size,
    maxCacheSize: MAX_CACHE_SIZE,
    denoVersion: Deno.version.deno,
    v8Version: Deno.version.v8,
    httpImports: true,
  });
}

/**
 * Cache stats
 */
function cacheStats(): Response {
  const now = Date.now();
  const entries = Array.from(moduleCache.entries()).map(([key, entry]) => ({
    key,
    isFactory: entry.isFactory,
    expiresIn: Math.max(0, Math.round((entry.expiresAt - now) / 1000)),
  }));

  return Response.json({
    success: true,
    cacheSize: moduleCache.size,
    ttlSeconds: CACHE_TTL_MS / 1000,
    cachedTools: entries,
  });
}

/**
 * Clear cache
 */
function clearCache(): Response {
  const size = moduleCache.size;
  moduleCache.clear();
  console.log(`🗑️  Cleared cache (${size} entries)`);

  return Response.json({
    success: true,
    message: `Cleared ${size} cached modules`,
  });
}

/**
 * Main request handler — wrapped with crash protection so no single request
 * can take down the process.
 */
async function handler(req: Request): Promise<Response> {
  // Reject requests during shutdown
  if (isShuttingDown) {
    return new Response('Service shutting down', { status: 503 });
  }

  const url = new URL(req.url);

  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    let response: Response;

    if (url.pathname === '/health' && req.method === 'GET') {
      response = health();
    } else if (!checkAuth(req)) {
      response = failureResponse(
        {
          error: 'Unauthorized',
          errorStage: 'request',
          errorCode: 'AUTHENTICATION_REQUIRED',
          retryable: false,
        },
        { status: 401, executionTimeMs: 0 }
      );
    } else if (url.pathname === '/load-and-describe' && req.method === 'POST') {
      response = await loadAndDescribe(req);
    } else if (url.pathname === '/list-exports' && req.method === 'POST') {
      response = await listExports(req);
    } else if (url.pathname === '/execute-tool' && req.method === 'POST') {
      response = await executeTool(req);
    } else if (url.pathname === '/cache/stats' && req.method === 'GET') {
      response = cacheStats();
    } else if (url.pathname === '/cache/clear' && req.method === 'POST') {
      response = clearCache();
    } else {
      response = Response.json({ error: 'Not found' }, { status: 404 });
    }

    // Add CORS headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Request handler error:', error);
    const response = failureResponse(
      {
        error: errorMessage(error),
        errorStage: 'executor',
        errorCode: 'EXECUTOR_INTERNAL_ERROR',
        retryable: true,
      },
      { status: 500, executionTimeMs: 0 }
    );
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  }
}

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
let isShuttingDown = false;

function handleShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  moduleCache.clear();
  // Give in-flight requests a moment to complete
  setTimeout(() => {
    console.log('👋 Goodbye');
    Deno.exit(0);
  }, 5000);
}

Deno.addSignalListener('SIGTERM', () => handleShutdown('SIGTERM'));
Deno.addSignalListener('SIGINT', () => handleShutdown('SIGINT'));

// Start server
const port = Number.parseInt(Deno.env.get('PORT') || '3002', 10);

console.log(`🚀 TPMJS Dynamic Executor (Deno) running on port ${port}`);
console.log(
  `🔒 Auth: ${EXECUTOR_API_KEY ? 'enabled (Bearer token required)' : 'DISABLED (set EXECUTOR_API_KEY)'}`
);
console.log('📦 HTTP imports: ENABLED');
console.log(`🔗 Health check: http://localhost:${port}/health`);
console.log('🛠️  Endpoints:');
console.log('   POST /load-and-describe - Load tool and get schema');
console.log('   POST /list-exports - List all exports and identify valid tools');
console.log('   POST /execute-tool - Execute a tool with params');
console.log('   POST /cache/clear - Clear module cache');
console.log('   GET /cache/stats - Get cache statistics');

Deno.serve({ port }, handler);
