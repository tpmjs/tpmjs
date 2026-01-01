import { prisma } from '@tpmjs/db';
import { executePackage } from '@tpmjs/package-executor';

import { convertToMcpTool, parseToolName } from './tool-converter';

type JsonRpcId = string | number | null;

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string };
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
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      tools: {
        include: { tool: { include: { package: true } } },
        orderBy: { position: 'asc' },
      },
    },
  });

  const tools = collection?.tools.map((ct) => convertToMcpTool(ct.tool)) ?? [];

  return {
    jsonrpc: '2.0',
    id: requestId,
    result: { tools },
  };
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
  const parsed = parseToolName(params.name);
  if (!parsed) {
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: { code: -32602, message: `Invalid tool name: ${params.name}` },
    };
  }

  // Verify tool exists in collection
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      tools: {
        include: { tool: { include: { package: true } } },
      },
    },
  });

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

  // Execute via sandbox
  const result = await executePackage(parsed.packageName, parsed.toolName, params.arguments ?? {}, {
    timeout: 30000,
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
}
