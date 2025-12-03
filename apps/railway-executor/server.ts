/**
 * Railway Dynamic Tool Executor (Deno)
 * Uses Deno's native HTTP import support
 */

// Cache for imported tool modules
const moduleCache = new Map<string, any>();

/**
 * Load and describe a tool from esm.sh
 */
async function loadAndDescribe(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { packageName, exportName, version, importUrl } = body;

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

    let toolModule;

    // Check cache first
    if (moduleCache.has(cacheKey)) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      toolModule = moduleCache.get(cacheKey);
    } else {
      // Dynamic import from esm.sh (Deno supports this natively!)
      const url = importUrl || `https://esm.sh/${packageName}@${version}`;
      console.log(`📦 Importing: ${url}`);

      const module = await import(url);
      toolModule = module[exportName];

      if (!toolModule) {
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

      // Validate it's an AI SDK tool
      if (!toolModule.description || !toolModule.execute) {
        console.error(`❌ Invalid AI SDK tool structure:`, {
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

    // Extract tool definition
    // Note: We don't send inputSchema because Zod schemas can't be serialized over JSON
    // The playground will use the actual tool's inputSchema when creating the wrapper
    return Response.json({
      success: true,
      tool: {
        exportName,
        description: toolModule.description,
        // Store reference that inputSchema exists (for validation)
        hasInputSchema: !!toolModule.inputSchema,
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
    const { packageName, exportName, version, importUrl, params } = body;

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

    let toolModule;

    // Check cache or import
    if (moduleCache.has(cacheKey)) {
      console.log(`✅ Using cached tool: ${cacheKey}`);
      toolModule = moduleCache.get(cacheKey);
    } else {
      const url = importUrl || `https://esm.sh/${packageName}@${version}`;
      console.log(`📦 Importing for execution: ${url}`);

      const module = await import(url);
      toolModule = module[exportName];

      if (!toolModule || !toolModule.execute) {
        return Response.json(
          {
            success: false,
            error: 'Tool not found or invalid',
            executionTimeMs: Date.now() - startTime,
          },
          { status: 404 }
        );
      }

      moduleCache.set(cacheKey, toolModule);
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
console.log(`📦 HTTP imports: ENABLED`);
console.log(`🔗 Health check: http://localhost:${port}/health`);
console.log(`🛠️  Endpoints:`);
console.log(`   POST /load-and-describe - Load tool and get schema`);
console.log(`   POST /execute-tool - Execute a tool with params`);
console.log(`   POST /cache/clear - Clear module cache`);
console.log(`   GET /cache/stats - Get cache statistics`);

Deno.serve({ port }, handler);
