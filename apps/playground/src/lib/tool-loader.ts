// Static imports for tools (required for Next.js/webpack)
import { helloNameTool, helloWorldTool } from '@tpmjs/hello';
import { crawlTool, scrapeTool, searchTool } from 'firecrawl-aisdk';

/**
 * Load a specific TPMJS tool by package name
 */
// biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex and using any is appropriate here
export async function loadTpmjsTool(packageName: string): Promise<Record<string, any>> {
  try {
    // Map package names to their tool functions
    switch (packageName) {
      case '@tpmjs/hello':
        // Hello has multiple tools, return all of them
        return {
          helloWorld: helloWorldTool,
          helloName: helloNameTool,
        };

      case 'firecrawl-aisdk':
        // Firecrawl has multiple tools, return all of them
        return {
          scrapeTool,
          crawlTool,
          searchTool,
        };

      default:
        throw new Error(`Unknown tool package: ${packageName}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load tool from package ${packageName}: ${error.message}`);
    }
    throw new Error(`Failed to load tool from package ${packageName}: Unknown error`);
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
 * Load all installed TPMJS tools
 *
 * For now, this is a manual list. In the future, we can scan node_modules
 * for packages with the "tpmjs-tool" keyword.
 */
// biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex and using any is appropriate here
export async function loadAllTools(): Promise<Record<string, any>> {
  const installedTools = ['@tpmjs/hello', 'firecrawl-aisdk'];

  // biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex and using any is appropriate here
  const tools: Record<string, any> = {};

  for (const packageName of installedTools) {
    try {
      const tool = await loadTpmjsTool(packageName);

      // If the tool returns an object with multiple tools (like firecrawl), spread them
      if (tool && typeof tool === 'object' && !tool.description) {
        Object.assign(tools, tool);
      } else {
        // Single tool - use a cleaned name (remove hyphens, camelCase)
        const toolName = packageName
          .replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase())
          .replace(/-/g, '');
        tools[toolName] = tool;
      }
    } catch (error) {
      console.error(`Failed to load tool ${packageName}:`, error);
      // Continue loading other tools even if one fails
    }
  }

  return tools;
}
