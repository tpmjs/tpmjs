import { jsonSchema, tool } from 'ai';

/**
 * Input type for Search TPMJS Tools
 */
type SearchTpmjsToolsInput = {
  query: string;
  category?: string;
  limit?: number;
};

/**
 * AI SDK tool for searching the TPMJS tool registry
 *
 * This meta-tool enables agents to discover and load tools dynamically from the registry.
 * When an agent needs a tool that isn't currently available, it can search for it by keyword,
 * category, or description. The search results include all metadata needed to dynamically
 * import the tool at runtime.
 */
export const searchTpmjsToolsTool = tool({
  description:
    "Search the TPMJS tool registry to find AI SDK tools. Use this when you need a tool that isn't currently available. Returns tool metadata including package names, export names, and import URLs.",
  inputSchema: jsonSchema<SearchTpmjsToolsInput>({
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
        description: 'Maximum number of results (1-20, default 10)',
        minimum: 1,
        maximum: 20,
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute({ query, category, limit = 10 }) {
    console.log('🔍 searchTpmjsTools.execute() called with:', { query, category, limit });

    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      ...(category && { category }),
    });

    // Use environment variable or default to localhost for development
    const baseUrl = process.env.TPMJS_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/tools/search?${params}`;

    console.log(`🌐 Fetching: ${url}`);

    const response = await fetch(url);

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    console.log('📦 Search response data:', JSON.stringify(data, null, 2));

    return {
      query,
      matchCount: data.results?.total || data.data?.length || 0,
      tools: (data.results?.tools || data.data || []).map((tool: any) => ({
        toolId: tool.id,
        packageName: tool.package.npmPackageName,
        exportName: tool.exportName,
        description: tool.description,
        category: tool.package.category,
        qualityScore: tool.qualityScore,
        frameworks: tool.package.frameworks,
        env: tool.package.env,
        version: tool.package.npmVersion,
        importUrl: `https://esm.sh/${tool.package.npmPackageName}@${tool.package.npmVersion}`,
      })),
    };
  },
});
