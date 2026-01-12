import { prisma } from '@tpmjs/db';
import { queueBridgeToolCall, waitForBridgeResult } from '~/app/api/bridge/route';
import { executeWithExecutor, parseExecutorConfig } from '../executors';
import {
  type BridgeTool,
  convertBridgeToolToMcp,
  convertToMcpTool,
  parseToolName,
} from './tool-converter';

const DB_TIMEOUT_MS = 10000; // 10 second timeout for database queries

type JsonRpcId = string | number | null;

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string };
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

    return {
      jsonrpc: '2.0',
      id: requestId,
      result: { tools: [...registryTools, ...bridgeTools] },
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
}

/**
 * Handle MCP tools/call request
 */
export async function handleToolsCall(
  collectionId: string,
  params: ToolsCallParams,
  requestId: JsonRpcId
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
          tools: {
            include: { tool: { include: { package: true } } },
          },
        },
      }),
      DB_TIMEOUT_MS,
      'Database query timed out'
    );

    const collectionTool = collection?.tools.find(
      (ct) =>
        ct.tool.package.npmPackageName === parsed.packageName && ct.tool.name === parsed.toolName
    );

    if (!collectionTool) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: { code: -32602, message: `Tool not found in collection: ${params.name}` },
      };
    }

    // Resolve executor configuration (collection config only for MCP - no agent context)
    const executorConfig = parseExecutorConfig(
      collection?.executorType,
      collection?.executorConfig
    );

    // Execute via resolved executor
    const result = await executeWithExecutor(executorConfig, {
      packageName: parsed.packageName,
      name: parsed.toolName,
      params: params.arguments ?? {},
    });

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
