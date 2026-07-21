// Static imports for tools (required for Next.js/webpack)
import { helloNameTool, helloWorldTool } from '@tpmjs/hello';
import type { Tool } from 'ai';

type RuntimeTool = Tool;
type RuntimeToolSet = Record<string, RuntimeTool>;

function isRuntimeTool(value: unknown): value is RuntimeTool {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return 'inputSchema' in candidate && typeof candidate.execute === 'function';
}

/**
 * Tool registry mapping package names + export names to actual tool functions
 * This is a static mapping required for Next.js/webpack bundling
 */
const TOOL_REGISTRY: Record<string, Record<string, unknown>> = {
  '@tpmjs/hello': {
    helloWorldTool,
    helloNameTool,
  },
};

/**
 * Load a specific TPMJS tool by package name and export name
 * Uses static imports to work with Next.js/webpack bundling
 */
export async function loadTpmjsTool(
  packageName: string,
  name: string
): Promise<RuntimeTool | null> {
  try {
    // Look up the package in the registry
    const packageTools = TOOL_REGISTRY[packageName];
    if (!packageTools) {
      console.warn(`Package not found in registry: ${packageName}`);
      return null;
    }

    // Look up the specific tool export
    const candidate = packageTools[name];
    if (!candidate) {
      console.warn(
        `Export '${name}' not found in package ${packageName}. Available exports:`,
        Object.keys(packageTools)
      );
      return null;
    }

    if (!isRuntimeTool(candidate)) {
      console.warn(`Export '${name}' from ${packageName} is not an executable AI SDK tool.`);
      return null;
    }

    return candidate;
  } catch (error) {
    console.error(`Failed to load tool ${packageName}/${name}:`, error);
    return null;
  }
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
 * Returns a flat object with all tools keyed by sanitized packageName-name
 */
export async function loadAllTools(): Promise<RuntimeToolSet> {
  const tools: RuntimeToolSet = {};

  // Iterate through all registered packages
  for (const [packageName, packageTools] of Object.entries(TOOL_REGISTRY)) {
    for (const [name, candidate] of Object.entries(packageTools)) {
      if (!isRuntimeTool(candidate)) {
        console.warn(`Skipping non-tool export '${name}' from ${packageName}.`);
        continue;
      }

      // Create a unique, sanitized key for this tool
      const toolKey = sanitizeToolName(`${packageName}-${name}`);
      tools[toolKey] = candidate;
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
