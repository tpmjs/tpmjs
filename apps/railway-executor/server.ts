/**
 * Railway Dynamic Tool Executor (Deno)
 * Uses Deno's native HTTP import support
 */

// Import zod-to-json-schema for Zod v3 support
import { zodToJsonSchema } from 'https://esm.sh/zod-to-json-schema@3.25.0';

// Cache for imported tool modules
// biome-ignore lint/suspicious/noExplicitAny: Tool types are dynamic and vary by package
const moduleCache = new Map<string, any>();

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
    const { packageName, exportName, version, importUrl, env } = body;

    if (!packageName || !exportName || !version) {
      return Response.json(
        {
          success: false,
          error: 'Missing required fields: packageName, exportName, version',
        },
        { status: 400 }
      );
    }

    const cacheKey = `${packageName}::${exportName}`;

    // biome-ignore lint/suspicious/noImplicitAnyLet: Tool type is determined dynamically after import
    let toolModule;

    // Check cache first
    if (moduleCache.has(cacheKey)) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      toolModule = moduleCache.get(cacheKey);
    } else {
      // Dynamic import from esm.sh (Deno supports this natively!)
      const url = importUrl || `https://esm.sh/${packageName}@${version}`;

      // Log cache status for visibility
      const isFirstImport = !moduleCache.has(cacheKey);
      if (isFirstImport) {
        console.log(`📦 Importing from network (will be cached by Deno): ${url}`);
      } else {
        console.log(`✅ Using in-memory cache: ${url}`);
      }

      const module = await import(url);
      let rawExport = module[exportName];

      if (!rawExport) {
        console.error(`❌ Export "${exportName}" not found. Available:`, Object.keys(module));
        return Response.json(
          {
            success: false,
            error: `Export "${exportName}" not found in module`,
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
          console.log(`  Trying: ${exportName}()`);
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
              console.log(`  Trying: ${exportName}(`, Object.keys(config), ')');
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
              console.log(`  Trying: ${exportName}(firstEnvValue)`);
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
              error: `Tool "${exportName}" is a factory function but couldn't be initialized. Tried: no-args, config object, and single-arg patterns.`,
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

      // Cache it
      moduleCache.set(cacheKey, toolModule);
      console.log(`✅ Cached: ${cacheKey}`);
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
          error: `Tool "${exportName}" has no valid inputSchema. Tools must use AI SDK jsonSchema(), Zod v4 toJSONSchema(), or Zod v3 schemas.`,
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

    return Response.json({
      success: true,
      tool: {
        exportName,
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
  try {
    const body = await req.json();
    const { packageName, exportName, version, importUrl, params, env } = body;

    console.log('📥 Execute request:', {
      packageName,
      exportName,
      version,
      envKeys: env ? Object.keys(env) : [],
      envValues: env || {},
    });

    if (!packageName || !exportName || !version) {
      return Response.json(
        {
          success: false,
          error: 'Missing required fields: packageName, exportName, version',
        },
        { status: 400 }
      );
    }

    const cacheKey = `${packageName}::${exportName}`;
    const startTime = Date.now();

    // biome-ignore lint/suspicious/noImplicitAnyLet: Tool type is determined dynamically after import
    let toolModule;

    // Check cache or import
    if (moduleCache.has(cacheKey)) {
      console.log(`✅ Using cached tool: ${cacheKey}`);
      toolModule = moduleCache.get(cacheKey);
    } else {
      const url = importUrl || `https://esm.sh/${packageName}@${version}`;
      console.log(`📦 Importing for execution: ${url}`);

      const module = await import(url);
      let rawExport = module[exportName];

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

      // Check if it's a factory function (not a direct tool)
      if (typeof rawExport === 'function' && !rawExport.description && !rawExport.execute) {
        console.log(`🏭 Detected factory function for ${cacheKey}, attempting to call...`);

        let factoryResult = null;

        // Strategy 1: Try calling with no arguments
        try {
          console.log(`  Trying: ${exportName}()`);
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
              console.log(`  Trying: ${exportName}(`, Object.keys(config), ')');
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
              console.log(`  Trying: ${exportName}(firstEnvValue)`);
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
              error: `Tool "${exportName}" is a factory function but couldn't be initialized`,
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

      moduleCache.set(cacheKey, toolModule);
    }

    // Inject environment variables from client
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
        // Verify they're set in both places
        console.log(
          '🔍 Verification - Deno.env has:',
          envKeys.map((k) => `${k}=${Deno.env.get(k)?.substring(0, 10)}...`)
        );
        // @ts-ignore - process is available in Node.js compatibility mode
        if (typeof globalThis.process !== 'undefined' && globalThis.process.env) {
          console.log(
            '🔍 Verification - process.env has:',
            // @ts-ignore - process.env exists in Node compat mode
            envKeys.map((k) => `${k}=${globalThis.process.env[k]?.substring(0, 10)}...`)
          );
        }
      } else {
        console.log('⚠️  No env vars provided in request');
      }
    } else {
      console.log('⚠️  No env object in request body');
    }

    // Execute the tool
    console.log(`🚀 Executing ${cacheKey} with params:`, params);
    const result = await toolModule.execute(params || {});

    const executionTimeMs = Date.now() - startTime;
    console.log(`✅ Execution complete in ${executionTimeMs}ms`);

    return Response.json({
      success: true,
      output: result,
      executionTimeMs,
    });
  } catch (error) {
    const executionTimeMs = Date.now() - Date.now();
    console.error('❌ Tool execution failed:', error);

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
  const entries = Array.from(moduleCache.keys());

  return Response.json({
    success: true,
    cacheSize: moduleCache.size,
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
console.log('   POST /execute-tool - Execute a tool with params');
console.log('   POST /cache/clear - Clear module cache');
console.log('   GET /cache/stats - Get cache statistics');

Deno.serve({ port }, handler);
