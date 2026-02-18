import { prisma } from '@tpmjs/db';
import type { TpmjsEnv } from '@tpmjs/types/tpmjs';
import { queueBridgeToolCall, waitForBridgeResult } from '~/app/api/bridge/route';
import { logActivity } from '~/lib/activity';
import { type TrackExecutionParams, trackExecution } from '~/lib/tracking/executions';
import { executeWithExecutor, parseExecutorConfig } from '../executors';
import { callRemoteTool } from './remote-client';
import {
  type BridgeTool,
  type CustomMcpTool,
  convertBridgeToolToMcp,
  convertCustomToolToMcp,
  convertToMcpTool,
  parseToolName,
} from './tool-converter';

const DB_TIMEOUT_MS = 10000; // 10 second timeout for database queries

type JsonRpcId = string | number | null;

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms)),
  ]);
}

/**
 * Handle MCP initialize request
 */
export function handleInitialize(collectionName: string, requestId: JsonRpcId): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id: requestId,
    result: {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: `TPMJS: ${collectionName}`,
        version: '1.0.0',
      },
      capabilities: { tools: {} },
    },
  };
}

/**
 * Handle MCP tools/list request
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: MCP tools list handler with schema transformation
export async function handleToolsList(
  collectionId: string,
  requestId: JsonRpcId
): Promise<JsonRpcResponse> {
  try {
    const collection = await withTimeout(
      prisma.collection.findUnique({
        where: { id: collectionId },
        include: {
          tools: {
            include: { tool: { include: { package: true } } },
            orderBy: { position: 'asc' },
          },
          bridgeTools: true,
          customTools: {
            include: { server: true },
          },
          user: {
            include: {
              bridgeConnection: true,
            },
          },
        },
      }),
      DB_TIMEOUT_MS,
      'Database query timed out'
    );

    // Convert registry tools to MCP format
    const registryTools = collection?.tools.map((ct) => convertToMcpTool(ct.tool)) ?? [];

    // Convert bridge tools to MCP format
    const bridgeTools: ReturnType<typeof convertBridgeToolToMcp>[] = [];

    if (collection?.bridgeTools.length && collection.user.bridgeConnection) {
      const bridgeConnection = collection.user.bridgeConnection;
      const availableBridgeTools = (bridgeConnection.tools as unknown as BridgeTool[]) || [];

      // Only include bridge tools if bridge is connected
      if (bridgeConnection.status === 'connected') {
        for (const collectionBridgeTool of collection.bridgeTools) {
          // Find the tool definition from the bridge connection
          const bridgeTool = availableBridgeTools.find(
            (bt) =>
              bt.serverId === collectionBridgeTool.serverId &&
              bt.name === collectionBridgeTool.toolName
          );

          if (bridgeTool) {
            bridgeTools.push(convertBridgeToolToMcp(bridgeTool, collectionBridgeTool.displayName));
          }
        }
      }
    }

    // Convert custom MCP server tools to MCP format
    // Uses cached tool definitions so they appear even if the remote server is temporarily down
    const customTools: ReturnType<typeof convertCustomToolToMcp>[] = [];

    if (collection?.customTools.length) {
      for (const ct of collection.customTools) {
        if (ct.server.status !== 'synced') continue;

        const cachedTools = (ct.server.tools as unknown as CustomMcpTool[]) || [];
        const toolDef = cachedTools.find((t) => t.name === ct.toolName);

        if (toolDef) {
          customTools.push(
            convertCustomToolToMcp(
              { ...toolDef, serverId: ct.serverId, serverName: ct.server.name },
              ct.displayName
            )
          );
        }
      }
    }

    return {
      jsonrpc: '2.0',
      id: requestId,
      result: { tools: [...registryTools, ...bridgeTools, ...customTools] },
    };
  } catch (error) {
    console.error('[MCP tools/list] Error:', error);
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' },
    };
  }
}

interface ToolsCallParams {
  name: string;
  arguments?: Record<string, unknown>;
  env?: Record<string, string>; // Caller-provided env vars for non-owners
}

export interface TrackingContext {
  userId?: string;
  apiKeyId?: string;
  collectionId?: string;
  source: TrackExecutionParams['source'];
}

/**
 * Handle MCP tools/call request
 * @param callerEnvVars - Optional env vars from caller (non-owner accessing public collection)
 *                        When provided, these are used INSTEAD of collection's stored env vars
 * @param trackingCtx - Optional tracking context for execution event tracking
 * @param headerEnvVars - Optional env vars extracted from request headers (e.g. tpmjs-api-key → TPMJS_API_KEY)
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: MCP tool execution with env resolution, tracking, and error handling
export async function handleToolsCall(
  collectionId: string,
  params: ToolsCallParams,
  requestId: JsonRpcId,
  callerEnvVars?: Record<string, string>,
  trackingCtx?: TrackingContext,
  headerEnvVars?: Record<string, string>
): Promise<JsonRpcResponse> {
  try {
    const parsed = parseToolName(params.name);
    if (!parsed) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: { code: -32602, message: `Invalid tool name: ${params.name}` },
      };
    }

    // Handle custom MCP server tool calls
    if (parsed.type === 'custom') {
      return handleCustomToolCall(
        collectionId,
        parsed.serverId,
        parsed.toolName,
        params.arguments ?? {},
        requestId
      );
    }

    // Handle bridge tool calls
    if (parsed.type === 'bridge') {
      return handleBridgeToolCall(
        collectionId,
        parsed.serverId,
        parsed.toolName,
        params.arguments ?? {},
        requestId
      );
    }

    // Handle registry tool calls
    // Verify tool exists in collection and get executor config
    const collection = await withTimeout(
      prisma.collection.findUnique({
        where: { id: collectionId },
        select: {
          executorType: true,
          executorConfig: true,
          envVars: true,
          tools: {
            include: { tool: { include: { package: true } } },
          },
        },
      }),
      DB_TIMEOUT_MS,
      'Database query timed out'
    );

    // Try all possible package name and tool name combinations
    // This handles both old format (full package name) and new shortened format
    type CollectionTool = NonNullable<typeof collection>['tools'][number];
    let collectionTool: CollectionTool | undefined;

    for (const pkgName of parsed.possiblePackages) {
      for (const toolName of parsed.possibleToolNames) {
        collectionTool = collection?.tools.find(
          (ct) => ct.tool.package.npmPackageName === pkgName && ct.tool.name === toolName
        );
        if (collectionTool) break;
      }
      if (collectionTool) break;
    }

    if (!collectionTool) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: { code: -32602, message: `Tool not found in collection: ${params.name}` },
      };
    }

    // Get the actual package name and version that matched
    const actualPackageName = collectionTool.tool.package.npmPackageName;
    const actualVersion = collectionTool.tool.package.npmVersion;

    // When caller provides env vars (non-owner), validate required env vars
    if (callerEnvVars !== undefined) {
      const packageEnv = collectionTool.tool.package.env as TpmjsEnv[] | null;
      if (packageEnv && Array.isArray(packageEnv)) {
        const missingVars = packageEnv.filter(
          (env) => env.required !== false && !env.default && !callerEnvVars[env.name]
        );

        if (missingVars.length > 0) {
          return {
            jsonrpc: '2.0',
            id: requestId,
            error: {
              code: -32602,
              message: 'Missing required environment variables',
              data: {
                missingVars: missingVars.map((e) => ({
                  name: e.name,
                  description: e.description,
                })),
              },
            },
          };
        }
      }
    }

    // Resolve executor configuration (collection config only for MCP - no agent context)
    const executorConfig = parseExecutorConfig(
      collection?.executorType,
      collection?.executorConfig
    );

    // Execute via resolved executor
    // Use caller-provided env vars if given (non-owner), otherwise use collection's stored env vars
    // Merge in any env vars extracted from request headers (e.g. tpmjs-api-key → TPMJS_API_KEY)
    const effectiveEnvVars = {
      ...(callerEnvVars ?? (collection?.envVars as Record<string, string>) ?? {}),
      ...headerEnvVars,
    };
    // Pass explicit version to avoid Deno HTTP import cache issues with @latest
    // Use actual tool name from DB, not parsed name (which may have wrong suffix)
    const execStart = Date.now();
    const result = await executeWithExecutor(executorConfig, {
      packageName: actualPackageName,
      name: collectionTool.tool.name,
      version: actualVersion,
      params: params.arguments ?? {},
      env: Object.keys(effectiveEnvVars).length > 0 ? effectiveEnvVars : undefined,
    });
    const execDurationMs = Date.now() - execStart;

    // Track execution event (fire-and-forget)
    if (trackingCtx) {
      trackExecution({
        eventType: 'tool_call',
        source: trackingCtx.source,
        userId: trackingCtx.userId,
        apiKeyId: trackingCtx.apiKeyId,
        toolId: collectionTool.tool.id,
        collectionId: trackingCtx.collectionId ?? collectionId,
        toolName: collectionTool.tool.name,
        packageName: actualPackageName,
        status: result.success ? 'success' : 'error',
        durationMs: execDurationMs,
        errorMessage: result.success ? undefined : String(result.error),
        // ML training data
        inputArgs: params.arguments,
        outputSummary: result.success ? result.output : { error: result.error },
      });

      // Log user-facing activity (fire-and-forget)
      if (trackingCtx.userId) {
        logActivity({
          userId: trackingCtx.userId,
          type: 'TOOL_EXECUTED',
          targetName: collectionTool.tool.name,
          targetType: 'tool',
          toolId: collectionTool.tool.id,
          collectionId: trackingCtx.collectionId ?? collectionId,
          metadata: {
            source: trackingCtx.source,
            status: result.success ? 'success' : 'error',
            packageName: actualPackageName,
          },
        });
      }
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
    console.error('[MCP tools/call] Error:', error);
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' },
    };
  }
}

/**
 * Handle a bridge tool call by routing it through the user's bridge connection
 */
async function handleBridgeToolCall(
  collectionId: string,
  serverId: string,
  toolName: string,
  args: Record<string, unknown>,
  requestId: JsonRpcId
): Promise<JsonRpcResponse> {
  try {
    // Get the collection's owner and their bridge connection
    const collection = await withTimeout(
      prisma.collection.findUnique({
        where: { id: collectionId },
        include: {
          bridgeTools: {
            where: { serverId, toolName },
          },
          user: {
            include: { bridgeConnection: true },
          },
        },
      }),
      DB_TIMEOUT_MS,
      'Database query timed out'
    );

    if (!collection) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: { code: -32602, message: 'Collection not found' },
      };
    }

    // Verify the bridge tool exists in the collection
    const bridgeTool = collection.bridgeTools[0];
    if (!bridgeTool) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32602,
          message: `Bridge tool not found in collection: ${serverId}/${toolName}`,
        },
      };
    }

    // Verify the user has an active bridge connection
    const bridgeConnection = collection.user.bridgeConnection;
    if (!bridgeConnection || bridgeConnection.status !== 'connected') {
      return {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          content: [
            {
              type: 'text',
              text: 'Error: Bridge is not connected. Start the bridge CLI to use bridge tools.',
            },
          ],
          isError: true,
        },
      };
    }

    // Check if the bridge is stale (not seen in 2 minutes)
    if (bridgeConnection.lastSeen) {
      const staleThreshold = 2 * 60 * 1000; // 2 minutes
      if (Date.now() - bridgeConnection.lastSeen.getTime() > staleThreshold) {
        return {
          jsonrpc: '2.0',
          id: requestId,
          result: {
            content: [
              {
                type: 'text',
                text: 'Error: Bridge connection appears stale. Please check if the bridge CLI is running.',
              },
            ],
            isError: true,
          },
        };
      }
    }

    // Generate a unique call ID
    const callId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    // Queue the tool call for the bridge to pick up
    queueBridgeToolCall(collection.user.id, callId, serverId, toolName, args);

    // Wait for the result (with 5 minute timeout)
    const result = await waitForBridgeResult(callId, 300000);

    if (result.error) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          content: [{ type: 'text', text: `Error: ${result.error.message}` }],
          isError: true,
        },
      };
    }

    // Format the result
    const content = result.result as { content?: unknown[]; isError?: boolean } | undefined;
    if (content?.content) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          content: content.content,
          isError: content.isError,
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
              typeof result.result === 'string'
                ? result.result
                : JSON.stringify(result.result, null, 2),
          },
        ],
      },
    };
  } catch (error) {
    console.error('[MCP bridge tool call] Error:', error);
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' },
    };
  }
}

/**
 * Handle a custom MCP server tool call by proxying to the remote server
 */
async function handleCustomToolCall(
  collectionId: string,
  serverId: string,
  toolName: string,
  args: Record<string, unknown>,
  requestId: JsonRpcId
): Promise<JsonRpcResponse> {
  try {
    // Verify the custom tool exists in the collection and get server config
    const customTool = await withTimeout(
      prisma.collectionCustomTool.findFirst({
        where: {
          collectionId,
          serverId,
          toolName,
        },
        include: { server: true },
      }),
      DB_TIMEOUT_MS,
      'Database query timed out'
    );

    if (!customTool) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32602,
          message: `Custom tool not found in collection: ${serverId}/${toolName}`,
        },
      };
    }

    if (customTool.server.status !== 'synced') {
      return {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          content: [
            {
              type: 'text',
              text: `Error: Remote MCP server "${customTool.server.name}" is not synced (status: ${customTool.server.status}). Try re-syncing the server.`,
            },
          ],
          isError: true,
        },
      };
    }

    // Call the remote MCP server
    const result = await callRemoteTool(
      {
        url: customTool.server.url,
        authType: customTool.server.authType as 'bearer' | 'header' | null,
        authHeader: customTool.server.authHeader,
        authToken: customTool.server.authToken,
      },
      toolName,
      args
    );

    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        content: result.content,
        isError: result.isError,
      },
    };
  } catch (error) {
    console.error('[MCP custom tool call] Error:', error);
    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        content: [
          {
            type: 'text',
            text: `Error calling remote MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      },
    };
  }
}
