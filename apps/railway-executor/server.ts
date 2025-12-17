/**
 * Railway Dynamic Tool Executor (Deno)
 * Uses Deno's native HTTP import support
 */

// Import zod-to-json-schema for Zod v3 support
import { zodToJsonSchema } from 'https://esm.sh/zod-to-json-schema@3.25.0';

// Cache TTL: 2 minutes
const CACHE_TTL_MS = 2 * 60 * 1000;

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
  error?: string
): Promise<void> {
  try {
    const response = await fetch(`${TPMJS_API_URL}/api/tools/report-health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName,
        name,
        success,
        error,
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
      sanitized[key] = sanitized[key].map((s: any) => sanitizeJsonSchema(s));
    }
  }

  return sanitized;
}

/**
 * Load and describe a tool from esm.sh
 */
async function loadAndDescribe(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { packageName, name, version, importUrl, env } = body;

    if (!packageName || !name || !version) {
      return Response.json(
        {
          success: false,
          error: 'Missing required fields: packageName, name, version',
        },
        { status: 400 }
      );
    }

    const cacheKey = `${packageName}::${name}`;

    // biome-ignore lint/suspicious/noImplicitAnyLet: Tool type is determined dynamically after import
    let toolModule;

    // Check cache first (with TTL)
    const cachedEntry = getCachedModule(cacheKey);
    if (cachedEntry) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      toolModule = cachedEntry.module;
    } else {
      // Dynamic import from esm.sh (Deno supports this natively!)
      const url = importUrl || `https://esm.sh/${packageName}@${version}`;
      console.log(`📦 Importing: ${url}`);

      const module = await import(url);
      let rawExport = module[name];

      if (!rawExport) {
        console.error(`❌ Export "${name}" not found. Available:`, Object.keys(module));
        return Response.json(
          {
            success: false,
            error: `Export "${name}" not found in module`,
            availableExports: Object.keys(module),
          },
          { status: 404 }
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
          console.log('  ❌ No-args failed:', error.message);
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
              console.log('  ❌ Config', Object.keys(config), 'failed:', error.message);
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
            console.log('  ❌ Single-arg failed:', error.message);
          }
        }

        // If all factory strategies failed, return error
        if (!factoryResult) {
          console.error('❌ Factory function detected but all call strategies failed');
          return Response.json(
            {
              success: false,
              error: `Tool "${name}" is a factory function but couldn't be initialized. Tried: no-args, config object, and single-arg patterns.`,
              hint: 'This tool may require specific configuration. Check package documentation.',
            },
            { status: 400 }
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
        return Response.json(
          {
            success: false,
            error: 'Invalid AI SDK tool structure (missing description or execute)',
            toolKeys: Object.keys(toolModule),
          },
          { status: 400 }
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

      // Strategy 3: Try Zod v3 schema (detect via _def property and convert)
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
      return Response.json(
        {
          success: false,
          error: `Tool "${name}" has no valid inputSchema. Tools must use AI SDK jsonSchema(), Zod v4 toJSONSchema(), or Zod v3 schemas.`,
          debug: {
            hasInputSchema: !!toolModule.inputSchema,
            availableMethods: toolModule.inputSchema ? Object.keys(toolModule.inputSchema) : [],
            hasZodDef: !!toolModule.inputSchema?._def,
          },
        },
        { status: 400 }
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
    return Response.json(
      {
        success: false,
        error: error.message,
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
    const body = await req.json();
    const { packageName: pkg, name, version, importUrl, params, env } = body;
    packageName = pkg || 'unknown';
    toolName = name || 'unknown';

    console.log('📥 Execute request:', {
      packageName,
      name: toolName,
      version,
      envKeys: env ? Object.keys(env) : [],
      envValues: env || {},
    });

    if (!packageName || !toolName || !version) {
      return Response.json(
        {
          success: false,
          error: 'Missing required fields: packageName, name, version',
        },
        { status: 400 }
      );
    }

    const cacheKey = `${packageName}::${toolName}`;

    // Inject environment variables FIRST - before cache check and factory calls
    // This ensures process.env is set when factory functions read from it
    if (env && typeof env === 'object') {
      const envKeys = Object.keys(env);
      if (envKeys.length > 0) {
        console.log(`🔐 Injecting ${envKeys.length} environment variables:`, envKeys);
        for (const [key, value] of Object.entries(env)) {
          const stringValue = String(value);

          // Set in Deno environment (for esm.sh imports)
          Deno.env.set(key, stringValue);

          // ALSO set in Node.js process.env (for npm: imports)
          // @ts-ignore - process is available in Node.js compatibility mode
          if (typeof globalThis.process !== 'undefined' && globalThis.process.env) {
            // @ts-ignore - process.env exists in Node compat mode
            globalThis.process.env[key] = stringValue;
          }

          console.log(`  ✅ Set ${key} = ${stringValue.substring(0, 10)}...`);
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
      const url = importUrl || `https://esm.sh/${packageName}@${version}`;
      console.log(`📦 Importing for execution: ${url}`);

      const module = await import(url);
      let rawExport = module[toolName];

      if (!rawExport) {
        return Response.json(
          {
            success: false,
            error: 'Tool not found',
            executionTimeMs: Date.now() - startTime,
          },
          { status: 404 }
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
          console.log('  ❌ No-args failed:', error.message);
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
              console.log('  ❌ Config', Object.keys(config), 'failed:', error.message);
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
            console.log('  ❌ Single-arg failed:', error.message);
          }
        }

        if (!factoryResult) {
          return Response.json(
            {
              success: false,
              error: `Tool "${toolName}" is a factory function but couldn't be initialized`,
              executionTimeMs: Date.now() - startTime,
            },
            { status: 400 }
          );
        }
      }

      toolModule = rawExport;

      if (!toolModule.execute) {
        return Response.json(
          {
            success: false,
            error: 'Tool missing execute function',
            executionTimeMs: Date.now() - startTime,
          },
          { status: 400 }
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
    const result = await toolModule.execute(params || {}, executionContext);

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
    reportToolHealth(packageName, toolName, false, error.message).catch(() => {});

    return Response.json(
      {
        success: false,
        error: error.message,
        executionTimeMs,
      },
      { status: 500 }
    );
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

    for (const exportName of allExports) {
      if (exportName === 'default') continue;

      let rawExport = module[exportName];

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
          name: exportName,
          isValidTool: true,
          description: rawExport.description,
        });
      } else if (typeof rawExport === 'object' && rawExport !== null) {
        // It's an object but not a valid tool - might be a factory that needs specific config
        tools.push({
          name: exportName,
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
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Health check
 */
function health(): Response {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cacheSize: moduleCache.size,
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
 * Main request handler
 */
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    let response: Response;

    if (url.pathname === '/health' && req.method === 'GET') {
      response = health();
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
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500, headers }
    );
  }
}

// Start server
const port = Number.parseInt(Deno.env.get('PORT') || '3002');

console.log(`🚀 Railway Tool Executor (Deno) running on port ${port}`);
console.log('📦 HTTP imports: ENABLED');
console.log(`🔗 Health check: http://localhost:${port}/health`);
console.log('🛠️  Endpoints:');
console.log('   POST /load-and-describe - Load tool and get schema');
console.log('   POST /list-exports - List all exports and identify valid tools');
console.log('   POST /execute-tool - Execute a tool with params');
console.log('   POST /cache/clear - Clear module cache');
console.log('   GET /cache/stats - Get cache statistics');

Deno.serve({ port }, handler);
