import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Default directory for file operations
const DEFAULT_DIR = path.join(os.homedir(), '.tpmjs', 'test-files');

// Ensure default directory exists
if (!fs.existsSync(DEFAULT_DIR)) {
  fs.mkdirSync(DEFAULT_DIR, { recursive: true });
}

const server = new Server(
  {
    name: 'test-file-writer',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'write_file',
        description: 'Write content to a file in the test directory',
        inputSchema: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Name of the file to write (will be created in ~/.tpmjs/test-files/)',
            },
            content: {
              type: 'string',
              description: 'Content to write to the file',
            },
          },
          required: ['filename', 'content'],
        },
      },
      {
        name: 'read_file',
        description: 'Read content from a file in the test directory',
        inputSchema: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Name of the file to read (from ~/.tpmjs/test-files/)',
            },
          },
          required: ['filename'],
        },
      },
      {
        name: 'list_files',
        description: 'List all files in the test directory',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'delete_file',
        description: 'Delete a file from the test directory',
        inputSchema: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Name of the file to delete (from ~/.tpmjs/test-files/)',
            },
          },
          required: ['filename'],
        },
      },
      {
        name: 'get_info',
        description: 'Get information about the test file writer MCP server',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'write_file': {
      const { filename, content } = args as { filename: string; content: string };
      const safeName = path.basename(filename); // Prevent path traversal
      const filePath = path.join(DEFAULT_DIR, safeName);

      fs.writeFileSync(filePath, content, 'utf-8');

      return {
        content: [
          {
            type: 'text',
            text: `Successfully wrote ${content.length} bytes to ${safeName}`,
          },
        ],
      };
    }

    case 'read_file': {
      const { filename } = args as { filename: string };
      const safeName = path.basename(filename);
      const filePath = path.join(DEFAULT_DIR, safeName);

      if (!fs.existsSync(filePath)) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: File '${safeName}' not found`,
            },
          ],
          isError: true,
        };
      }

      const content = fs.readFileSync(filePath, 'utf-8');

      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    }

    case 'list_files': {
      const files = fs.readdirSync(DEFAULT_DIR);

      if (files.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No files in test directory',
            },
          ],
        };
      }

      const fileInfos = files.map((file) => {
        const filePath = path.join(DEFAULT_DIR, file);
        const stats = fs.statSync(filePath);
        return `- ${file} (${stats.size} bytes, modified ${stats.mtime.toISOString()})`;
      });

      return {
        content: [
          {
            type: 'text',
            text: `Files in ${DEFAULT_DIR}:\n${fileInfos.join('\n')}`,
          },
        ],
      };
    }

    case 'delete_file': {
      const { filename } = args as { filename: string };
      const safeName = path.basename(filename);
      const filePath = path.join(DEFAULT_DIR, safeName);

      if (!fs.existsSync(filePath)) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: File '${safeName}' not found`,
            },
          ],
          isError: true,
        };
      }

      fs.unlinkSync(filePath);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully deleted ${safeName}`,
          },
        ],
      };
    }

    case 'get_info': {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                name: 'test-file-writer',
                version: '0.1.0',
                directory: DEFAULT_DIR,
                platform: process.platform,
                nodeVersion: process.version,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    default:
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Test File Writer MCP Server running on stdio');
}

main().catch(console.error);
