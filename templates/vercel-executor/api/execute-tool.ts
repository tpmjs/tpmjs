/**
 * Tool Execution Endpoint (Deno Runtime)
 *
 * POST /api/execute-tool
 * Execute a TPMJS tool with parameters
 *
 * Uses Deno's native HTTP import support to load tools from esm.sh
 */

// @ts-ignore - Deno global
declare const Deno: {
  env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };
};

interface ExecuteToolRequest {
  packageName: string;
  name: string;
  version?: string;
  importUrl?: string;
  params: Record<string, unknown>;
  env?: Record<string, string>;
}

interface ExecuteToolResponse {
  success: boolean;
  output?: unknown;
  error?: string;
  executionTimeMs: number;
}

// Simple in-memory cache for tool modules
// biome-ignore lint/suspicious/noExplicitAny: Tool types are dynamic
const moduleCache = new Map<string, { module: any; expiresAt: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Check authorization if EXECUTOR_API_KEY is set
  const apiKey = Deno.env.get('EXECUTOR_API_KEY');
  if (apiKey) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'Access-Control-Allow-Origin': '*' },
        }
      );
    }
  }

  const startTime = Date.now();
  let packageName = 'unknown';
  let toolName = 'unknown';

  try {
    const body: ExecuteToolRequest = await req.json();
    packageName = body.packageName || 'unknown';
    toolName = body.name || 'unknown';

    const { version, importUrl, params, env } = body;

    if (!body.packageName || !body.name) {
      return Response.json(
        {
          success: false,
          error: 'Missing required fields: packageName, name',
          executionTimeMs: Date.now() - startTime,
        },
        {
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const resolvedVersion = version || 'latest';
    const cacheKey = `${packageName}@${resolvedVersion}::${toolName}`;

    // Inject environment variables before loading/executing tool
    if (env && typeof env === 'object') {
      for (const [key, value] of Object.entries(env)) {
        Deno.env.set(key, String(value));
      }
    }

    // biome-ignore lint/suspicious/noExplicitAny: Tool types are dynamic
    let toolModule: any;
    const cachedEntry = moduleCache.get(cacheKey);
    const now = Date.now();

    if (cachedEntry && now < cachedEntry.expiresAt) {
      toolModule = cachedEntry.module;
    } else {
      // Dynamic import from esm.sh - Deno supports this natively!
      const url = importUrl || `https://esm.sh/${packageName}@${resolvedVersion}`;
      const module = await import(url);

      let rawExport = module[toolName];

      if (!rawExport) {
        return Response.json(
          {
            success: false,
            error: `Export "${toolName}" not found in module`,
            availableExports: Object.keys(module),
            executionTimeMs: Date.now() - startTime,
          },
          {
            status: 404,
            headers: { 'Access-Control-Allow-Origin': '*' },
          }
        );
      }

      // Handle factory functions (tools that need to be called to create the tool instance)
      if (typeof rawExport === 'function' && !rawExport.execute) {
        let factoryResult = null;

        // Strategy 1: Try calling with no arguments
        try {
          factoryResult = rawExport();
          if (factoryResult?.execute) {
            rawExport = factoryResult;
          }
        } catch {
          // Try other strategies
        }

        // Strategy 2: Try with env config object
        if (!factoryResult?.execute && env) {
          const configVariations = [
            { ...env },
            // Extract API key if present
            (() => {
              const apiKeyEntry = Object.entries(env).find(([key]) =>
                key.toUpperCase().includes('API_KEY')
              );
              return apiKeyEntry ? { apiKey: apiKeyEntry[1] } : null;
            })(),
          ].filter(Boolean);

          for (const config of configVariations) {
            try {
              factoryResult = rawExport(config);
              if (factoryResult?.execute) {
                rawExport = factoryResult;
                break;
              }
            } catch {
              // Try next config
            }
          }
        }

        // Strategy 3: Try with first env value (single-arg pattern)
        if (!factoryResult?.execute && env) {
          const firstValue = Object.values(env)[0];
          if (firstValue) {
            try {
              factoryResult = rawExport(firstValue);
              if (factoryResult?.execute) {
                rawExport = factoryResult;
              }
            } catch {
              // Factory failed
            }
          }
        }

        if (!rawExport?.execute) {
          return Response.json(
            {
              success: false,
              error: `Tool "${toolName}" is a factory function but couldn't be initialized`,
              hint: 'This tool may require specific configuration. Check package documentation.',
              executionTimeMs: Date.now() - startTime,
            },
            {
              status: 400,
              headers: { 'Access-Control-Allow-Origin': '*' },
            }
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
          {
            status: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
          }
        );
      }

      // Cache the module
      moduleCache.set(cacheKey, {
        module: toolModule,
        expiresAt: now + CACHE_TTL_MS,
      });
    }

    // Execute the tool with AI SDK execution context
    const abortController = new AbortController();
    const executionContext = {
      abortSignal: abortController.signal,
      messages: [],
      toolCallId: `exec_${Date.now()}`,
    };

    const result = await toolModule.execute(params || {}, executionContext);

    const response: ExecuteToolResponse = {
      success: true,
      output: result,
      executionTimeMs: Date.now() - startTime,
    };

    return Response.json(response, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    const response: ExecuteToolResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTimeMs: Date.now() - startTime,
    };

    return Response.json(response, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
