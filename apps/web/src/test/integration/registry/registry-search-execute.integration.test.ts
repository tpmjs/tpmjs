/**
 * Registry search and execute integration tests
 *
 * Tests the full flow: search for tools via /api/tools/search,
 * then execute them via /api/registry/execute.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanupTestContext,
  getTestContext,
  type IntegrationTestContext,
} from '../_helpers/test-context';

interface ToolSearchResult {
  id: string;
  name: string;
  description: string;
  inputSchema?: unknown;
  qualityScore?: string;
  executionHealth?: string;
  package: {
    npmPackageName: string;
    npmVersion: string;
    category: string;
  };
}

interface SearchResponse {
  success: boolean;
  query: string;
  results: {
    total: number;
    returned: number;
    tools: ToolSearchResult[];
  };
}

interface ExecuteResponse {
  success: boolean;
  toolId: string;
  result?: unknown;
  error?: string | null;
  executionTimeMs?: number | null;
}

describe('Registry Search & Execute', () => {
  let ctx: IntegrationTestContext;

  beforeAll(() => {
    ctx = getTestContext();
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('Search → Execute flow', () => {
    it('should search for tools and get results with valid toolId format', async () => {
      const result = await ctx.publicClient.get<SearchResponse>('/api/tools/search', {
        query: { q: 'resend', limit: 5 },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(result.data.results.tools.length).toBeGreaterThan(0);

        // Every tool must have name and package.npmPackageName
        for (const tool of result.data.results.tools) {
          expect(tool.name).toBeDefined();
          expect(typeof tool.name).toBe('string');
          expect(tool.name.length).toBeGreaterThan(0);
          expect(tool.package.npmPackageName).toBeDefined();

          // toolId should be constructable as package::name
          const toolId = `${tool.package.npmPackageName}::${tool.name}`;
          expect(toolId).not.toContain('::undefined');
          expect(toolId).not.toContain('::null');
        }
      }
    });

    it('should search for hllm tools by package name', async () => {
      const result = await ctx.publicClient.get<SearchResponse>('/api/tools/search', {
        query: { q: 'hllm', limit: 5 },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(result.data.results.tools.length).toBeGreaterThan(0);

        // Should find tools from @tpmjs/tools-hllm package
        const hllmTools = result.data.results.tools.filter(
          (t) => t.package.npmPackageName === '@tpmjs/tools-hllm'
        );
        expect(hllmTools.length).toBeGreaterThan(0);
      }
    });

    it('should execute a tool via /api/registry/execute', async () => {
      // First, search for hllm tools to get a valid toolId
      const searchResult = await ctx.publicClient.get<SearchResponse>('/api/tools/search', {
        query: { q: 'hllm health', limit: 5 },
      });

      expect(searchResult.ok).toBe(true);
      if (!searchResult.ok) return;

      const tools = searchResult.data.results.tools;
      expect(tools.length).toBeGreaterThan(0);

      // Find a tool that doesn't require env vars
      const tool = tools[0]!;
      const toolId = `${tool.package.npmPackageName}::${tool.name}`;

      // Execute the tool
      const execResult = await ctx.publicClient.post<ExecuteResponse>('/api/registry/execute', {
        body: {
          toolId,
          params: {},
          env: {},
        },
      });

      expect(execResult.ok).toBe(true);
      if (execResult.ok) {
        expect(execResult.data.toolId).toBe(toolId);
        // The tool should either succeed or fail with a meaningful error
        // (not a 404 or deployment not found)
        expect(execResult.data.executionTimeMs).toBeDefined();
        if (!execResult.data.success) {
          expect(execResult.data.error).not.toContain('deployment could not be found');
          expect(execResult.data.error).not.toContain('DEPLOYMENT_NOT_FOUND');
        }
      }
    });

    it('should return error for invalid toolId format', async () => {
      const result = await ctx.publicClient.post<ExecuteResponse>('/api/registry/execute', {
        body: {
          toolId: 'invalid-no-separator',
          params: {},
        },
      });

      expect(result.ok).toBe(false);
    });

    it('should return error for missing toolId', async () => {
      const result = await ctx.publicClient.post<ExecuteResponse>('/api/registry/execute', {
        body: {
          params: {},
        },
      });

      expect(result.ok).toBe(false);
    });

    it('should execute resend sendEmail tool (requires RESEND_API_KEY)', async () => {
      const execResult = await ctx.publicClient.post<ExecuteResponse>('/api/registry/execute', {
        body: {
          toolId: '@tpmjs/tools-resend::sendEmail',
          params: {
            from: 'admin@tpmjs.com',
            to: 'thomasalwyndavis@gmail.com',
            subject: 'Integration Test - Registry Execute',
            text: 'This is an integration test of the TPMJS registry execute endpoint.',
          },
          env: {
            RESEND_API_KEY: process.env.RESEND_API_KEY || '',
          },
        },
      });

      expect(execResult.ok).toBe(true);
      if (execResult.ok) {
        expect(execResult.data.toolId).toBe('@tpmjs/tools-resend::sendEmail');
        expect(execResult.data.executionTimeMs).toBeDefined();
        // If RESEND_API_KEY is set, this should succeed
        // If not, it should fail with a meaningful error about the key
      }
    });
  });
});
