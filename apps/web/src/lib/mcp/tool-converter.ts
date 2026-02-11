import type { Package, Tool } from '@prisma/client';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/** Valid JSON Schema type values */
const VALID_TYPES = new Set(['string', 'number', 'integer', 'boolean', 'object', 'array', 'null']);

/**
 * Keywords that Claude's API does not support in tool input_schema.
 * These get stripped recursively from any schema before returning to clients.
 */
const UNSUPPORTED_KEYWORDS = new Set([
  // Numeric constraints
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  // String constraints
  'minLength',
  'maxLength',
  // Array constraints
  'maxItems',
  'uniqueItems',
  // Advanced schema features
  'patternProperties',
  'if',
  'then',
  'else',
  'dependentRequired',
  'dependentSchemas',
  'prefixItems',
  'unevaluatedProperties',
  'unevaluatedItems',
  'contentMediaType',
  'contentEncoding',
]);

/**
 * Sanitize a JSON Schema so it conforms to what Claude's API accepts
 * (JSON Schema draft 2020-12 subset). Strips unsupported keywords,
 * fixes array-style `type`, removes old `$schema` declarations, and
 * wraps top-level composition keywords in an object wrapper.
 */
export function sanitizeInputSchema(
  schema: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const fallback = { type: 'object' as const, properties: {} };
  if (!schema || typeof schema !== 'object') return fallback;

  try {
    const cleaned = sanitizeSchemaNode(structuredClone(schema), true);
    // Ensure root is always type: object
    if (!cleaned.type) cleaned.type = 'object';
    return cleaned;
  } catch {
    // If sanitization itself fails, return safe fallback
    return fallback;
  }
}

function isSchemaObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Recursively sanitize a child schema node */
function sanitizeChild(value: unknown): unknown {
  return isSchemaObject(value) ? sanitizeSchemaNode(value, false) : value;
}

/** Sanitize all values in an object-of-schemas (e.g. properties, $defs) */
function sanitizeObjectMap(map: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(map)) {
    if (isSchemaObject(value)) {
      map[key] = sanitizeSchemaNode(value, false);
    }
  }
}

/** Strip unsupported keywords and fix value-level issues */
function stripUnsupportedKeywords(node: Record<string, unknown>): void {
  delete node.$schema;
  for (const key of UNSUPPORTED_KEYWORDS) {
    delete node[key];
  }
  // minItems: only 0 and 1 are supported
  if (typeof node.minItems === 'number' && node.minItems > 1) {
    delete node.minItems;
  }
}

/** Normalize and validate the `type` field */
function normalizeType(node: Record<string, unknown>): void {
  if (Array.isArray(node.type)) {
    // Array-style type like ["string", "null"] → anyOf
    const types = (node.type as string[]).filter((t) => VALID_TYPES.has(t));
    if (types.length === 1) {
      node.type = types[0];
    } else if (types.length > 1) {
      delete node.type;
      node.anyOf = types.map((t) => ({ type: t }));
    } else {
      delete node.type;
    }
  } else if (typeof node.type === 'string' && !VALID_TYPES.has(node.type)) {
    // Invalid type like "string[]" or "'markdown' | 'mdx'" — remove it
    delete node.type;
  }
}

/** Fix conflicting type + oneOf/anyOf (e.g. type:"object" with oneOf:[{type:"string"}, ...]) */
function fixConflictingComposition(node: Record<string, unknown>): void {
  if (typeof node.type !== 'string') return;
  for (const keyword of ['oneOf', 'anyOf'] as const) {
    if (!Array.isArray(node[keyword])) continue;
    const variants = node[keyword] as Record<string, unknown>[];
    const hasConflict = variants.some(
      (v) => isSchemaObject(v) && typeof v.type === 'string' && v.type !== node.type
    );
    if (hasConflict) {
      // The composition keyword is more specific — drop the conflicting wrapper type
      delete node.type;
      // Also clean up empty properties/additionalProperties left from the wrapper
      if (
        isSchemaObject(node.properties) &&
        Object.keys(node.properties as Record<string, unknown>).length === 0
      ) {
        delete node.properties;
      }
      delete node.additionalProperties;
      break;
    }
  }
}

/** Remove external $ref URIs (keep internal refs like "#/$defs/Foo") */
function stripExternalRefs(node: Record<string, unknown>): void {
  if (typeof node.$ref === 'string' && /^https?:\/\//.test(node.$ref)) {
    delete node.$ref;
    if (!node.type) node.type = 'object';
  }
}

/** Recurse into all nested schema locations */
function sanitizeNestedSchemas(node: Record<string, unknown>): void {
  if (isSchemaObject(node.properties))
    sanitizeObjectMap(node.properties as Record<string, unknown>);
  if (isSchemaObject(node.items))
    node.items = sanitizeSchemaNode(node.items as Record<string, unknown>, false);
  if (isSchemaObject(node.additionalProperties)) {
    node.additionalProperties = sanitizeSchemaNode(
      node.additionalProperties as Record<string, unknown>,
      false
    );
  }
  for (const keyword of ['anyOf', 'oneOf', 'allOf'] as const) {
    if (Array.isArray(node[keyword])) {
      node[keyword] = (node[keyword] as unknown[]).map(sanitizeChild);
    }
  }
  for (const defsKey of ['$defs', 'definitions'] as const) {
    if (isSchemaObject(node[defsKey])) sanitizeObjectMap(node[defsKey] as Record<string, unknown>);
  }
}

function sanitizeSchemaNode(
  node: Record<string, unknown>,
  isRoot: boolean
): Record<string, unknown> {
  stripUnsupportedKeywords(node);
  normalizeType(node);
  fixConflictingComposition(node);

  // Claude rejects top-level oneOf/allOf/anyOf
  if (isRoot && !node.type && (node.oneOf || node.allOf || node.anyOf)) {
    return { type: 'object', properties: {} };
  }

  stripExternalRefs(node);
  sanitizeNestedSchemas(node);
  return node;
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
 * Sanitizes inputSchema to ensure it conforms to Claude's JSON Schema subset.
 */
export function convertToMcpTool(tool: Tool & { package: Package }): McpToolDefinition {
  return {
    name: sanitizeMcpName(tool.package.npmPackageName, tool.name),
    description: tool.description,
    inputSchema: sanitizeInputSchema(tool.inputSchema as Record<string, unknown>),
  };
}

/**
 * Custom MCP tool definition from a remote server's cached tools
 */
export interface CustomMcpTool {
  serverId: string;
  serverName: string;
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

/**
 * Create MCP name for a custom remote server tool
 * Example: clxyz123 + get_weather → custom--clxyz123--get_weather
 */
export function sanitizeCustomToolName(serverId: string, toolName: string): string {
  const sanitizedServer = serverId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const sanitizedTool = toolName.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `custom--${sanitizedServer}--${sanitizedTool}`;
}

/**
 * Convert a custom MCP tool definition to an MCP tool definition.
 * Sanitizes inputSchema to ensure it conforms to Claude's JSON Schema subset.
 */
export function convertCustomToolToMcp(
  tool: CustomMcpTool,
  displayName?: string | null
): McpToolDefinition {
  return {
    name: sanitizeCustomToolName(tool.serverId, tool.name),
    description: displayName
      ? `[${tool.serverName}] ${displayName}`
      : tool.description || `${tool.name} from ${tool.serverName}`,
    inputSchema: sanitizeInputSchema(tool.inputSchema),
  };
}

/**
 * Parsed tool name result - either a registry tool, bridge tool, or custom tool
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
  | { type: 'bridge'; serverId: string; toolName: string }
  | { type: 'custom'; serverId: string; toolName: string };

/**
 * Parse an MCP tool name back into its components.
 * Handles both registry tools and bridge tools.
 *
 * Registry: tpmjs-hello--helloWorldTool → { type: 'registry', packageName: "@tpmjs/hello", toolName: "helloWorldTool" }
 * Shortened: sprites-get--spritesGet → tries @tpmjs/tools-sprites-get, @tpmjs/sprites-get, sprites-get
 * Bridge: bridge--chrome-devtools--screenshot → { type: 'bridge', serverId: "chrome-devtools", toolName: "screenshot" }
 */
export function parseToolName(mcpName: string): ParsedToolName | null {
  // Check if it's a custom remote MCP server tool
  const customMatch = mcpName.match(/^custom--([^-]+(?:-[^-]+)*)--(.+)$/);
  if (customMatch?.[1] && customMatch[2]) {
    return {
      type: 'custom',
      serverId: customMatch[1],
      toolName: customMatch[2],
    };
  }

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
  const toolName = match[2];

  // Add back 'Tool' suffix if it was removed (try both with and without)
  // The handler will try to find the tool with both variants
  const toolNameWithSuffix = toolName.endsWith('Tool') ? toolName : `${toolName}Tool`;

  // Generate possible package names to try:
  // 1. @tpmjs/tools-{pkg} (shortened tpmjs-tools- prefix)
  // 2. @tpmjs/{pkg} (shortened tpmjs- prefix)
  // 3. All @{scope}/{name} splits (try every dash as the scope/name boundary)
  //    e.g. "perplexity-ai-ai-sdk" → @perplexity/ai-ai-sdk, @perplexity-ai/ai-sdk, @perplexity-ai-ai/sdk
  // 4. {pkg} as literal (non-scoped packages)
  const possiblePackages = [`@tpmjs/tools-${pkg}`, `@tpmjs/${pkg}`];

  // Try every dash position as the scope/name boundary for scoped packages
  const dashPositions = [...pkg.matchAll(/-/g)].map((m) => m.index);
  for (const pos of dashPositions) {
    possiblePackages.push(`@${pkg.slice(0, pos)}/${pkg.slice(pos + 1)}`);
  }

  possiblePackages.push(pkg);

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
 * Sanitizes inputSchema to ensure it conforms to Claude's JSON Schema subset.
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
    inputSchema: sanitizeInputSchema(tool.inputSchema),
  };
}
