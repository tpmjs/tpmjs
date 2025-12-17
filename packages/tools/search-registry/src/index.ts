import { jsonSchema, tool } from 'ai';

/**
 * Input type for Search TPMJS Tools
 */
type SearchTpmjsToolsInput = {
  query: string;
  category?: string;
  limit?: number;
  recentMessages?: string[];
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
      recentMessages: {
        type: 'array',
        description: 'Recent user messages for context (optional)',
        items: {
          type: 'string',
        },
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute({ query, category, limit = 10, recentMessages = [] }) {
    console.log('🔍 searchTpmjsTools.execute() called with:', {
      query,
      category,
      limit,
      recentMessages: recentMessages.length,
    });

    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      ...(category && { category }),
      ...(recentMessages.length > 0 && { messages: JSON.stringify(recentMessages) }),
    });

    // Use environment variable, or default to production API (falls back to localhost in dev)
    const baseUrl =
      process.env.TPMJS_API_URL ||
      (process.env.NODE_ENV === 'production' ? 'https://tpmjs.com' : 'http://localhost:3000');

    // Use the /api/tools/search endpoint for BM25 scoring with context
    const url = `${baseUrl}/api/tools/search?${params}`;

    console.log(`🌐 Fetching: ${url}`);

    const response = await fetch(url);

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    // biome-ignore lint/suspicious/noExplicitAny: API response types vary
    const data = (await response.json()) as any;
    console.log('📦 Search response data:', JSON.stringify(data, null, 2));

    // Handle /api/tools/search response structure
    const toolsArray = data.results?.tools || [];

    return {
      query,
      matchCount: toolsArray.length,
      // biome-ignore lint/suspicious/noExplicitAny: Tool types from API vary
      tools: toolsArray.map((tool: any) => ({
        toolId: tool.id,
        packageName: tool.package.npmPackageName,
        name: tool.name,
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
