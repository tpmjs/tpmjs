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
 * MCP tool names must match ^[a-zA-Z0-9_-]+ and be at most 64 characters.
 *
 * Example: @tpmjs/hello + helloWorldTool → tpmjs-hello--helloWorldTool
 * Example: @tpmjs/tools-sprites-foo + spritesBarTool → sprites-foo--spritesBar
 */
export function sanitizeMcpName(packageName: string, toolName: string): string {
  // Remove @ and convert / to -
  let sanitizedPkg = packageName.replace(/^@/, '').replace(/\//g, '-');

  // Remove common prefixes to shorten
  sanitizedPkg = sanitizedPkg.replace(/^tpmjs-tools-/, '');
  sanitizedPkg = sanitizedPkg.replace(/^tpmjs-/, '');

  // Remove 'Tool' suffix from tool name
  const sanitizedTool = toolName.replace(/Tool$/, '');

  const fullName = `${sanitizedPkg}--${sanitizedTool}`;

  // Ensure we stay under 64 character limit
  if (fullName.length <= 64) {
    return fullName;
  }

  // If still too long, truncate package name to fit
  const maxPkgLen = 64 - sanitizedTool.length - 2; // 2 for '--'
  if (maxPkgLen > 10) {
    return `${sanitizedPkg.slice(0, maxPkgLen)}--${sanitizedTool}`;
  }

  // Last resort: truncate both
  return fullName.slice(0, 64);
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
  | {
      type: 'registry';
      packageName: string;
      literalPackageName: string;
      toolName: string;
      possiblePackages: string[];
      possibleToolNames: string[];
    }
  | { type: 'bridge'; serverId: string; toolName: string };

/**
 * Parse an MCP tool name back into its components.
 * Handles both registry tools and bridge tools.
 *
 * Registry: tpmjs-hello--helloWorldTool → { type: 'registry', packageName: "@tpmjs/hello", toolName: "helloWorldTool" }
 * Shortened: sprites-get--spritesGet → tries @tpmjs/tools-sprites-get, @tpmjs/sprites-get, sprites-get
 * Bridge: bridge--chrome-devtools--screenshot → { type: 'bridge', serverId: "chrome-devtools", toolName: "screenshot" }
 */
export function parseToolName(mcpName: string): ParsedToolName | null {
  // Check if it's a bridge tool
  const bridgeMatch = mcpName.match(/^bridge--([^-]+(?:-[^-]+)*)--(.+)$/);
  if (bridgeMatch?.[1] && bridgeMatch[2]) {
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
  let toolName = match[2];

  // Add back 'Tool' suffix if it was removed (try both with and without)
  // The handler will try to find the tool with both variants
  const toolNameWithSuffix = toolName.endsWith('Tool') ? toolName : `${toolName}Tool`;

  // Generate possible package names to try:
  // 1. @tpmjs/tools-{pkg} (shortened tpmjs-tools- prefix)
  // 2. @tpmjs/{pkg} (shortened tpmjs- prefix)
  // 3. @{scope}/{name} (standard scoped, first dash becomes /)
  // 4. {pkg} as literal (non-scoped packages)
  const possiblePackages = [
    `@tpmjs/tools-${pkg}`,
    `@tpmjs/${pkg}`,
    pkg.includes('-') ? `@${pkg.replace('-', '/')}` : `@${pkg}`,
    pkg,
  ];

  // Return the first scoped interpretation as primary, with literal as fallback
  return {
    type: 'registry',
    packageName: possiblePackages[0]!, // @tpmjs/tools-{pkg}
    literalPackageName: pkg,
    toolName: toolNameWithSuffix,
    // Additional candidates for the handler to try
    possiblePackages,
    possibleToolNames: [toolNameWithSuffix, toolName],
  } as ParsedToolName;
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
