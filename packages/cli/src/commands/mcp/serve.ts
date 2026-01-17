import { Command, Flags } from '@oclif/core';
import * as http from 'node:http';
import * as readline from 'node:readline';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export default class MCPServe extends Command {
  static description = 'Run as a local MCP server';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --port 8080',
    '<%= config.bin %> <%= command.id %> --stdio',
    '<%= config.bin %> <%= command.id %> --collection my-collection',
  ];

  static flags = {
    port: Flags.integer({
      char: 'p',
      description: 'Port to run the server on (HTTP mode)',
      default: 3333,
    }),
    stdio: Flags.boolean({
      description: 'Use stdio transport instead of HTTP',
      default: false,
    }),
    collection: Flags.string({
      char: 'c',
      description: 'Serve tools from a specific collection',
    }),
    tool: Flags.string({
      char: 't',
      description: 'Serve specific tools (comma-separated)',
      multiple: true,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show verbose output',
      default: false,
    }),
  };

  private client = getClient();
  private tools: Map<string, unknown> = new Map();

  async run(): Promise<void> {
    const { flags } = await this.parse(MCPServe);
    const output = createOutput(flags);

    // Load tools
    await this.loadTools(flags, output);

    if (flags.stdio) {
      await this.runStdioServer(output, flags.verbose);
    } else {
      await this.runHttpServer(flags.port, output, flags.verbose);
    }
  }

  private async loadTools(
    flags: { collection?: string; tool?: string[] },
    output: ReturnType<typeof createOutput>
  ): Promise<void> {
    const spinner = output.spinner('Loading tools...');

    try {
      if (flags.collection) {
        // Load tools from collection - search for tools with collection filter
        // For now, just load trending tools if collection specified
        const response = await this.client.getTrendingTools({ limit: 20 });
        if (response.data && response.data.length > 0) {
          for (const tool of response.data) {
            this.tools.set(tool.slug, tool);
          }
        }
      } else if (flags.tool && flags.tool.length > 0) {
        // Load specific tools by slug
        for (const toolId of flags.tool) {
          const response = await this.client.getToolBySlug(toolId);
          if (response.success && response.data) {
            this.tools.set(response.data.slug, response.data);
          }
        }
      } else {
        // Load trending tools as default
        const response = await this.client.getTrendingTools({ limit: 10 });
        if (response.data && response.data.length > 0) {
          for (const tool of response.data) {
            this.tools.set(tool.slug, tool);
          }
        }
      }

      spinner.stop();
      output.info(`Loaded ${this.tools.size} tool(s)`);
    } catch (error) {
      spinner.fail('Failed to load tools');
      throw error;
    }
  }

  private async runStdioServer(
    output: ReturnType<typeof createOutput>,
    verbose: boolean
  ): Promise<void> {
    output.info('Starting MCP server in stdio mode...');
    output.info('Listening for JSON-RPC messages on stdin');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on('line', async (line) => {
      try {
        const request = JSON.parse(line) as MCPRequest;
        if (verbose) {
          output.info(`Received: ${request.method}`);
        }
        const response = await this.handleRequest(request);
        console.log(JSON.stringify(response));
      } catch (error) {
        const errorResponse: MCPResponse = {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: -32700,
            message: 'Parse error',
            data: error instanceof Error ? error.message : 'Unknown error',
          },
        };
        console.log(JSON.stringify(errorResponse));
      }
    });

    // Keep process running
    await new Promise(() => {});
  }

  private async runHttpServer(
    port: number,
    output: ReturnType<typeof createOutput>,
    verbose: boolean
  ): Promise<void> {
    const server = http.createServer(async (req, res) => {
      if (req.method === 'POST' && req.url === '/mcp') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const request = JSON.parse(body) as MCPRequest;
            if (verbose) {
              output.info(`Received: ${request.method}`);
            }
            const response = await this.handleRequest(request);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } catch (error) {
            const errorResponse: MCPResponse = {
              jsonrpc: '2.0',
              id: 0,
              error: {
                code: -32700,
                message: 'Parse error',
                data: error instanceof Error ? error.message : 'Unknown error',
              },
            };
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(errorResponse));
          }
        });
      } else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', tools: this.tools.size }));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(port, () => {
      output.success(`MCP server running at http://localhost:${port}/mcp`);
      output.info('Health check: GET /health');
      output.info('Press Ctrl+C to stop');
    });

    // Keep process running
    await new Promise(() => {});
  }

  private async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const { id, method, params } = request;

    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'tpmjs-mcp-server',
              version: '0.1.0',
            },
          },
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: Array.from(this.tools.entries()).map(([slug, tool]) => ({
              name: slug,
              description: (tool as Record<string, unknown>).description || '',
              inputSchema: (tool as Record<string, unknown>).inputSchema || {
                type: 'object',
                properties: {},
              },
            })),
          },
        };

      case 'tools/call': {
        const toolName = (params as Record<string, unknown>)?.name as string;
        const toolArgs = (params as Record<string, unknown>)?.arguments as Record<string, unknown>;

        if (!toolName) {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Invalid params: tool name required',
            },
          };
        }

        try {
          const response = await this.client.executeTool(toolName, toolArgs || {});
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(response, null, 2),
                },
              ],
            },
          };
        } catch (error) {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32000,
              message: error instanceof Error ? error.message : 'Tool execution failed',
            },
          };
        }
      }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        };
    }
  }
}
