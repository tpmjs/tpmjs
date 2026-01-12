/**
 * Configuration for an MCP server connection
 */
export interface MCPServerConfig {
  /** Unique identifier for this server */
  id: string;
  /** Display name for the server */
  name: string;
  /** Transport type */
  transport: 'stdio';
  /** Command to run the MCP server */
  command: string;
  /** Arguments to pass to the command */
  args?: string[];
  /** Environment variables to set */
  env?: Record<string, string>;
}

/**
 * MCP tool definition
 */
export interface MCPTool {
  /** Tool name */
  name: string;
  /** Tool description */
  description?: string;
  /** JSON Schema for input parameters */
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
}

/**
 * Result from an MCP tool call
 */
export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    mimeType?: string;
    data?: string;
    [key: string]: unknown;
  }>;
  isError?: boolean;
}

/**
 * Status of an MCP client connection
 */
export type MCPClientStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Information about a connected server
 */
export interface ConnectedServer {
  id: string;
  name: string;
  status: MCPClientStatus;
  tools: MCPTool[];
  error?: string;
}
