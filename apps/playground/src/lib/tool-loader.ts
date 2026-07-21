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
