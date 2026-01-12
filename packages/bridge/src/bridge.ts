import type { MCPServerConfig } from '@tpmjs/mcp-client';
import { MCPClientManager } from '@tpmjs/mcp-client';
import pc from 'picocolors';

interface BridgeToolCall {
  callId: string;
  serverId: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface BridgeOptions {
  /** TPMJS API key */
  apiKey: string;
  /** TPMJS API URL */
  apiUrl?: string;
  /** MCP servers to connect to */
  servers: MCPServerConfig[];
  /** Poll interval in ms */
  pollInterval?: number;
  /** Heartbeat interval in ms */
  heartbeatInterval?: number;
  /** Verbose logging */
  verbose?: boolean;
}

export class Bridge {
  private mcpManager: MCPClientManager;
  private options: Required<BridgeOptions>;
  private isRunning = false;
  private pollTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: BridgeOptions) {
    this.options = {
      apiUrl: 'https://tpmjs.com',
      pollInterval: 1000, // Poll every 1 second
      heartbeatInterval: 30000, // Heartbeat every 30 seconds
      verbose: false,
      ...options,
    };

    this.mcpManager = new MCPClientManager({
      onStatusChange: (serverId, status, error) => {
        if (this.options.verbose) {
          if (status === 'connected') {
            this.log(`  ${pc.green('✓')} ${serverId} connected`);
          } else if (status === 'error') {
            this.log(`  ${pc.red('✗')} ${serverId} error: ${error}`);
          }
        }
      },
    });
  }

  /**
   * Start the bridge
   */
  async start(): Promise<void> {
    this.isRunning = true;

    this.log(pc.bold('Starting TPMJS Bridge...\n'));

    // 1. Connect to all local MCP servers
    this.log('Connecting to MCP servers:');
    for (const server of this.options.servers) {
      try {
        this.log(`  Starting ${pc.cyan(server.name)}...`);
        const tools = await this.mcpManager.connect(server);
        this.log(`  ${pc.green('✓')} ${server.name}: ${tools.length} tools`);
        if (this.options.verbose) {
          for (const tool of tools) {
            this.log(`    - ${tool.name}`);
          }
        }
      } catch (error) {
        this.log(`  ${pc.red('✗')} ${server.name}: ${(error as Error).message}`);
      }
    }

    // 2. Register with TPMJS
    this.log('\nConnecting to TPMJS...');
    await this.registerTools();

    // 3. Start polling for tool calls
    this.startPolling();
    this.startHeartbeat();
  }

  /**
   * Stop the bridge
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    this.log('\nShutting down...');

    // Clear timers
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    // Notify TPMJS we're disconnecting
    try {
      await fetch(`${this.options.apiUrl}/api/bridge`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
      });
    } catch {
      // Ignore disconnect errors
    }

    // Disconnect all MCP servers
    await this.mcpManager.disconnectAll();

    this.log('Bridge stopped');
  }

  private async registerTools(): Promise<void> {
    const allTools = this.mcpManager.listAllTools();

    const response = await fetch(`${this.options.apiUrl}/api/bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({
        type: 'register',
        tools: allTools.map(({ serverId, serverName, tool }) => ({
          serverId,
          serverName,
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
        clientVersion: '0.1.0',
        clientOS: process.platform,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to register: ${error}`);
    }

    this.log(`${pc.green('✓')} Connected to TPMJS`);
    this.log(`Registered ${allTools.length} tools`);
  }

  private startPolling(): void {
    const poll = async () => {
      if (!this.isRunning) return;

      try {
        const response = await fetch(`${this.options.apiUrl}/api/bridge`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.options.apiKey}`,
          },
        });

        if (response.ok) {
          const data = (await response.json()) as { calls?: BridgeToolCall[] };
          const calls = data.calls || [];

          // Process each tool call
          for (const call of calls) {
            await this.handleToolCall(call);
          }
        }
      } catch (error) {
        if (this.options.verbose) {
          this.log(`${pc.yellow('!')} Poll error: ${(error as Error).message}`);
        }
      }

      // Schedule next poll
      if (this.isRunning) {
        this.pollTimeout = setTimeout(poll, this.options.pollInterval);
      }
    };

    poll();
  }

  private startHeartbeat(): void {
    const heartbeat = async () => {
      if (!this.isRunning) return;

      try {
        await fetch(`${this.options.apiUrl}/api/bridge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.options.apiKey}`,
          },
          body: JSON.stringify({ type: 'heartbeat' }),
        });
      } catch {
        // Ignore heartbeat errors
      }

      if (this.isRunning) {
        this.heartbeatTimeout = setTimeout(heartbeat, this.options.heartbeatInterval);
      }
    };

    this.heartbeatTimeout = setTimeout(heartbeat, this.options.heartbeatInterval);
  }

  private async handleToolCall(call: BridgeToolCall): Promise<void> {
    const { callId, serverId, toolName, args } = call;

    if (this.options.verbose) {
      this.log(`Tool call: ${serverId}/${toolName}`);
    }

    try {
      const result = await this.mcpManager.callTool(serverId, toolName, args);

      await fetch(`${this.options.apiUrl}/api/bridge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify({
          type: 'tool_result',
          callId,
          result: {
            content: result.content,
            isError: result.isError,
          },
        }),
      });

      if (this.options.verbose) {
        this.log(`  ${pc.green('✓')} Result sent`);
      }
    } catch (error) {
      await fetch(`${this.options.apiUrl}/api/bridge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify({
          type: 'tool_result',
          callId,
          error: {
            code: 'EXECUTION_FAILED',
            message: (error as Error).message,
          },
        }),
      });

      if (this.options.verbose) {
        this.log(`  ${pc.red('✗')} Error: ${(error as Error).message}`);
      }
    }
  }

  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${pc.dim(`[${timestamp}]`)} ${message}`);
  }
}
