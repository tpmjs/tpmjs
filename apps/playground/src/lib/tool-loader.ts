// Static imports for tools (required for Next.js/webpack)
import { helloNameTool, helloWorldTool } from '@tpmjs/hello';

/**
 * Tool registry mapping package names + export names to actual tool functions
 * This is a static mapping required for Next.js/webpack bundling
 */
const TOOL_REGISTRY: Record<string, Record<string, any>> = {
  '@tpmjs/hello': {
    helloWorldTool,
    helloNameTool,
  },
};

/**
 * Load a specific TPMJS tool by package name and export name
 * Uses static imports to work with Next.js/webpack bundling
 */
// biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex and using any is appropriate here
export async function loadTpmjsTool(packageName: string, exportName: string): Promise<any | null> {
  try {
    // Look up the package in the registry
    const packageTools = TOOL_REGISTRY[packageName];
    if (!packageTools) {
      console.warn(`Package not found in registry: ${packageName}`);
      return null;
    }

    // Look up the specific tool export
    const tool = packageTools[exportName];
    if (!tool) {
      console.warn(
        `Export '${exportName}' not found in package ${packageName}. Available exports:`,
        Object.keys(packageTools)
      );
      return null;
    }

    return tool;
  } catch (error) {
    console.error(`Failed to load tool ${packageName}/${exportName}:`, error);
    return null;
  }
}

/**
 * Type guard to check if an object is a valid AI SDK tool
 */
// biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex and using any is appropriate here
function isCoreTool(obj: unknown): obj is Record<string, any> {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const tool = obj as Record<string, unknown>;

  // Check for required AI SDK tool properties
  return (
    typeof tool.description === 'string' &&
    typeof tool.parameters === 'object' &&
    typeof tool.execute === 'function'
  );
}

/**
 * Sanitize tool name to match OpenAI's requirements
 * Pattern: ^[a-zA-Z0-9_-]+$ (only letters, numbers, underscores, hyphens)
 */
export function sanitizeToolName(name: string): string {
  return name
    .replace(/@/g, '') // Remove @ symbols
    .replace(/\//g, '_') // Replace / with _
    .replace(/[^a-zA-Z0-9_-]/g, '_'); // Replace any other invalid chars with _
}

/**
 * Load all installed TPMJS tools
 * Returns a flat object with all tools keyed by sanitized packageName-exportName
 */
// biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex and using any is appropriate here
export async function loadAllTools(): Promise<Record<string, any>> {
  // biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex and using any is appropriate here
  const tools: Record<string, any> = {};

  // Iterate through all registered packages
  for (const [packageName, packageTools] of Object.entries(TOOL_REGISTRY)) {
    for (const [exportName, tool] of Object.entries(packageTools)) {
      // Create a unique, sanitized key for this tool
      const toolKey = sanitizeToolName(`${packageName}-${exportName}`);
      tools[toolKey] = tool;
    }
  }

  return tools;
}

/**
 * Get list of all available package names
 */
export function getAvailablePackages(): string[] {
  return Object.keys(TOOL_REGISTRY);
}

/**
 * Get list of all export names for a given package
 */
export function getPackageExports(packageName: string): string[] {
  const packageTools = TOOL_REGISTRY[packageName];
  if (!packageTools) {
    return [];
  }
  return Object.keys(packageTools);
}
