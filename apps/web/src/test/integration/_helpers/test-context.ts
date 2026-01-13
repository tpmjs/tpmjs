/**
 * Integration test context manager
 *
 * Provides a unified context object for integration tests with:
 * - Authenticated fetch functions (session, API key, cron)
 * - API client
 * - Data factories
 * - Cleanup tracker
 */

import { createApiClient, type ApiClient } from './api-client';
import {
  createApiKeyFetch,
  createCronFetch,
  createSessionFetch,
  getTestAuthContext,
  type TestAuthContext,
} from './auth';
import { TestDataTracker } from './cleanup';
import { createAgentFactory, type AgentFactory } from './factories/agent.factory';
import { createCollectionFactory, type CollectionFactory } from './factories/collection.factory';

export interface IntegrationTestContext {
  /** Base URL for API requests */
  baseUrl: string;

  /** Test user authentication context */
  auth: TestAuthContext;

  /** API client with session authentication */
  api: ApiClient;

  /** API client with API key authentication */
  apiKeyClient: ApiClient;

  /** API client with cron authentication */
  cronClient: ApiClient;

  /** Unauthenticated API client */
  publicClient: ApiClient;

  /** Fetch with session cookie */
  sessionFetch: typeof fetch;

  /** Fetch with API key header */
  apiKeyFetch: typeof fetch;

  /** Fetch with cron secret header */
  cronFetch: typeof fetch;

  /** Data factories */
  factories: {
    agent: AgentFactory;
    collection: CollectionFactory;
  };

  /** Test data tracker for cleanup */
  tracker: TestDataTracker;
}

let cachedContext: IntegrationTestContext | null = null;

/**
 * Get or create the integration test context
 *
 * This is a singleton that's reused across all tests in a run.
 * The tracker and factories are reset for each test file.
 */
export function getTestContext(): IntegrationTestContext {
  if (cachedContext) {
    return cachedContext;
  }

  const baseUrl = process.env.TEST_BASE_URL || 'https://tpmjs.com';
  const auth = getTestAuthContext();

  // Create authenticated fetch functions
  const sessionFetch = createSessionFetch(auth.sessionToken);
  const apiKeyFetch = createApiKeyFetch(auth.apiKey);
  const cronFetch = createCronFetch();

  // Create API clients
  const api = createApiClient(baseUrl, sessionFetch);
  const apiKeyClient = createApiClient(baseUrl, apiKeyFetch);
  const cronClient = createApiClient(baseUrl, cronFetch);
  const publicClient = createApiClient(baseUrl);

  // Create tracker
  const tracker = new TestDataTracker();

  // Create factories
  const factories = {
    agent: createAgentFactory(api, tracker),
    collection: createCollectionFactory(api, tracker),
  };

  cachedContext = {
    baseUrl,
    auth,
    api,
    apiKeyClient,
    cronClient,
    publicClient,
    sessionFetch,
    apiKeyFetch,
    cronFetch,
    factories,
    tracker,
  };

  return cachedContext;
}

/**
 * Reset the test context tracker
 *
 * Call this in afterAll() to clean up test data.
 */
export async function cleanupTestContext(): Promise<void> {
  if (cachedContext) {
    await cachedContext.tracker.cleanup();
  }
}

/**
 * Create a fresh test context with its own tracker
 *
 * Use this when you need isolated test data that won't
 * interfere with other tests.
 */
export function createFreshTestContext(): IntegrationTestContext {
  const baseUrl = process.env.TEST_BASE_URL || 'https://tpmjs.com';
  const auth = getTestAuthContext();

  const sessionFetch = createSessionFetch(auth.sessionToken);
  const apiKeyFetch = createApiKeyFetch(auth.apiKey);
  const cronFetch = createCronFetch();

  const api = createApiClient(baseUrl, sessionFetch);
  const apiKeyClient = createApiClient(baseUrl, apiKeyFetch);
  const cronClient = createApiClient(baseUrl, cronFetch);
  const publicClient = createApiClient(baseUrl);

  const tracker = new TestDataTracker();

  const factories = {
    agent: createAgentFactory(api, tracker),
    collection: createCollectionFactory(api, tracker),
  };

  return {
    baseUrl,
    auth,
    api,
    apiKeyClient,
    cronClient,
    publicClient,
    sessionFetch,
    apiKeyFetch,
    cronFetch,
    factories,
    tracker,
  };
}
