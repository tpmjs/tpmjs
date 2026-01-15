/**
 * MCP HTTP endpoint integration tests
 *
 * Tests the MCP HTTP transport endpoint for JSON-RPC communication.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanupTestContext,
  getTestContext,
  type IntegrationTestContext,
} from '../_helpers/test-context';

interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
}

describe('MCP HTTP Endpoint', () => {
  let ctx: IntegrationTestContext;
  let testCollection: { id: string; slug: string } | null = null;
  let actualUsername: string | null = null;

  beforeAll(async () => {
    ctx = getTestContext();

    // Get the actual username of the API key owner (not from env var which may be stale)
    const profileResult = await ctx.apiKeyClient.get<{ success: boolean; data: UserProfile }>(
      '/api/user/profile'
    );
    if (profileResult.ok && profileResult.data.data.username) {
      actualUsername = profileResult.data.data.username;
    } else {
      console.log('Warning: Could not get actual username, falling back to ctx.auth.username');
      actualUsername = ctx.auth.username;
    }

    // Create a test collection for MCP tests with unique name
    testCollection = await ctx.factories.collection.create({
      name: `MCP Test Collection ${Date.now()}`,
      description: 'Collection for testing MCP endpoints',
      isPublic: true,
    });
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('GET /api/mcp/:username/:slug/http', () => {
    it('should return server info', async () => {
      if (!testCollection) {
        console.log('Skipping: No test collection available');
        return;
      }

      const result = await ctx.apiKeyClient.get<{
        name: string;
        description: string | null;
        protocol: string;
        transport: string;
        endpoint: string;
      }>(`/api/mcp/${actualUsername}/${testCollection.slug}/http`);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBeDefined();
        expect(result.data.protocol).toBe('mcp');
        expect(result.data.transport).toBe('http');
      }
    });
  });

  describe('POST /api/mcp/:username/:slug/http - initialize', () => {
    it('should initialize MCP session', async () => {
      if (!testCollection) {
        console.log('Skipping: No test collection available');
        return;
      }

      const result = await ctx.apiKeyClient.post<JsonRpcResponse>(
        `/api/mcp/${actualUsername}/${testCollection.slug}/http`,
        {
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
        }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.jsonrpc).toBe('2.0');
        expect(result.data.id).toBe(1);
        expect(result.data.result).toBeDefined();
      }
    });

    it('should reject without API key', async () => {
      if (!testCollection) {
        console.log('Skipping: No test collection available');
        return;
      }

      const result = await ctx.publicClient.post(
        `/api/mcp/${actualUsername}/${testCollection.slug}/http`,
        {
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
        }
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('POST /api/mcp/:username/:slug/http - tools/list', () => {
    it('should list available tools', async () => {
      if (!testCollection) {
        console.log('Skipping: No test collection available');
        return;
      }

      const result = await ctx.apiKeyClient.post<JsonRpcResponse>(
        `/api/mcp/${actualUsername}/${testCollection.slug}/http`,
        {
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 2,
        }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.jsonrpc).toBe('2.0');
        expect(result.data.id).toBe(2);
        expect(result.data.result).toBeDefined();

        const listResult = result.data.result as { tools: unknown[] };
        expect(Array.isArray(listResult.tools)).toBe(true);
      }
    });
  });

  describe('POST /api/mcp/:username/:slug/http - invalid method', () => {
    it('should return error for unknown method', async () => {
      if (!testCollection) {
        console.log('Skipping: No test collection available');
        return;
      }

      const result = await ctx.apiKeyClient.post<JsonRpcResponse>(
        `/api/mcp/${actualUsername}/${testCollection.slug}/http`,
        {
          jsonrpc: '2.0',
          method: 'nonexistent/method',
          id: 3,
        }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.error).toBeDefined();
      }
    });
  });

  describe('Collection ID as slug (backwards compatibility)', () => {
    it('should accept collection ID instead of slug', async () => {
      if (!testCollection) {
        console.log('Skipping: No test collection available');
        return;
      }

      // Use collection ID instead of slug
      const result = await ctx.apiKeyClient.post<JsonRpcResponse>(
        `/api/mcp/${actualUsername}/${testCollection.id}/http`,
        {
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
        }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.result).toBeDefined();
      }
    });
  });
});
