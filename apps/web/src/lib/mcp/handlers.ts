import { prisma } from '@tpmjs/db';

import { executeWithExecutor, parseExecutorConfig } from '../executors';
import { convertToMcpTool, parseToolName } from './tool-converter';

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
        },
      }),
      DB_TIMEOUT_MS,
      'Database query timed out'
    );

    const tools = collection?.tools.map((ct) => convertToMcpTool(ct.tool)) ?? [];

    return {
      jsonrpc: '2.0',
      id: requestId,
      result: { tools },
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
