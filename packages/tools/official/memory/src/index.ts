/**
 * @tpmjs/official-memory
 *
 * Persistent, semantically-searchable memory tools for AI agents.
 * Requires a TPMJS API key with memory:read and memory:write scopes.
 *
 * Environment variables:
 *   TPMJS_API_KEY  - Required. Your TPMJS Platform API key.
 *   TPMJS_BASE_URL - Optional. Defaults to https://tpmjs.com
 */

import { jsonSchema, tool } from 'ai';

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

function getConfig(): { apiKey: string; baseUrl: string } {
  const apiKey = process.env.TPMJS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'TPMJS_API_KEY environment variable is required. ' +
        'Get one at https://tpmjs.com/dashboard/settings/tpmjs-api-keys'
    );
  }
  const baseUrl = (process.env.TPMJS_BASE_URL || 'https://tpmjs.com').replace(/\/$/, '');
  return { apiKey, baseUrl };
}

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { apiKey, baseUrl } = getConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json()) as { error?: string; data: T };

  if (!response.ok) {
    throw new Error(data.error || `API request failed with status ${response.status}`);
  }

  return data.data;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Memory {
  id: string;
  content: unknown;
  summary: string;
  namespace: string | null;
  tags: string[];
  source: string;
  sourceAgent: string | null;
  contentSizeBytes: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  id: string;
  content: unknown;
  summary: string;
  namespace: string | null;
  tags: string[];
  similarity: number;
  createdAt: string;
}

type CreateMemoryInput = {
  content: unknown;
  summary?: string;
  namespace?: string;
  tags?: string[];
  expiresAt?: string;
};

type SearchMemoryInput = {
  query: string;
  namespace?: string;
  tags?: string[];
  limit?: number;
  threshold?: number;
};

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

/**
 * createMemoryTool
 *
 * Store a persistent memory that can be retrieved later via semantic search.
 * Use for saving context, decisions, preferences, or any information that
 * should persist across sessions.
 */
export const createMemoryTool = tool({
  description:
    'Store a persistent memory that can be retrieved later via semantic search. ' +
    'Use for saving context, decisions, preferences, or any information that should persist across sessions.',
  inputSchema: jsonSchema<CreateMemoryInput>({
    type: 'object',
    properties: {
      content: {
        description: 'Arbitrary JSON payload to store as the memory content',
      },
      summary: {
        type: 'string',
        description:
          'Human-readable summary of the memory (max 500 chars). Auto-generated if not provided.',
      },
      namespace: {
        type: 'string',
        description: "Optional grouping namespace (e.g., 'project-x', 'personal')",
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for categorization',
      },
      expiresAt: {
        type: 'string',
        description: 'ISO 8601 datetime for automatic expiration (TTL)',
      },
    },
    required: ['content'],
    additionalProperties: false,
  }),
  async execute(input: CreateMemoryInput): Promise<Memory> {
    if (!input.content) {
      throw new Error('content is required and must be non-empty');
    }

    try {
      return await apiRequest<Memory>('POST', '/api/memories', {
        ...input,
        source: 'createMemoryTool',
      });
    } catch (error) {
      throw new Error(
        `Failed to create memory: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

/**
 * searchMemoryTool
 *
 * Search memories using natural language semantic search.
 * Returns the most relevant memories ranked by similarity score.
 */
export const searchMemoryTool = tool({
  description:
    'Search memories using natural language semantic search. ' +
    'Returns the most relevant memories ranked by similarity.',
  inputSchema: jsonSchema<SearchMemoryInput>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural language search query',
      },
      namespace: {
        type: 'string',
        description: 'Filter results to a specific namespace',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter results to memories with any of these tags',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 10, max: 50)',
      },
      threshold: {
        type: 'number',
        description: 'Minimum similarity threshold 0-1 (default: 0.7)',
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute(input: SearchMemoryInput): Promise<SearchResult[]> {
    if (!input.query || typeof input.query !== 'string') {
      throw new Error('query is required and must be a non-empty string');
    }

    try {
      return await apiRequest<SearchResult[]>('POST', '/api/memories/search', input);
    } catch (error) {
      throw new Error(
        `Failed to search memories: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export default { createMemoryTool, searchMemoryTool };
