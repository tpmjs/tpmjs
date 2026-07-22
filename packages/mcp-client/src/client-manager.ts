import type { MCPClientTransport } from './connection.js';
import { closeMCPConnection, openMCPConnection } from './connection.js';
import type {
  ConnectedServer,
  MCPClientStatus,
  MCPConnectOptions,
  MCPServerConfig,
  MCPTool,
  MCPToolResult,
  MCPTransportType,
} from './types.js';

interface ManagedClient {
  config: MCPServerConfig;
  client: Awaited<ReturnType<typeof openMCPConnection>>['client'];
  transport: MCPClientTransport;
  transportType: MCPTransportType;
  status: MCPClientStatus;
  tools: MCPTool[];
  error?: string;
}

/**
 * Manages connections to multiple MCP servers
 */
export class MCPClientManager {
  private clients: Map<string, ManagedClient> = new Map();
  private onStatusChange?: (serverId: string, status: MCPClientStatus, error?: string) => void;

  constructor(options?: {
    onStatusChange?: (serverId: string, status: MCPClientStatus, error?: string) => void;
  }) {
    this.onStatusChange = options?.onStatusChange;
  }

  /**
   * Connect to an MCP server
   */
  async connect(config: MCPServerConfig, options: MCPConnectOptions = {}): Promise<MCPTool[]> {
    // Disconnect existing connection if any
    if (this.clients.has(config.id)) {
      await this.disconnect(config.id);
    }

    this.updateStatus(config.id, 'connecting');

    let connection: Awaited<ReturnType<typeof openMCPConnection>> | undefined;

    try {
      connection = await openMCPConnection(config);
      const tools: MCPTool[] = [];

      if (options.discoverTools !== false) {
        const toolsResult = await connection.client.listTools();
        tools.push(
          ...toolsResult.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema as MCPTool['inputSchema'],
          }))
        );
      }

      this.clients.set(config.id, {
        config,
        client: connection.client,
        transport: connection.transport,
        transportType: connection.transportType,
        status: 'connected',
        tools,
      });

      this.updateStatus(config.id, 'connected');
      return tools;
    } catch (error) {
      if (connection) {
        await closeMCPConnection(connection).catch(() => {});
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateStatus(config.id, 'error', errorMessage);
      throw error;
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverId: string): Promise<void> {
    const managed = this.clients.get(serverId);
    if (!managed) return;

    try {
      await closeMCPConnection({
        client: managed.client,
        transport: managed.transport,
        transportType: managed.transportType,
      });
    } catch {
      // Ignore close errors
    }

    this.clients.delete(serverId);
    this.updateStatus(serverId, 'disconnected');
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    const ids = Array.from(this.clients.keys());
    await Promise.all(ids.map((id) => this.disconnect(id)));
  }

  /**
   * List tools from a specific server
   */
  listTools(serverId: string): MCPTool[] {
    const managed = this.clients.get(serverId);
    if (!managed) {
      throw new Error(`Server ${serverId} not connected`);
    }
    return managed.tools;
  }

  /**
   * List all tools from all connected servers
   */
  listAllTools(): Array<{ serverId: string; serverName: string; tool: MCPTool }> {
    const allTools: Array<{ serverId: string; serverName: string; tool: MCPTool }> = [];

    for (const [serverId, managed] of this.clients) {
      if (managed.status === 'connected') {
        for (const tool of managed.tools) {
          allTools.push({
            serverId,
            serverName: managed.config.name,
            tool,
          });
        }
      }
    }

    return allTools;
  }

  /**
   * Call a tool on a specific server
   */
  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const managed = this.clients.get(serverId);
    if (!managed) {
      throw new Error(`Server ${serverId} not connected`);
    }

    if (managed.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected (status: ${managed.status})`);
    }

    const result = await managed.client.callTool({
      name: toolName,
      arguments: args,
    });

    return {
      content: result.content as MCPToolResult['content'],
      isError: result.isError === true,
    };
  }

  /**
   * Get status of all servers
   */
  getServers(): ConnectedServer[] {
    return Array.from(this.clients.values()).map((managed) => ({
      id: managed.config.id,
      name: managed.config.name,
      transport: managed.transportType,
      status: managed.status,
      tools: managed.tools,
      error: managed.error,
    }));
  }

  /**
   * Get status of a specific server
   */
  getServer(serverId: string): ConnectedServer | undefined {
    const managed = this.clients.get(serverId);
    if (!managed) return undefined;

    return {
      id: managed.config.id,
      name: managed.config.name,
      transport: managed.transportType,
      status: managed.status,
      tools: managed.tools,
      error: managed.error,
    };
  }

  /**
   * Check if a server is connected
   */
  isConnected(serverId: string): boolean {
    const managed = this.clients.get(serverId);
    return managed?.status === 'connected';
  }

  private updateStatus(serverId: string, status: MCPClientStatus, error?: string): void {
    const managed = this.clients.get(serverId);
    if (managed) {
      managed.status = status;
      managed.error = error;
    }
    this.onStatusChange?.(serverId, status, error);
  }
}
