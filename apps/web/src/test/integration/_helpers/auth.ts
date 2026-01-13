/**
 * Authentication helpers for integration tests
 *
 * Provides utilities for creating authenticated fetch functions
 * using session tokens, API keys, or cron secrets.
 */

export interface TestAuthContext {
  userId: string;
  username: string;
  sessionToken: string;
  apiKey: string;
}

/**
 * Get test authentication context from environment variables
 */
export function getTestAuthContext(): TestAuthContext {
  const sessionToken = process.env.INTEGRATION_TEST_SESSION_TOKEN;
  const apiKey = process.env.INTEGRATION_TEST_API_KEY;
  const userId = process.env.INTEGRATION_TEST_USER_ID || 'test-user-id';
  const username = process.env.INTEGRATION_TEST_USERNAME || 'tpmjs-integration-test';

  if (!sessionToken) {
    throw new Error(
      'INTEGRATION_TEST_SESSION_TOKEN not set. Run `pnpm --filter=@tpmjs/web test:setup-credentials` to generate.'
    );
  }

  if (!apiKey) {
    throw new Error(
      'INTEGRATION_TEST_API_KEY not set. Run `pnpm --filter=@tpmjs/web test:setup-credentials` to generate.'
    );
  }

  return {
    userId,
    username,
    sessionToken,
    apiKey,
  };
}

/**
 * Create a fetch function with session cookie authentication
 *
 * Note: better-auth uses different cookie names for HTTP vs HTTPS:
 * - HTTP: better-auth.session_token
 * - HTTPS: __Secure-better-auth.session_token
 *
 * We send both to ensure compatibility.
 */
export function createSessionFetch(sessionToken: string): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    // Send both cookie formats to work with both HTTP and HTTPS
    headers.set(
      'Cookie',
      `better-auth.session_token=${sessionToken}; __Secure-better-auth.session_token=${sessionToken}`
    );

    return fetch(input, {
      ...init,
      headers,
    });
  };
}

/**
 * Create a fetch function with API key authentication
 */
export function createApiKeyFetch(apiKey: string): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${apiKey}`);

    return fetch(input, {
      ...init,
      headers,
    });
  };
}

/**
 * Create a fetch function with cron secret authentication
 */
export function createCronFetch(cronSecret?: string): typeof fetch {
  const secret = cronSecret || process.env.CRON_SECRET;

  if (!secret) {
    throw new Error('CRON_SECRET not set');
  }

  return (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${secret}`);

    return fetch(input, {
      ...init,
      headers,
    });
  };
}

/**
 * Create all authenticated fetch functions
 */
export function createAuthenticatedFetches(auth: TestAuthContext): {
  sessionFetch: typeof fetch;
  apiKeyFetch: typeof fetch;
  cronFetch: typeof fetch;
} {
  return {
    sessionFetch: createSessionFetch(auth.sessionToken),
    apiKeyFetch: createApiKeyFetch(auth.apiKey),
    cronFetch: createCronFetch(),
  };
}
