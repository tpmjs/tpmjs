import type { Package, Tool } from '@prisma/client';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Bridge tool definition from the BridgeConnection.tools JSON
 */
export interface BridgeTool {
  serverId: string;
  serverName: string;
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
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
 * Create MCP name for a bridge tool
 * Example: chrome-devtools + screenshot → bridge--chrome-devtools--screenshot
 */
export function sanitizeBridgeToolName(serverId: string, toolName: string): string {
  // Sanitize serverId and toolName to only allow valid MCP characters
  const sanitizedServer = serverId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const sanitizedTool = toolName.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `bridge--${sanitizedServer}--${sanitizedTool}`;
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
 * Parsed tool name result - either a registry tool or a bridge tool
 */
export type ParsedToolName =
  | { type: 'registry'; packageName: string; toolName: string }
  | { type: 'bridge'; serverId: string; toolName: string };

/**
 * Parse an MCP tool name back into its components.
 * Handles both registry tools and bridge tools.
 *
 * Registry: tpmjs-hello--helloWorldTool → { type: 'registry', packageName: "@tpmjs/hello", toolName: "helloWorldTool" }
 * Bridge: bridge--chrome-devtools--screenshot → { type: 'bridge', serverId: "chrome-devtools", toolName: "screenshot" }
 */
export function parseToolName(mcpName: string): ParsedToolName | null {
  // Check if it's a bridge tool
  const bridgeMatch = mcpName.match(/^bridge--([^-]+(?:-[^-]+)*)--(.+)$/);
  if (bridgeMatch && bridgeMatch[1] && bridgeMatch[2]) {
    return {
      type: 'bridge',
      serverId: bridgeMatch[1],
      toolName: bridgeMatch[2],
    };
  }

  // Otherwise parse as registry tool
  const match = mcpName.match(/^(.+)--(.+)$/);
  if (!match || !match[1] || !match[2]) return null;

  const pkg = match[1];
  const toolName = match[2];

  // Reconstruct @scope/name format if it looks scoped
  // tpmjs-hello → @tpmjs/hello (first dash becomes @scope/)
  const packageName = pkg.includes('-') ? `@${pkg.replace('-', '/')}` : pkg;

  return { type: 'registry', packageName, toolName };
}

/**
 * Convert a bridge tool definition to an MCP tool definition.
 */
export function convertBridgeToolToMcp(
  tool: BridgeTool,
  displayName?: string | null
): McpToolDefinition {
  return {
    name: sanitizeBridgeToolName(tool.serverId, tool.name),
    description: displayName
      ? `[${tool.serverName}] ${displayName}`
      : tool.description || `${tool.name} from ${tool.serverName}`,
    inputSchema: tool.inputSchema ?? {
      type: 'object',
      properties: {},
    },
  };
}
