import { jsonSchema, tool } from 'ai';

const TPMJS_API_URL = process.env.TPMJS_API_URL || 'https://tpmjs.com';

/**
 * Input type for Registry Search Tool
 */
type RegistrySearchInput = {
  query: string;
  category?: string;
  limit?: number;
};

/**
 * AI SDK tool for searching the TPMJS tool registry
 *
 * This tool enables agents to discover tools dynamically from the TPMJS registry.
 * Search results include toolIds that can be executed with @tpmjs/registryExecute.
 *
 * Supports self-hosted registries via TPMJS_API_URL environment variable.
 */
export const registrySearchTool = tool({
  description:
    'Search the TPMJS tool registry to find AI SDK tools. Use this to discover tools for any task. Returns toolIds that can be executed with registryExecuteTool.',
  inputSchema: jsonSchema<RegistrySearchInput>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (keywords, tool names, descriptions)',
      },
      category: {
        type: 'string',
        description: 'Filter by tool category (optional)',
        enum: [
          'web-scraping',
          'data-processing',
          'file-operations',
          'communication',
          'database',
          'api-integration',
          'image-processing',
          'text-analysis',
          'automation',
          'ai-ml',
          'security',
          'monitoring',
        ],
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (1-20, default 5)',
        minimum: 1,
        maximum: 20,
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute({ query, category, limit = 5 }) {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      ...(category && { category }),
    });

    const url = `${TPMJS_API_URL}/api/tools/search?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    // biome-ignore lint/suspicious/noExplicitAny: API response types vary
    const data = (await response.json()) as any;
    const toolsArray = data.results?.tools || [];

    return {
      query,
      matchCount: toolsArray.length,
      // biome-ignore lint/suspicious/noExplicitAny: Tool types from API vary
      tools: toolsArray.map((t: any) => ({
        // Unique identifier for registryExecuteTool
        toolId: `${t.package.npmPackageName}::${t.name}`,

        // Human-readable info
        name: t.name,
        package: t.package.npmPackageName,
        description: t.description,
        category: t.package.category,

        // Execution requirements
        requiredEnvVars:
          t.package.env?.filter((e: any) => e.required).map((e: any) => e.name) || [],

        // Quality indicators
        healthStatus: t.executionHealth,
        qualityScore: t.qualityScore,
      })),
    };
  },
});
