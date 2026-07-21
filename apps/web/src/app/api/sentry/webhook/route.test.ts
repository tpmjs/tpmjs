import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  const json = JSON.stringify(body);
  return new NextRequest('https://tpmjs.com/api/sentry/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: json,
  });
}

function hmac(secret: string, body: unknown): string {
  return createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
}

const MOCK_SECRET = 'test-webhook-secret';
const MOCK_GH_TOKEN = 'ghp_test123';
const MOCK_SENTRY_TOKEN = 'sntrys_test456';

function issueHeaders(body: unknown, resource = 'issue'): Record<string, string> {
  return {
    'sentry-hook-resource': resource,
    'sentry-hook-signature': hmac(MOCK_SECRET, body),
  };
}

const GH_ISSUES_URL = 'https://api.github.com/repos/tpmjs/tpmjs/issues';
const MOCK_GH_ISSUE_RESPONSE = { number: 42, html_url: 'https://github.com/tpmjs/tpmjs/issues/42' };

function urlOf(input: unknown): string {
  return typeof input === 'string' ? input : (input as Request).url;
}
function methodOf(init: { method?: string } | undefined): string {
  return (init?.method || 'GET').toUpperCase();
}
// Is this fetch call the GitHub issue-creation POST (vs. the dedup list GET)?
function isCreateCall([input, init]: [unknown, { method?: string } | undefined]): boolean {
  return urlOf(input) === GH_ISSUES_URL && methodOf(init) === 'POST';
}
// Is this fetch call the dedup lookup (GET .../issues?...)?
function isDedupCall([input, init]: [unknown, { method?: string } | undefined]): boolean {
  return urlOf(input).startsWith(`${GH_ISSUES_URL}?`) && methodOf(init) === 'GET';
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

let savedEnv: NodeJS.ProcessEnv;
let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  savedEnv = { ...process.env };
  process.env.SENTRY_WEBHOOK_SECRET = MOCK_SECRET;
  process.env.GITHUB_TOKEN_ISSUES = MOCK_GH_TOKEN;
  process.env.SENTRY_AUTH_TOKEN = MOCK_SENTRY_TOKEN;

  fetchSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);

  // Default: dedup lookup finds no existing issue (empty list); creation succeeds.
  fetchSpy.mockImplementation(async (input: unknown, init?: { method?: string }) => {
    if (isDedupCall([input, init])) {
      return new Response('[]', { status: 200 });
    }
    return new Response(JSON.stringify(MOCK_GH_ISSUE_RESPONSE), { status: 201 });
  });
});

afterEach(() => {
  process.env = savedEnv;
  vi.restoreAllMocks();
});

function createCall() {
  const call = fetchSpy.mock.calls.find((c) =>
    isCreateCall(c as [unknown, { method?: string } | undefined])
  );
  return call as [string, { method: string; body: string }] | undefined;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/sentry/webhook', () => {
  // 1. Settings validation (no resource/signature headers)
  it('returns ok for settings validation requests', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // 2. Missing env vars
  it('returns 500 when env vars are missing', async () => {
    delete process.env.SENTRY_WEBHOOK_SECRET;
    const body = {};
    const res = await POST(
      makeRequest(body, {
        'sentry-hook-resource': 'issue',
        'sentry-hook-signature': 'anything',
      })
    );
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Not configured' });
  });

  // 3. Missing signature header
  it('returns 401 when signature header is missing', async () => {
    const res = await POST(makeRequest({}, { 'sentry-hook-resource': 'issue' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Missing signature' });
  });

  // 4. Valid HMAC signature passes
  it('accepts requests with valid HMAC signature', async () => {
    const body = {
      action: 'created',
      data: {
        issue: {
          title: 'TypeError: Cannot read properties',
          culprit: 'src/app/page.tsx',
          level: 'error',
          platform: 'node',
          permalink: 'https://sentry.io/issues/123',
          firstSeen: '2025-01-01T00:00:00Z',
          count: 5,
        },
      },
    };
    const res = await POST(makeRequest(body, issueHeaders(body)));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.issue).toBe(42);
  });

  // 5. Invalid HMAC signature still processes (logs warning)
  it('processes requests with invalid signature (logs warning)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const body = {
      action: 'created',
      data: {
        issue: {
          title: 'Error',
          culprit: 'unknown',
          level: 'error',
        },
      },
    };
    const res = await POST(
      makeRequest(body, {
        'sentry-hook-resource': 'issue',
        'sentry-hook-signature': 'invalid-signature',
      })
    );
    expect(res.status).toBe(200);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Signature mismatch'));
  });

  // 6. Issue `created` → GitHub issue with auto-fix + production-error labels
  it('creates GitHub issue with correct labels for created event', async () => {
    const body = {
      action: 'created',
      data: {
        issue: {
          title: 'ReferenceError: foo is not defined',
          culprit: 'src/utils/foo.ts',
          level: 'error',
          platform: 'javascript',
          permalink: 'https://sentry.io/issues/456',
          firstSeen: '2025-06-01T12:00:00Z',
          count: 3,
        },
      },
    };
    const res = await POST(makeRequest(body, issueHeaders(body)));
    expect(res.status).toBe(200);

    const call = createCall();
    expect(call).toBeDefined();
    const ghBody = JSON.parse(call![1].body);
    expect(ghBody.title).toBe('[Sentry] ReferenceError: foo is not defined');
    expect(ghBody.labels).toEqual(['auto-fix', 'production-error']);
    expect(ghBody.body).toContain('src/utils/foo.ts');
  });

  // 7. Issue `regression` → adds regression label
  it('adds regression label for regression events', async () => {
    const body = {
      action: 'regression',
      data: {
        issue: {
          title: 'Regression bug',
          culprit: 'src/api/route.ts',
          level: 'error',
          platform: 'node',
          permalink: 'https://sentry.io/issues/789',
          firstSeen: '2025-06-01T12:00:00Z',
          count: 10,
        },
      },
    };
    const res = await POST(makeRequest(body, issueHeaders(body)));
    expect(res.status).toBe(200);

    const ghBody = JSON.parse(createCall()![1].body);
    expect(ghBody.labels).toEqual(['auto-fix', 'production-error', 'regression']);
    expect(ghBody.body).toContain('Regression');
    expect(ghBody.body).toContain('previously resolved');
  });

  // 8. Non-actionable issue event (`resolved`) → skips
  it('skips non-actionable issue events', async () => {
    const body = { action: 'resolved', data: { issue: { title: 'Fixed' } } };
    const res = await POST(makeRequest(body, issueHeaders(body)));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.skipped).toBe(true);
    expect(json.reason).toBe('issue/resolved');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // 9. Installation event → ok
  it('returns ok for installation events', async () => {
    const body = { action: 'installed', data: {} };
    const res = await POST(makeRequest(body, issueHeaders(body, 'installation')));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // 10. event_alert with event data → creates GitHub issue from event fields
  it('creates GitHub issue from event_alert with event data', async () => {
    const body = {
      action: 'triggered',
      data: {
        event: {
          title: 'Alert: high error rate',
          culprit: 'src/handler.ts',
          level: 'fatal',
          platform: 'node',
          web_url: 'https://sentry.io/events/abc',
          datetime: '2025-07-01T00:00:00Z',
        },
      },
    };
    const res = await POST(makeRequest(body, issueHeaders(body, 'event_alert')));
    expect(res.status).toBe(200);

    const ghBody = JSON.parse(createCall()![1].body);
    expect(ghBody.title).toBe('[Sentry] Alert: high error rate');
    expect(ghBody.labels).toEqual(['auto-fix', 'production-error']);
    expect(ghBody.body).toContain('fatal');
    expect(ghBody.body).toContain('src/handler.ts');
  });

  // 11. event_alert with Sentry API enrichment
  it('enriches event_alert with Sentry API issue details', async () => {
    const enrichedIssue = {
      title: 'Enriched title from API',
      culprit: 'src/enriched.ts',
      permalink: 'https://sentry.io/issues/enriched',
      firstSeen: '2025-01-01T00:00:00Z',
      count: 99,
    };

    fetchSpy.mockImplementation(async (input: unknown, init?: { method?: string }) => {
      if (urlOf(input) === 'https://sentry.io/api/0/issues/123/') {
        return new Response(JSON.stringify(enrichedIssue), { status: 200 });
      }
      if (isDedupCall([input, init])) {
        return new Response('[]', { status: 200 });
      }
      return new Response(JSON.stringify(MOCK_GH_ISSUE_RESPONSE), { status: 201 });
    });

    const body = {
      action: 'triggered',
      data: {
        event: {
          title: 'Original title',
          culprit: 'src/original.ts',
          level: 'error',
          issue_url: 'https://sentry.io/api/0/issues/123/',
        },
      },
    };
    const res = await POST(makeRequest(body, issueHeaders(body, 'event_alert')));
    expect(res.status).toBe(200);

    // Verify Sentry API enrichment was called with the auth token
    const enrichCall = fetchSpy.mock.calls.find(
      (c) => urlOf(c[0]) === 'https://sentry.io/api/0/issues/123/'
    );
    expect(enrichCall).toBeDefined();
    expect(enrichCall![1].headers.Authorization).toBe(`Bearer ${MOCK_SENTRY_TOKEN}`);

    // Verify GitHub issue uses enriched data
    const ghBody = JSON.parse(createCall()![1].body);
    expect(ghBody.title).toBe('[Sentry] Enriched title from API');
    expect(ghBody.body).toContain('src/enriched.ts');
    expect(ghBody.body).toContain('99');
  });

  // 11b. event_alert enrichment includes runtime tag when present
  it('includes runtime tag from Sentry API enrichment in GitHub issue body', async () => {
    const enrichedIssue = {
      title: 'Enriched with runtime',
      culprit: 'src/client.ts',
      permalink: 'https://sentry.io/issues/rt',
      firstSeen: '2025-01-01T00:00:00Z',
      count: 5,
      tags: [
        { key: 'runtime', value: 'browser' },
        { key: 'level', value: 'error' },
      ],
    };

    fetchSpy.mockImplementation(async (input: unknown, init?: { method?: string }) => {
      if (urlOf(input) === 'https://sentry.io/api/0/issues/rt/') {
        return new Response(JSON.stringify(enrichedIssue), { status: 200 });
      }
      if (isDedupCall([input, init])) {
        return new Response('[]', { status: 200 });
      }
      return new Response(JSON.stringify(MOCK_GH_ISSUE_RESPONSE), { status: 201 });
    });

    const body = {
      action: 'triggered',
      data: {
        event: {
          title: 'Original',
          culprit: 'src/original.ts',
          level: 'error',
          issue_url: 'https://sentry.io/api/0/issues/rt/',
        },
      },
    };
    const res = await POST(makeRequest(body, issueHeaders(body, 'event_alert')));
    expect(res.status).toBe(200);

    const ghBody = JSON.parse(createCall()![1].body);
    expect(ghBody.body).toContain('**Runtime:** browser');
  });

  // 11c. issue subscription includes runtime tag from tags array
  it('includes runtime tag from issue tags array in GitHub issue body', async () => {
    const body = {
      action: 'created',
      data: {
        issue: {
          title: 'Browser error',
          culprit: 'src/app/page.tsx',
          level: 'error',
          platform: 'javascript',
          permalink: 'https://sentry.io/issues/999',
          firstSeen: '2025-06-01T12:00:00Z',
          count: 1,
          tags: [{ key: 'runtime', value: 'browser' }],
        },
      },
    };
    const res = await POST(makeRequest(body, issueHeaders(body)));
    expect(res.status).toBe(200);

    const ghBody = JSON.parse(createCall()![1].body);
    expect(ghBody.body).toContain('**Runtime:** browser');
  });

  // 11d. runtime tag absent → not in issue body
  it('omits runtime line when tag is not present', async () => {
    const body = {
      action: 'created',
      data: {
        issue: {
          title: 'No runtime tag',
          culprit: 'src/server.ts',
          level: 'error',
          platform: 'node',
          permalink: 'https://sentry.io/issues/888',
          firstSeen: '2025-06-01T12:00:00Z',
          count: 1,
        },
      },
    };
    const res = await POST(makeRequest(body, issueHeaders(body)));
    expect(res.status).toBe(200);

    const ghBody = JSON.parse(createCall()![1].body);
    expect(ghBody.body).not.toContain('**Runtime:**');
  });

  // 12. event_alert without event data → skips
  it('skips event_alert without event data', async () => {
    const body = { action: 'triggered', data: {} };
    const res = await POST(makeRequest(body, issueHeaders(body, 'event_alert')));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.skipped).toBe(true);
    expect(json.reason).toBe('alert without event data');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // 13. Issue event without issue data in payload → skips
  it('skips issue event without issue data in payload', async () => {
    const body = { action: 'created', data: {} };
    const res = await POST(makeRequest(body, issueHeaders(body)));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.skipped).toBe(true);
    expect(json.reason).toBe('no issue data');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // 14. GitHub create API failure → 500 (dedup lookup succeeds/empty, create fails)
  it('returns 500 when GitHub API fails', async () => {
    fetchSpy.mockImplementation(async (input: unknown, init?: { method?: string }) => {
      if (isDedupCall([input, init])) {
        return new Response('[]', { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    });
    const body = {
      action: 'created',
      data: {
        issue: {
          title: 'Some error',
          culprit: 'src/fail.ts',
          level: 'error',
        },
      },
    };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST(makeRequest(body, issueHeaders(body)));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'GitHub issue creation failed' });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('GitHub issue creation failed'),
      expect.any(String)
    );
  });

  // 15. Dedup: an open auto-fix issue with the same title → skip creation
  it('skips creating a duplicate when an open auto-fix issue already exists', async () => {
    fetchSpy.mockImplementation(async (input: unknown, init?: { method?: string }) => {
      if (isDedupCall([input, init])) {
        return new Response(
          JSON.stringify([
            {
              number: 113,
              title: '[Sentry] PrismaClientInitializationError',
              html_url: 'https://github.com/tpmjs/tpmjs/issues/113',
            },
          ]),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify(MOCK_GH_ISSUE_RESPONSE), { status: 201 });
    });

    const body = {
      action: 'created',
      data: {
        issue: {
          title: 'PrismaClientInitializationError',
          culprit: 'src/[username]/page.tsx',
          level: 'error',
        },
      },
    };
    const res = await POST(makeRequest(body, issueHeaders(body)));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deduped).toBe(true);
    expect(json.issue).toBe(113);
    // No creation POST should have been made
    expect(createCall()).toBeUndefined();
  });

  // 16. Dedup lookup fails → fail open and still create (never drop a prod error)
  it('still creates the issue when the dedup lookup fails (fail-open)', async () => {
    fetchSpy.mockImplementation(async (input: unknown, init?: { method?: string }) => {
      if (isDedupCall([input, init])) {
        return new Response('rate limited', { status: 403 });
      }
      return new Response(JSON.stringify(MOCK_GH_ISSUE_RESPONSE), { status: 201 });
    });

    const body = {
      action: 'created',
      data: { issue: { title: 'Transient lookup failure', culprit: 'src/x.ts', level: 'error' } },
    };
    const res = await POST(makeRequest(body, issueHeaders(body)));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.issue).toBe(42);
    expect(json.deduped).toBeUndefined();
    expect(createCall()).toBeDefined();
  });
});
