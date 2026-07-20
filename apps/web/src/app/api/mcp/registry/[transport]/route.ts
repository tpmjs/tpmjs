import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { API_KEY_SCOPES } from '~/lib/api-keys';
import { authenticateRequest, getClientMetadata, hasScope } from '~/lib/api-keys/middleware';
import {
  checkApiKeyRateLimit,
  createRateLimitResponse,
  getRateLimitHeaders,
} from '~/lib/api-keys/rate-limit';
import { trackUsage } from '~/lib/api-keys/usage';
import { executeWithExecutor } from '~/lib/executors';
import { calculateBM25, tokenize } from '~/lib/search/bm25';
import { defaultToolDiscoveryFilter } from '~/lib/tool-health-policy';
import { trackExecution } from '~/lib/tracking/executions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DB_TIMEOUT_MS = 10000;

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: unknown;
  id?: string | number;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms)),
  ]);
}

/**
 * Handle MCP initialize for the master registry
 */
function handleInitialize(requestId: string | number | null): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id: requestId,
    result: {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: 'TPMJS Registry',
        version: '1.0.0',
      },
      capabilities: { tools: {} },
    },
  };
}

/**
 * Handle MCP tools/list — returns the two meta-tools: search_tools and execute_tool
 */
function handleToolsList(requestId: string | number | null): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id: requestId,
    result: {
      tools: [
        {
          name: 'search_tools',
          description:
            'Search the TPMJS registry for AI tools. Returns tool names, descriptions, package names, and input schemas. Use this to find tools by keyword or intent.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query describing what kind of tool you need',
              },
              category: {
                type: 'string',
                description: 'Optional category filter (e.g. "api", "storage", "ai")',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results (default: 10, max: 50)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'execute_tool',
          description:
            'Execute a tool from the TPMJS registry by its package name and export name. Pass the tool parameters as arguments.',
          inputSchema: {
            type: 'object',
            properties: {
              packageName: {
                type: 'string',
                description: 'NPM package name (e.g. "@tpmjs/hello")',
              },
              toolName: {
                type: 'string',
                description: 'Exported tool name (e.g. "helloWorldTool")',
              },
              arguments: {
                type: 'object',
                description: 'Arguments to pass to the tool, matching its input schema',
              },
              env: {
                type: 'object',
                description: 'Optional environment variables the tool needs (e.g. API keys)',
              },
            },
            required: ['packageName', 'toolName'],
          },
        },
      ],
    },
  };
}

/**
 * Handle search_tools call — searches the full TPMJS registry
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: BM25 scoring logic requires branching
async function handleSearchTools(
  args: { query?: string; category?: string; limit?: number },
  requestId: string | number | null
): Promise<JsonRpcResponse> {
  try {
    const query = args.query || '';
    const category = args.category || null;
    const limit = Math.min(args.limit || 10, 50);

    // Fetch tools from DB
    const where: Record<string, unknown> = defaultToolDiscoveryFilter();
    if (category) {
      where.package = { category };
    }

    // Prefilter candidates in the DB: BM25 only keeps docs containing at least
    // one query token, and every token is a contiguous substring of its source
    // field, so an insensitive `contains` OR-filter is recall-equivalent to
    // scoring the whole table (which a fixed take:200 was not — it silently
    // excluded 3/4 of the registry from search).
    if (query) {
      const queryTokens = tokenize(query);
      if (queryTokens.length > 0) {
        where.OR = queryTokens.flatMap((token) => [
          { name: { contains: token, mode: 'insensitive' } },
          { description: { contains: token, mode: 'insensitive' } },
          { tags: { has: token } },
          { package: { npmPackageName: { contains: token, mode: 'insensitive' } } },
        ]);
      }
    }

    const tools = await withTimeout(
      prisma.tool.findMany({
        where,
        include: { package: true },
        take: query ? 2000 : limit, // candidate ceiling for BM25 scoring
      }),
      DB_TIMEOUT_MS,
      'Database query timed out'
    );

    let results = tools;

    // Apply BM25 scoring if query provided
    if (query) {
      // Build document texts and compute doc frequencies
      const docTexts = tools.map((tool) =>
        [tool.name, tool.description, tool.package.npmPackageName, ...(tool.tags || [])]
          .filter(Boolean)
          .join(' ')
      );

      const avgDocLength =
        docTexts.reduce((sum, text) => sum + tokenize(text).length, 0) / (docTexts.length || 1);

      // Build document frequencies for each token
      const docFrequencies = new Map<string, number>();
      for (const text of docTexts) {
        const uniqueTokens = new Set(tokenize(text));
        for (const token of uniqueTokens) {
          docFrequencies.set(token, (docFrequencies.get(token) || 0) + 1);
        }
      }

      const scored = tools
        .map((tool, i) => {
          const score = calculateBM25(
            query,
            docTexts[i] ?? '',
            avgDocLength,
            tools.length,
            docFrequencies
          );
          return { tool, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      results = scored.map((s) => s.tool);
    } else {
      results = tools.slice(0, limit);
    }

    const formattedTools = results.map((tool) => ({
      packageName: tool.package.npmPackageName,
      toolName: tool.name,
      description: tool.description,
      category: tool.package.category,
      inputSchema: tool.inputSchema,
      version: tool.package.npmVersion,
      qualityScore: tool.qualityScore ? Number(tool.qualityScore) : null,
      importHealth: tool.importHealth,
      executionHealth: tool.executionHealth,
      env: tool.package.env,
    }));

    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                query,
                count: formattedTools.length,
                tools: formattedTools,
              },
              null,
              2
            ),
          },
        ],
      },
    };
  } catch (error) {
    console.error('[MCP Registry search_tools] Error:', error);
    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        content: [
          {
            type: 'text',
            text: `Error searching tools: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      },
    };
  }
}

/**
 * Handle execute_tool call — executes a tool via the TPMJS executor
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: tool execution with validation and tracking
async function handleExecuteTool(
  args: {
    packageName?: string;
    toolName?: string;
    arguments?: Record<string, unknown>;
    env?: Record<string, string>;
  },
  requestId: string | number | null,
  trackingCtx?: { userId?: string; apiKeyId?: string }
): Promise<JsonRpcResponse> {
  try {
    if (!args.packageName || !args.toolName) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: { code: -32602, message: 'packageName and toolName are required' },
      };
    }

    // Verify the tool exists
    const tool = await withTimeout(
      prisma.tool.findFirst({
        where: {
          name: args.toolName,
          package: { npmPackageName: args.packageName },
        },
        include: { package: true },
      }),
      DB_TIMEOUT_MS,
      'Database query timed out'
    );

    if (!tool) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32602,
          message: `Tool "${args.toolName}" not found in package "${args.packageName}"`,
        },
      };
    }

    // Execute via the default executor
    const execStart = Date.now();
    const result = await executeWithExecutor(null, {
      packageName: args.packageName,
      name: args.toolName,
      version: tool.package.npmVersion,
      params: args.arguments ?? {},
      env: args.env && Object.keys(args.env).length > 0 ? args.env : undefined,
    });
    const execDurationMs = Date.now() - execStart;

    // Track execution
    if (trackingCtx) {
      trackExecution({
        eventType: 'tool_call',
        source: 'mcp_http',
        userId: trackingCtx.userId,
        apiKeyId: trackingCtx.apiKeyId,
        toolId: tool.id,
        toolName: tool.name,
        packageName: args.packageName,
        status: result.success ? 'success' : 'error',
        durationMs: execDurationMs,
        errorMessage: result.success ? undefined : String(result.error),
        inputArgs: args.arguments,
        outputSummary: result.success ? result.output : { error: result.error },
      });
    }

    if (!result.success) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          content: [{ type: 'text', text: `Error: ${result.error}` }],
          isError: true,
        },
      };
    }

    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        content: [
          {
            type: 'text',
            text:
              typeof result.output === 'string'
                ? result.output
                : JSON.stringify(result.output, null, 2),
          },
        ],
      },
    };
  } catch (error) {
    console.error('[MCP Registry execute_tool] Error:', error);
    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        content: [
          {
            type: 'text',
            text: `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      },
    };
  }
}

/**
 * Process a JSON-RPC request for the master registry MCP server
 */
async function processJsonRpcRequest(
  body: JsonRpcRequest,
  trackingCtx?: { userId?: string; apiKeyId?: string }
): Promise<JsonRpcResponse> {
  const requestId = body.id ?? null;

  switch (body.method) {
    case 'initialize':
      return handleInitialize(requestId);

    case 'tools/list':
      return handleToolsList(requestId);

    case 'tools/call': {
      const params = body.params as {
        name: string;
        arguments?: Record<string, unknown>;
      };

      if (params.name === 'search_tools') {
        return handleSearchTools(
          (params.arguments ?? {}) as { query?: string; category?: string; limit?: number },
          requestId
        );
      }

      if (params.name === 'execute_tool') {
        return handleExecuteTool(
          (params.arguments ?? {}) as {
            packageName?: string;
            toolName?: string;
            arguments?: Record<string, unknown>;
            env?: Record<string, string>;
          },
          requestId,
          trackingCtx
        );
      }

      return {
        jsonrpc: '2.0',
        id: requestId,
        error: { code: -32602, message: `Unknown tool: ${params.name}` },
      };
    }

    case 'notifications/initialized':
    case 'ping':
      return { jsonrpc: '2.0', id: requestId, result: {} };

    default:
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: { code: -32601, message: `Method not found: ${body.method}` },
      };
  }
}

/**
 * POST /api/mcp/registry/http  — Streamable HTTP transport
 * POST /api/mcp/registry/sse   — SSE transport
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: MCP HTTP handler with auth, rate limiting, and transport dispatch
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transport: string }> }
): Promise<Response> {
  const startTime = Date.now();
  let authResult: Awaited<ReturnType<typeof authenticateRequest>> | null = null;

  try {
    const { transport } = await params;

    if (transport !== 'http' && transport !== 'sse') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          error: { code: -32001, message: `Invalid transport: ${transport}` },
          id: null,
        },
        { status: 400 }
      );
    }

    // Parse body first so we can allow unauthenticated discovery (initialize, tools/list)
    let body: JsonRpcRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
        { status: 400 }
      );
    }

    // Allow discovery and search without auth; only execute_tool requires auth
    const toolCallName =
      body.method === 'tools/call' ? (body.params as { name?: string })?.name : null;
    const requiresAuth = body.method === 'tools/call' && toolCallName === 'execute_tool';

    // Authenticate (always attempt, but only enforce for execute_tool)
    authResult = await authenticateRequest();

    if (requiresAuth && !authResult.authenticated) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message:
              authResult.error ||
              'Authentication required. Provide a TPMJS API key via Bearer token.',
          },
          id: null,
        },
        { status: 401 }
      );
    }

    if (requiresAuth && !hasScope(authResult, API_KEY_SCOPES.MCP_EXECUTE)) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Missing required scope: mcp:execute' },
          id: null,
        },
        { status: 403 }
      );
    }

    // Rate limit (only for authenticated requests)
    if (authResult.authenticated && authResult.apiKeyId) {
      const rateLimitResult = await checkApiKeyRateLimit(
        authResult.apiKeyId,
        authResult.tier || 'FREE'
      );
      if (!rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult);
      }
    }

    // Notifications — 202 Accepted
    const isNotification = body.id === undefined || body.id === null;
    if (isNotification && body.method !== 'initialize') {
      return new NextResponse(null, { status: 202 });
    }

    const trackingCtx = {
      userId: authResult.userId ?? undefined,
      apiKeyId: authResult.apiKeyId ?? undefined,
    };

    const response = await processJsonRpcRequest(body, trackingCtx);

    if (transport === 'sse') {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(response)}\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // HTTP transport
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (body.method === 'initialize') {
      headers['Mcp-Session-Id'] = crypto.randomUUID();
    }

    const nextResponse = NextResponse.json(response, { headers });

    // Rate limit headers
    if (authResult.apiKeyId) {
      const rateLimitResult = await checkApiKeyRateLimit(
        authResult.apiKeyId,
        authResult.tier || 'FREE'
      );
      for (const [key, value] of Object.entries(getRateLimitHeaders(rateLimitResult))) {
        nextResponse.headers.set(key, value);
      }
    }

    // Track usage
    if (authResult.userId) {
      const clientMeta = await getClientMetadata();
      trackUsage({
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: `/api/mcp/registry/${transport}`,
        method: 'POST',
        statusCode: nextResponse.status,
        latencyMs: Date.now() - startTime,
        resourceType: 'mcp',
        resourceId: 'registry',
        userAgent: clientMeta.userAgent,
        ipAddress: clientMeta.ipAddress,
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('[MCP Registry POST] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32603, message }, id: null },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp/registry/http — Server info
 * GET /api/mcp/registry/sse — SSE connection
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ transport: string }> }
): Promise<Response> {
  const { transport } = await params;

  if (transport !== 'http' && transport !== 'sse') {
    return NextResponse.json({ error: `Invalid transport: ${transport}` }, { status: 400 });
  }

  if (transport === 'sse') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const serverInfo = {
          type: 'server_info',
          name: 'TPMJS Registry',
          description:
            'Master MCP server for the TPMJS tool registry. Search and execute any tool from the registry.',
          protocol: 'mcp',
          transport: 'sse',
          endpoint: '/api/mcp/registry/sse',
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(serverInfo)}\n\n`));
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  return NextResponse.json({
    name: 'TPMJS Registry',
    description:
      'Master MCP server for the TPMJS tool registry. Search and execute any tool from the registry.',
    protocol: 'mcp',
    transport: 'http',
    endpoint: '/api/mcp/registry/http',
    tools: ['search_tools', 'execute_tool'],
  });
}
