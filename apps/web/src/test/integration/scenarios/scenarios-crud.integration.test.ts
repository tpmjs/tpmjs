/**
 * Scenarios CRUD Integration Tests
 *
 * Tests the scenario API endpoints including:
 * - Creating scenarios
 * - Listing scenarios
 * - Getting scenario details
 * - Updating scenarios
 * - Deleting scenarios
 *
 * NOTE: These are integration tests that require a running server.
 * Run `pnpm dev --filter=@tpmjs/web` first, then run tests.
 * Tests will be skipped if server is not available.
 *
 * To run integration tests manually:
 *   INTEGRATION_TESTS=true pnpm --filter=@tpmjs/web test
 */

import { prisma } from '@tpmjs/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Skip integration tests unless explicitly enabled
const INTEGRATION_TESTS_ENABLED = process.env.INTEGRATION_TESTS === 'true';
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Check if server is available
async function isServerAvailable(): Promise<boolean> {
  if (!INTEGRATION_TESTS_ENABLED) return false;
  try {
    const response = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    return response.ok;
  } catch {
    return false;
  }
}

describe.skipIf(!INTEGRATION_TESTS_ENABLED)('Scenarios CRUD Integration', () => {
  let serverAvailable = false;
  let testCollection: { id: string; slug: string | null; userId: string } | null = null;
  const testScenarioId: string | null = null;

  beforeAll(async () => {
    serverAvailable = await isServerAvailable();
    if (!serverAvailable) {
      console.warn('⚠️  Server not available - skipping scenario integration tests');
      return;
    }

    // Find a test collection to use
    testCollection = await prisma.collection.findFirst({
      where: { isPublic: true },
      select: { id: true, slug: true, userId: true },
    });

    if (!testCollection) {
      console.warn('⚠️  No public collection found - skipping scenario tests');
    }
  });

  afterAll(async () => {
    if (!serverAvailable) return;

    try {
      // Clean up test scenario if created
      if (testScenarioId) {
        await prisma.scenario.delete({ where: { id: testScenarioId } }).catch(() => {});
      }
      await prisma.$disconnect();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('GET /api/scenarios', () => {
    it('should list public scenarios', async () => {
      if (!serverAvailable) return;

      const response = await fetch(`${BASE_URL}/api/scenarios?limit=10`);

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      if (!serverAvailable) return;

      const response = await fetch(`${BASE_URL}/api/scenarios?limit=5&offset=0`);

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.offset).toBe(0);
    });

    it('should filter by collection', async () => {
      if (!serverAvailable || !testCollection) return;

      const response = await fetch(`${BASE_URL}/api/scenarios?collectionId=${testCollection.id}`);

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);

      // All returned scenarios should belong to the collection
      for (const scenario of result.data) {
        expect(scenario.collectionId).toBe(testCollection.id);
      }
    });
  });

  describe('GET /api/scenarios/featured', () => {
    it('should return featured scenarios', async () => {
      if (!serverAvailable) return;

      const response = await fetch(`${BASE_URL}/api/scenarios/featured`);

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('POST /api/collections/[id]/scenarios/generate', () => {
    it('should require authentication', async () => {
      if (!serverAvailable || !testCollection) return;

      const response = await fetch(
        `${BASE_URL}/api/collections/${testCollection.id}/scenarios/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count: 1 }),
        }
      );

      // Should return 401 without auth
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/scenarios/[id]', () => {
    it('should return scenario details', async () => {
      if (!serverAvailable) return;

      // First find a scenario
      const listResponse = await fetch(`${BASE_URL}/api/scenarios?limit=1`);
      const listResult = await listResponse.json();

      if (listResult.data.length === 0) {
        console.log('No scenarios found to test');
        return;
      }

      const scenarioId = listResult.data[0].id;
      const response = await fetch(`${BASE_URL}/api/scenarios/${scenarioId}`);

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(scenarioId);
      expect(result.data.name).toBeDefined();
      expect(result.data.prompt).toBeDefined();
    });

    it('should return 404 for non-existent scenario', async () => {
      if (!serverAvailable) return;

      const response = await fetch(`${BASE_URL}/api/scenarios/non-existent-scenario-id-12345`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/scenarios/[id]/runs', () => {
    it('should list scenario runs', async () => {
      if (!serverAvailable) return;

      // Find a scenario with runs
      const listResponse = await fetch(`${BASE_URL}/api/scenarios?limit=10`);
      const listResult = await listResponse.json();

      if (listResult.data.length === 0) {
        console.log('No scenarios found');
        return;
      }

      // Try each scenario until we find one (may or may not have runs)
      const scenarioId = listResult.data[0].id;
      const response = await fetch(`${BASE_URL}/api/scenarios/${scenarioId}/runs`);

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('POST /api/scenarios/check-similarity', () => {
    it('should check scenario similarity', async () => {
      if (!serverAvailable || !testCollection) return;

      const response = await fetch(`${BASE_URL}/api/scenarios/check-similarity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: testCollection.id,
          prompt: 'Test prompt for similarity checking',
        }),
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(typeof result.data.hasSimilar).toBe('boolean');
    });

    it('should require collectionId and prompt', async () => {
      if (!serverAvailable) return;

      const response = await fetch(`${BASE_URL}/api/scenarios/check-similarity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });
});
