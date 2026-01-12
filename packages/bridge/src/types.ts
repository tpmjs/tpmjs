import type { MCPServerConfig, MCPTool } from '@tpmjs/mcp-client';

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

/**
 * Message from bridge to TPMJS
 */
export type BridgeToServerMessage =
  | {
      type: 'register';
      tools: Array<{
        serverId: string;
        serverName: string;
        name: string;
        description?: string;
        inputSchema: MCPTool['inputSchema'];
      }>;
    }
  | {
      type: 'tool_result';
      callId: string;
      result: {
        content: Array<{
          type: string;
          text?: string;
          mimeType?: string;
          data?: string;
        }>;
        isError?: boolean;
      };
    }
  | {
      type: 'tool_error';
      callId: string;
      error: {
        code: string;
        message: string;
      };
    }
  | {
      type: 'heartbeat';
      timestamp: number;
    };

/**
 * Message from TPMJS to bridge
 */
export type ServerToBridgeMessage =
  | {
      type: 'tool_call';
      callId: string;
      serverId: string;
      toolName: string;
      args: Record<string, unknown>;
    }
  | {
      type: 'ping';
    }
  | {
      type: 'registered';
      toolCount: number;
    }
  | {
      type: 'error';
      message: string;
    };
