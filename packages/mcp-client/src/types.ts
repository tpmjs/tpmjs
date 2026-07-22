interface MCPServerConfigBase {
  /** Unique identifier for this server */
  id: string;
  /** Display name for the server */
  name: string;
  /** Abort the MCP initialization handshake after this many milliseconds. */
  connectTimeoutMs?: number;
}

/** Configuration for a local, process-spawned MCP server. */
export interface MCPStdioServerConfig extends MCPServerConfigBase {
  transport: 'stdio';
  /** Command to run the MCP server */
  command: string;
  /** Arguments to pass to the command */
  args?: string[];
  /** Environment variables to set */
  env?: Record<string, string>;
}

interface MCPRemoteServerConfigBase extends MCPServerConfigBase {
  /** Absolute MCP endpoint URL. */
  url: string;
  /** Headers sent during initialization and subsequent MCP requests. */
  headers?: Record<string, string>;
}

/** Configuration for the recommended remote MCP transport. */
export interface MCPStreamableHTTPServerConfig extends MCPRemoteServerConfigBase {
  transport: 'streamable-http';
  /** Try the deprecated HTTP+SSE transport after a protocol-compatible 4xx response. */
  fallbackToSse?: boolean;
}

/** Configuration for a legacy remote HTTP+SSE MCP server. */
export interface MCPSSEServerConfig extends MCPRemoteServerConfigBase {
  transport: 'sse';
}

/** Configuration for any MCP server connection supported by the client. */
export type MCPServerConfig =
  | MCPStdioServerConfig
  | MCPStreamableHTTPServerConfig
  | MCPSSEServerConfig;

/** The transport actually negotiated for a live MCP connection. */
export type MCPTransportType = MCPServerConfig['transport'];

export interface MCPConnectOptions {
  /** Skip the initial tools/list request when the caller will invoke a known tool directly. */
  discoverTools?: boolean;
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
  /** The transport actually in use (including a legacy SSE fallback). */
  transport: MCPTransportType;
  status: MCPClientStatus;
  tools: MCPTool[];
  error?: string;
}
