/**
 * @tpmjs/official-agnt-notion — Notion API Tools for AI Agents
 *
 * Interact with Notion databases, pages, and blocks. Search, query, read,
 * and create content in your Notion workspace.
 *
 * @requires NOTION_API_KEY environment variable
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.NOTION_API_KEY;
  if (!key) {
    throw new Error(
      'NOTION_API_KEY environment variable is required. Get your integration token from https://www.notion.so/my-integrations'
    );
  }
  return key;
}

async function notionRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = getApiKey();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = { method, headers };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = (await response.json()) as { message?: string; code?: string };
      errorMessage = errorData.message || `HTTP ${response.status}`;
      if (errorData.code) {
        errorMessage = `${errorMessage} (code: ${errorData.code})`;
      }
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }

    switch (response.status) {
      case 400:
        throw new Error(`Bad request: ${errorMessage}`);
      case 401:
        throw new Error('Authentication failed: Invalid Notion API key. Check NOTION_API_KEY.');
      case 403:
        throw new Error(
          `Access forbidden: ${errorMessage}. Ensure the integration has access to the resource.`
        );
      case 404:
        throw new Error(`Resource not found: ${errorMessage}`);
      case 429:
        throw new Error(`Rate limit exceeded: ${errorMessage}`);
      default:
        throw new Error(`Notion API error (${response.status}): ${errorMessage}`);
    }
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface NotionRichText {
  type: string;
  plain_text: string;
}

interface NotionTitleProperty {
  type: 'title';
  title: NotionRichText[];
}

interface NotionProperties {
  [key: string]: NotionTitleProperty | { type: string; [key: string]: unknown };
}

interface NotionPage {
  id: string;
  object: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  properties: NotionProperties;
}

interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  [key: string]: unknown;
}

function extractTitle(properties: NotionProperties): string {
  for (const value of Object.values(properties)) {
    if (value.type === 'title' && 'title' in value) {
      const titleProp = value as NotionTitleProperty;
      return titleProp.title.map((t) => t.plain_text).join('');
    }
  }
  return '';
}

function simplifyProperties(properties: NotionProperties): Record<string, unknown> {
  const simplified: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    simplified[key] = { type: value.type, value };
  }
  return simplified;
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface NotionSearchResultItem {
  id: string;
  type: string;
  title: string;
  url: string;
  lastEdited: string;
}

export interface NotionSearchResult {
  results: NotionSearchResultItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface NotionQueryResultItem {
  id: string;
  properties: Record<string, unknown>;
  url: string;
  createdTime: string;
  lastEditedTime: string;
}

export interface NotionQueryResult {
  results: NotionQueryResultItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface NotionPageResult {
  id: string;
  properties: Record<string, unknown>;
  url: string;
  content: NotionBlock[];
  createdTime: string;
  lastEditedTime: string;
}

export interface NotionCreatePageResult {
  id: string;
  url: string;
  createdTime: string;
}

// ─── notionSearch ────────────────────────────────────────────────────────────

export interface NotionSearchInput {
  query: string;
  filter?: string;
  pageSize?: number;
}

export const notionSearch = tool({
  description:
    'Search for pages and databases in Notion by title or content. Returns matching results with their IDs and URLs.',
  inputSchema: jsonSchema<NotionSearchInput>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find pages or databases.',
      },
      filter: {
        type: 'string',
        description: 'Filter results by object type: "page" or "database". Omit to search both.',
      },
      pageSize: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10).',
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute(input: NotionSearchInput): Promise<NotionSearchResult> {
    try {
      if (!input.query) {
        throw new Error('query is required and must be non-empty');
      }

      const body: Record<string, unknown> = {
        query: input.query,
        page_size: input.pageSize ?? 10,
      };

      if (input.filter) {
        if (input.filter !== 'page' && input.filter !== 'database') {
          throw new Error('filter must be either "page" or "database"');
        }
        body.filter = { property: 'object', value: input.filter };
      }

      const data = await notionRequest<{
        results: NotionPage[];
        has_more: boolean;
        next_cursor: string | null;
      }>('POST', '/search', body);

      return {
        results: data.results.map((item) => ({
          id: item.id,
          type: item.object,
          title: extractTitle(item.properties),
          url: item.url,
          lastEdited: item.last_edited_time,
        })),
        hasMore: data.has_more,
        nextCursor: data.next_cursor,
      };
    } catch (error) {
      throw new Error(`Failed to search Notion: ${(error as Error).message}`);
    }
  },
});

// ─── notionQueryDatabase ─────────────────────────────────────────────────────

export interface NotionQueryDatabaseInput {
  databaseId: string;
  filter?: string;
  sorts?: string;
  pageSize?: number;
}

export const notionQueryDatabase = tool({
  description:
    'Query a Notion database with optional filters and sorts. Returns matching pages with their properties.',
  inputSchema: jsonSchema<NotionQueryDatabaseInput>({
    type: 'object',
    properties: {
      databaseId: {
        type: 'string',
        description: 'The ID of the Notion database to query.',
      },
      filter: {
        type: 'string',
        description:
          'JSON string of a Notion filter object, e.g. \'{"property":"Status","select":{"equals":"Done"}}\'.',
      },
      sorts: {
        type: 'string',
        description:
          'JSON string of a Notion sorts array, e.g. \'[{"property":"Created","direction":"descending"}]\'.',
      },
      pageSize: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10).',
      },
    },
    required: ['databaseId'],
    additionalProperties: false,
  }),
  async execute(input: NotionQueryDatabaseInput): Promise<NotionQueryResult> {
    try {
      if (!input.databaseId) {
        throw new Error('databaseId is required and must be non-empty');
      }

      const body: Record<string, unknown> = {
        page_size: input.pageSize ?? 10,
      };

      if (input.filter) {
        try {
          body.filter = JSON.parse(input.filter);
        } catch {
          throw new Error('filter must be a valid JSON string representing a Notion filter object');
        }
      }

      if (input.sorts) {
        try {
          body.sorts = JSON.parse(input.sorts);
        } catch {
          throw new Error('sorts must be a valid JSON string representing a Notion sorts array');
        }
      }

      const data = await notionRequest<{
        results: NotionPage[];
        has_more: boolean;
        next_cursor: string | null;
      }>('POST', `/databases/${input.databaseId}/query`, body);

      return {
        results: data.results.map((item) => ({
          id: item.id,
          properties: simplifyProperties(item.properties),
          url: item.url,
          createdTime: item.created_time,
          lastEditedTime: item.last_edited_time,
        })),
        hasMore: data.has_more,
        nextCursor: data.next_cursor,
      };
    } catch (error) {
      throw new Error(`Failed to query Notion database: ${(error as Error).message}`);
    }
  },
});

// ─── notionGetPage ───────────────────────────────────────────────────────────

export interface NotionGetPageInput {
  pageId: string;
}

export const notionGetPage = tool({
  description: 'Get the full content of a Notion page, including its properties and child blocks.',
  inputSchema: jsonSchema<NotionGetPageInput>({
    type: 'object',
    properties: {
      pageId: {
        type: 'string',
        description: 'The ID of the Notion page to retrieve.',
      },
    },
    required: ['pageId'],
    additionalProperties: false,
  }),
  async execute(input: NotionGetPageInput): Promise<NotionPageResult> {
    try {
      if (!input.pageId) {
        throw new Error('pageId is required and must be non-empty');
      }

      const [page, blocks] = await Promise.all([
        notionRequest<NotionPage>('GET', `/pages/${input.pageId}`),
        notionRequest<{ results: NotionBlock[] }>('GET', `/blocks/${input.pageId}/children`),
      ]);

      return {
        id: page.id,
        properties: simplifyProperties(page.properties),
        url: page.url,
        content: blocks.results,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
      };
    } catch (error) {
      throw new Error(`Failed to get Notion page: ${(error as Error).message}`);
    }
  },
});

// ─── notionCreatePage ────────────────────────────────────────────────────────

export interface NotionCreatePageInput {
  parentId: string;
  parentType?: string;
  title: string;
  properties?: string;
  content?: string;
}

export const notionCreatePage = tool({
  description:
    'Create a new page in a Notion database or as a child of another page. Supports setting properties and adding content blocks.',
  inputSchema: jsonSchema<NotionCreatePageInput>({
    type: 'object',
    properties: {
      parentId: {
        type: 'string',
        description: 'The ID of the parent database or page.',
      },
      parentType: {
        type: 'string',
        description: 'The type of parent: "database" (default) or "page".',
      },
      title: {
        type: 'string',
        description: 'The title of the new page.',
      },
      properties: {
        type: 'string',
        description:
          'JSON string of additional Notion properties to set, e.g. \'{"Status":{"select":{"name":"In Progress"}}}\'.',
      },
      content: {
        type: 'string',
        description:
          'JSON string of an array of Notion block objects to add as page content, e.g. \'[{"object":"block","type":"paragraph","paragraph":{"rich_text":[{"type":"text","text":{"content":"Hello"}}]}}]\'.',
      },
    },
    required: ['parentId', 'title'],
    additionalProperties: false,
  }),
  async execute(input: NotionCreatePageInput): Promise<NotionCreatePageResult> {
    try {
      if (!input.parentId) {
        throw new Error('parentId is required and must be non-empty');
      }
      if (!input.title) {
        throw new Error('title is required and must be non-empty');
      }

      const parentType = input.parentType || 'database';
      if (parentType !== 'database' && parentType !== 'page') {
        throw new Error('parentType must be either "database" or "page"');
      }

      const body: Record<string, unknown> = {};

      if (parentType === 'database') {
        body.parent = { database_id: input.parentId };
        const properties: Record<string, unknown> = {
          title: {
            title: [{ text: { content: input.title } }],
          },
        };
        if (input.properties) {
          try {
            const extraProps = JSON.parse(input.properties) as Record<string, unknown>;
            Object.assign(properties, extraProps);
          } catch {
            throw new Error('properties must be a valid JSON string');
          }
        }
        body.properties = properties;
      } else {
        body.parent = { page_id: input.parentId };
        body.properties = {
          title: {
            title: [{ text: { content: input.title } }],
          },
        };
      }

      if (input.content) {
        try {
          body.children = JSON.parse(input.content);
        } catch {
          throw new Error(
            'content must be a valid JSON string representing an array of block objects'
          );
        }
      }

      const page = await notionRequest<NotionPage>('POST', '/pages', body);

      return {
        id: page.id,
        url: page.url,
        createdTime: page.created_time,
      };
    } catch (error) {
      throw new Error(`Failed to create Notion page: ${(error as Error).message}`);
    }
  },
});
