import type { MCPServerConfig, MCPTool, MCPToolResult } from '@tpmjs/mcp-client';

/**
 * Bridge configuration file structure
 */
export interface BridgeConfig {
  /** MCP servers to connect to */
  servers: MCPServerConfig[];
}

/**
 * Credentials file structure
 */
export interface BridgeCredentials {
  /** TPMJS API key */
  apiKey: string;
  /** User ID */
  userId?: string;
  /** User email */
  email?: string;
}

/** A tool exposed by one of the bridge's configured MCP servers. */
export interface BridgeToolDefinition {
  serverId: string;
  serverName: string;
  name: string;
  description?: string;
  inputSchema: MCPTool['inputSchema'];
}

/** A tool invocation returned by the TPMJS bridge polling endpoint. */
export interface BridgeToolCall {
  callId: string;
  serverId: string;
  toolName: string;
  args: Record<string, unknown>;
  timestamp: number;
}

/** A structured tool-call failure returned to TPMJS. */
export interface BridgeToolError {
  code: string;
  message: string;
}

/** HTTP POST payloads accepted by `/api/bridge`. */
export type BridgePostRequest =
  | {
      type: 'register';
      tools: BridgeToolDefinition[];
      clientVersion: string;
      clientOS: string;
    }
  | {
      type: 'tool_result';
      callId: string;
      result: MCPToolResult;
      error?: never;
    }
  | {
      type: 'tool_result';
      callId: string;
      result?: never;
      error: BridgeToolError;
    }
  | {
      type: 'heartbeat';
    };

/** HTTP GET response returned while polling `/api/bridge`. */
export interface BridgePollResponse {
  success: true;
  calls: BridgeToolCall[];
}

/** Successful HTTP response returned by bridge POST and DELETE requests. */
export interface BridgeSuccessResponse {
  success: true;
  message?: string;
}

/** Error response returned by the bridge API. */
export interface BridgeErrorResponse {
  error: string;
}

/** @deprecated Use {@link BridgePostRequest}; the bridge uses HTTP polling, not a socket. */
export type BridgeToServerMessage = BridgePostRequest;

/** @deprecated Use the specific HTTP response type for the request being made. */
export type ServerToBridgeMessage =
  | BridgePollResponse
  | BridgeSuccessResponse
  | BridgeErrorResponse;
