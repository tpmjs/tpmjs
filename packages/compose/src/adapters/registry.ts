import type { Tool } from 'ai';
import { jsonSchema } from 'ai';

interface FromRegistryOptions {
  /** TPMJS API base URL. Defaults to https://tpmjs.com */
  apiUrl?: string;
  /** Executor URL. Defaults to TPMJS default executor */
  executorUrl?: string;
  /** Environment variables to pass to the tool at runtime */
  env?: Record<string, string>;
}

interface RegistryToolMeta {
  id: string;
  name: string;
  description: string | null;
  inputSchema: Record<string, unknown> | null;
  package: {
    npmPackageName: string;
  };
}

/**
 * Load a tool from the TPMJS registry and return an AI SDK tool definition.
 *
 * @param toolId - Tool identifier in the format `@scope/package::toolName` or `package::toolName`
 * @param options - Optional configuration
 *
 * @example
 * ```ts
 * import { createToolSet } from '@tpmjs/compose';
 * import { fromRegistry } from '@tpmjs/compose/adapters/registry';
 *
 * const tools = createToolSet()
 *   .use('weather', await fromRegistry('@tpmjs/weather::getWeather'))
 *   .build();
 * ```
 */
export async function fromRegistry(
  toolId: string,
  options: FromRegistryOptions = {}
): Promise<Tool> {
  const { apiUrl = 'https://tpmjs.com', executorUrl, env } = options;

  // Parse toolId: "@scope/package::toolName" or "package::toolName"
  const separatorIndex = toolId.indexOf('::');
  if (separatorIndex === -1) {
    throw new Error(
      `Invalid tool ID "${toolId}". Expected format: "@scope/package::toolName" or "package::toolName"`
    );
  }

  const packageName = toolId.slice(0, separatorIndex);
  const toolName = toolId.slice(separatorIndex + 2);

  if (!packageName || !toolName) {
    throw new Error(`Invalid tool ID "${toolId}". Both package name and tool name are required.`);
  }

  // Fetch tool metadata from TPMJS API
  const searchUrl = new URL('/api/tools/search', apiUrl);
  searchUrl.searchParams.set('q', toolName);
  searchUrl.searchParams.set('package', packageName);
  searchUrl.searchParams.set('limit', '1');

  const response = await fetch(searchUrl.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch tool from TPMJS registry: ${response.statusText}`);
  }

  const data = (await response.json()) as { data?: RegistryToolMeta[]; tools?: RegistryToolMeta[] };
  const tools: RegistryToolMeta[] = data.data ?? data.tools ?? [];

  const meta = tools.find((t) => t.name === toolName && t.package.npmPackageName === packageName);

  if (!meta) {
    throw new Error(`Tool "${toolId}" not found in the TPMJS registry.`);
  }

  // Build the executor URL
  const execUrl = executorUrl ?? `${apiUrl}/api/tools/${meta.id}/execute`;

  // Create AI SDK tool definition
  const inputSchema = meta.inputSchema
    ? jsonSchema(meta.inputSchema)
    : jsonSchema({ type: 'object' as const, properties: {} });

  const toolDef: Tool = {
    description: meta.description ?? undefined,
    inputSchema,
    execute: async (input: Record<string, unknown>) => {
      const res = await fetch(execUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(env && { 'X-Tool-Env': JSON.stringify(env) }),
        },
        body: JSON.stringify({ input }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText);
        throw new Error(`Tool execution failed: ${errorText}`);
      }

      return res.json() as Promise<unknown>;
    },
  };

  return toolDef;
}
