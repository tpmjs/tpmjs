import type { Package, Tool } from '@prisma/client';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Sanitize package name and tool name into a valid MCP tool name.
 * MCP tool names must match ^[a-zA-Z0-9_-]+
 *
 * Example: @tpmjs/hello + helloWorldTool → tpmjs-hello--helloWorldTool
 */
export function sanitizeMcpName(packageName: string, toolName: string): string {
  const sanitizedPkg = packageName.replace(/^@/, '').replace(/\//g, '-');
  return `${sanitizedPkg}--${toolName}`;
}

/**
 * Convert a TPMJS Tool to an MCP tool definition.
 */
export function convertToMcpTool(tool: Tool & { package: Package }): McpToolDefinition {
  return {
    name: sanitizeMcpName(tool.package.npmPackageName, tool.name),
    description: tool.description,
    inputSchema: (tool.inputSchema as Record<string, unknown>) ?? {
      type: 'object',
      properties: {},
    },
  };
}

/**
 * Parse an MCP tool name back into package name and tool name.
 * Returns null if the name doesn't match the expected format.
 *
 * Example: tpmjs-hello--helloWorldTool → { packageName: "@tpmjs/hello", toolName: "helloWorldTool" }
 */
export function parseToolName(mcpName: string): { packageName: string; toolName: string } | null {
  const match = mcpName.match(/^(.+)--(.+)$/);
  if (!match || !match[1] || !match[2]) return null;

  const pkg = match[1];
  const toolName = match[2];

  // Reconstruct @scope/name format if it looks scoped
  // tpmjs-hello → @tpmjs/hello (first dash becomes @scope/)
  const packageName = pkg.includes('-') ? `@${pkg.replace('-', '/')}` : pkg;

  return { packageName, toolName };
}
