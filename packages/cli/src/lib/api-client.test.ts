/**
 * TpmClient Unit Tests
 *
 * Tests for the CLI API client including:
 * - Request formatting
 * - Error handling
 * - Authentication
 * - Response parsing
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, canonicalToolId, type Tool, TpmClient } from './api-client.js';

// Mock the config module
vi.mock('./config.js', () => ({
  getApiKey: vi.fn(() => undefined),
  getApiUrl: vi.fn(() => 'https://default.api.com'),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TpmClient', () => {
  let client: TpmClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new TpmClient({
      baseUrl: 'https://api.test.com',
      apiKey: 'test-api-key',
      timeout: 5000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client with custom options', () => {
      const customClient = new TpmClient({
        baseUrl: 'https://custom.api.com',
        apiKey: 'custom-key',
        timeout: 10000,
      });

      expect(customClient.isAuthenticated()).toBe(true);
    });

    it('should create client without API key', () => {
      // When no apiKey option is passed, and config returns undefined, client is not authenticated
      const unauthClient = new TpmClient({
        baseUrl: 'https://api.test.com',
        apiKey: undefined, // Explicitly set to undefined to override config default
      });

      expect(unauthClient.isAuthenticated()).toBe(false);
    });
  });

  describe('health', () => {
    it('should call health endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', timestamp: '2024-01-01T00:00:00Z' }),
      });

      const result = await client.health();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/health',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
      expect(result.status).toBe('ok');
    });
  });

  describe('searchTools', () => {
    it('should search tools with query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: '1', name: 'test-tool' }],
          pagination: { limit: 20, offset: 0, hasMore: false },
        }),
      });

      const result = await client.searchTools({ query: 'test', limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/tools?q=test&limit=10',
        expect.any(Object)
      );
      expect(result.data).toHaveLength(1);
    });

    it('should search tools with category filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { limit: 20, offset: 0, hasMore: false },
        }),
      });

      await client.searchTools({ category: 'sandbox' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/tools?category=sandbox',
        expect.any(Object)
      );
    });

    it('should handle empty search', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { limit: 20, offset: 0, hasMore: false },
        }),
      });

      const result = await client.searchTools({});

      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/tools', expect.any(Object));
      expect(result.data).toHaveLength(0);
    });
  });

  describe('listAgents', () => {
    it('should list agents with pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: '1', uid: 'agent-1', name: 'Test Agent' },
            { id: '2', uid: 'agent-2', name: 'Another Agent' },
          ],
          pagination: { limit: 10, offset: 0, hasMore: true },
        }),
      });

      const result = await client.listAgents({ limit: 10, offset: 0 });

      // Note: offset=0 is falsy so it won't be included in the URL
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/agents?limit=10',
        expect.any(Object)
      );
      expect(result.data).toHaveLength(2);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should include offset when non-zero', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { limit: 10, offset: 10, hasMore: false },
        }),
      });

      await client.listAgents({ limit: 10, offset: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/agents?limit=10&offset=10',
        expect.any(Object)
      );
    });
  });

  describe('createAgent', () => {
    it('should create an agent', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'new-agent-id',
            uid: 'new-agent',
            name: 'New Agent',
            provider: 'openai',
            modelId: 'gpt-4',
          },
        }),
      });

      const result = await client.createAgent({
        name: 'New Agent',
        uid: 'new-agent',
        provider: 'openai',
        modelId: 'gpt-4',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/agents',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'New Agent',
            uid: 'new-agent',
            provider: 'openai',
            modelId: 'gpt-4',
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data?.uid).toBe('new-agent');
    });
  });

  describe('listCollections', () => {
    it('should list collections', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: '1', name: 'Collection 1', slug: 'collection-1' },
            { id: '2', name: 'Collection 2', slug: 'collection-2' },
          ],
          pagination: { limit: 20, offset: 0, hasMore: false },
        }),
      });

      const result = await client.listCollections();

      expect(result.data).toHaveLength(2);
    });
  });

  describe('listScenarios', () => {
    it('should list scenarios with filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: '1', name: 'Scenario 1', qualityScore: 0.9 }],
          pagination: { limit: 20, offset: 0, hasMore: false },
        }),
      });

      const result = await client.listScenarios({
        collectionId: 'col-1',
        sortBy: 'qualityScore',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/scenarios?collectionId=col-1&sortBy=qualityScore',
        expect.any(Object)
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('runScenario', () => {
    it('should run a scenario', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'run-1',
            status: 'pass',
            success: true,
            evaluator: {
              model: 'gpt-4.1-mini',
              verdict: 'pass',
              reason: 'Task completed successfully',
            },
          },
        }),
      });

      const result = await client.runScenario('scenario-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/scenarios/scenario-1/run',
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('pass');
    });
  });

  describe('error handling', () => {
    it('should throw ApiError on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      });

      await expect(client.getAgent('non-existent')).rejects.toThrow(ApiError);
    });

    it('should include status code in ApiError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      try {
        await client.whoami();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(401);
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.health()).rejects.toThrow('Network error');
    });
  });

  describe('authentication', () => {
    it('should include Authorization header when API key is set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      await client.whoami();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should not include Authorization header when no API key', async () => {
      // Create client with explicitly undefined apiKey
      const unauthClient = new TpmClient({
        baseUrl: 'https://api.test.com',
        apiKey: undefined,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      await unauthClient.health();

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs).toBeDefined();
      const callHeaders = callArgs?.[1]?.headers as Record<string, string> | undefined;
      expect(callHeaders?.Authorization).toBeUndefined();
    });
  });

  describe('tool execution', () => {
    it('executes a canonical tool ID through the registry contract and unwraps the result', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          toolId: '@example/tools::parseCsv',
          result: { rows: 2 },
          executionTimeMs: 14,
        }),
      });

      const result = await client.executeTool('@example/tools::parseCsv', { csv: 'a\n1' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/registry/execute',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            toolId: '@example/tools::parseCsv',
            params: { csv: 'a\n1' },
          }),
        })
      );
      expect(result).toEqual({ rows: 2 });
    });

    it('resolves a unique legacy tool name before execution', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              {
                id: 'tool-1',
                name: 'parseCsv',
                package: { npmPackageName: '@example/tools' },
              },
            ],
            pagination: { limit: 10, offset: 0, hasMore: false },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            toolId: '@example/tools::parseCsv',
            result: 'ok',
            executionTimeMs: 9,
          }),
        });

      await expect(client.executeTool('parseCsv', {})).resolves.toBe('ok');

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://api.test.com/tools?q=parseCsv&limit=10',
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.test.com/registry/execute',
        expect.objectContaining({
          body: JSON.stringify({ toolId: '@example/tools::parseCsv', params: {} }),
        })
      );
    });

    it('refuses ambiguous legacy names instead of executing the wrong package', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: 'one', name: 'search', package: { npmPackageName: '@one/tools' } },
            { id: 'two', name: 'search', package: { npmPackageName: '@two/tools' } },
          ],
          pagination: { limit: 10, offset: 0, hasMore: false },
        }),
      });

      await expect(client.executeTool('search', {})).rejects.toThrow(
        'Tool "search" is ambiguous. Use package::toolName.'
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('turns an atomic registry result into stream-compatible events', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          toolId: '@example/tools::parseCsv',
          result: { rows: 2 },
          executionTimeMs: 11,
        }),
      });

      const events = [];
      for await (const event of client.executeToolStream('@example/tools::parseCsv', {})) {
        events.push(event);
      }

      expect(events).toEqual([
        { type: 'text', data: '{\n  "rows": 2\n}' },
        { type: 'done', data: '' },
      ]);
    });

    it('surfaces structured API error messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          success: false,
          error: { code: 'TOOL_ERROR', message: 'Required parameter missing' },
        }),
      });

      await expect(client.executeTool('@example/tools::parseCsv', {})).rejects.toThrow(
        'Required parameter missing'
      );
    });
  });

  describe('tool identity routes', () => {
    it('preserves the path boundary in scoped package names', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'tool-1' } }),
      });

      await client.getTool('@example/tools', 'parseCsv');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/tools/%40example/tools/parseCsv',
        expect.any(Object)
      );
    });

    it('resolves canonical IDs through the same scoped route', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'tool-1' } }),
      });

      await client.getToolBySlug('@example/tools::parseCsv');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/tools/%40example/tools/parseCsv',
        expect.any(Object)
      );
    });
  });

  describe('canonicalToolId', () => {
    it('uses the package relation returned by the registry', () => {
      expect(
        canonicalToolId({
          name: 'parseCsv',
          package: { npmPackageName: '@example/tools' },
        } as Tool)
      ).toBe('@example/tools::parseCsv');
    });
  });

  describe('collection management', () => {
    it('should create a collection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 'col-1', name: 'My Collection', isPublic: true },
        }),
      });

      const result = await client.createCollection({
        name: 'My Collection',
        isPublic: true,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/collections',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'My Collection', isPublic: true }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should delete a collection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await client.deleteCollection('col-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/collections/col-1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result.success).toBe(true);
    });

    it('should update a collection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 'col-1', name: 'Updated Name', isPublic: false },
        }),
      });

      const result = await client.updateCollection('col-1', {
        name: 'Updated Name',
        isPublic: false,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/collections/col-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ name: 'Updated Name', isPublic: false }),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('scenario management', () => {
    it('should get scenario runs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: 'run-1', status: 'pass' },
            { id: 'run-2', status: 'fail' },
          ],
          pagination: { limit: 10, offset: 0, hasMore: false },
        }),
      });

      const result = await client.getScenarioRuns('scenario-1', { limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/scenarios/scenario-1/runs?limit=10',
        expect.any(Object)
      );
      expect(result.data).toHaveLength(2);
    });

    it('should create a scenario', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'scenario-1',
            prompt: 'Test the feature',
            name: 'Test Scenario',
          },
        }),
      });

      const result = await client.createScenario({
        collectionId: 'col-1',
        prompt: 'Test the feature',
        name: 'Test Scenario',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/scenarios',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            collectionId: 'col-1',
            prompt: 'Test the feature',
            name: 'Test Scenario',
          }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should generate scenarios for a collection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            scenarios: [
              { scenario: { id: 's1', prompt: 'Generated 1' } },
              { scenario: { id: 's2', prompt: 'Generated 2' } },
            ],
          },
        }),
      });

      const result = await client.generateScenarios('col-1', { count: 5 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/collections/col-1/scenarios/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ count: 5 }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data?.scenarios).toHaveLength(2);
    });
  });

  describe('stats', () => {
    it('should get stats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            tools: { total: 100, official: 10, healthyImport: 95, healthyExecution: 90 },
            packages: { total: 50, official: 5 },
            categories: [{ name: 'sandbox', count: 20 }],
          },
        }),
      });

      const result = await client.getStats();

      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/stats', expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.data?.tools.total).toBe(100);
    });
  });

  describe('user API keys', () => {
    it('should list API keys', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: 'key-1', name: 'Test Key', keyPrefix: 'tpmjs_sk_...' }],
        }),
      });

      const result = await client.listApiKeys();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/user/tpmjs-api-keys',
        expect.any(Object)
      );
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });
});
