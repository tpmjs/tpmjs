/**
 * HTTP client for the sandbox server API
 *
 * Purpose-built for the sandbox server's Bearer token auth,
 * separate from the web app's api-client.ts (which uses session cookies / API keys).
 */

// ─── Response Types ──────────────────────────────────────────────────────────

export interface SandboxHealthResponse {
  status: string;
  version: string;
  info: {
    runtime: string;
    denoVersion: string;
    activeSessions: number;
    maxSessions: number;
    cachedModules: number;
    capabilities: {
      sessions: boolean;
      executeToolWithSession: boolean;
    };
  };
}

export interface SandboxMetricsResponse {
  uptime: number;
  sessions: {
    active: number;
    max: number;
    totalCreated: number;
    totalDestroyed: number;
  };
  executions: {
    total: number;
    successful: number;
    failed: number;
  };
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  cache: {
    modules: number;
    maxSize: number;
  };
}

export interface SandboxSessionResponse {
  sessionId: string;
  workDir: string;
  createdAt: string;
  expiresAt: string;
  resumed?: boolean;
  toolCallCount?: number;
}

export interface SandboxExecuteResponse {
  success: boolean;
  output?: unknown;
  error?: string;
  executionTimeMs: number;
}

export interface SandboxErrorResponse {
  error: string;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface SandboxClientOptions {
  baseUrl: string;
  apiKey?: string;
}

export function createSandboxClient(options: SandboxClientOptions) {
  const { baseUrl, apiKey } = options;
  const normalizedUrl = baseUrl.replace(/\/$/, '');

  function authHeaders(): Record<string, string> {
    if (!apiKey) return {};
    return { Authorization: `Bearer ${apiKey}` };
  }

  async function parseJson<T>(response: Response): Promise<T> {
    return response.json() as Promise<T>;
  }

  return {
    /** GET /health — no auth required */
    async health(): Promise<{ status: number; data: SandboxHealthResponse }> {
      const res = await fetch(`${normalizedUrl}/health`);
      const data = await parseJson<SandboxHealthResponse>(res);
      return { status: res.status, data };
    },

    /** GET /metrics — no auth required */
    async metrics(): Promise<{ status: number; data: SandboxMetricsResponse }> {
      const res = await fetch(`${normalizedUrl}/metrics`);
      const data = await parseJson<SandboxMetricsResponse>(res);
      return { status: res.status, data };
    },

    /** POST /sessions — create or resume a session */
    async createSession(
      sessionId: string,
      timeoutSeconds?: number
    ): Promise<{ status: number; data: SandboxSessionResponse }> {
      const res = await fetch(`${normalizedUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ sessionId, timeoutSeconds }),
      });
      const data = await parseJson<SandboxSessionResponse>(res);
      return { status: res.status, data };
    },

    /** GET /sessions/:id — get session info */
    async getSession(
      sessionId: string
    ): Promise<{ status: number; data: SandboxSessionResponse | SandboxErrorResponse }> {
      const res = await fetch(`${normalizedUrl}/sessions/${encodeURIComponent(sessionId)}`, {
        headers: authHeaders(),
      });
      const data = await parseJson<SandboxSessionResponse | SandboxErrorResponse>(res);
      return { status: res.status, data };
    },

    /** DELETE /sessions/:id — destroy a session */
    async destroySession(
      sessionId: string
    ): Promise<{ status: number; data: { sessionId: string; destroyed: boolean } }> {
      const res = await fetch(`${normalizedUrl}/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await parseJson<{ sessionId: string; destroyed: boolean }>(res);
      return { status: res.status, data };
    },

    /** POST /execute-tool — execute a tool within a session */
    async executeTool(opts: {
      packageName: string;
      name: string;
      version?: string;
      params: Record<string, unknown>;
      sessionId?: string;
      env?: Record<string, string>;
    }): Promise<{ status: number; data: SandboxExecuteResponse }> {
      const res = await fetch(`${normalizedUrl}/execute-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(opts),
      });
      const data = await parseJson<SandboxExecuteResponse>(res);
      return { status: res.status, data };
    },

    /** Raw request — for auth testing without auto-injecting token */
    async rawRequest(
      method: string,
      path: string,
      opts?: { body?: unknown; headers?: Record<string, string> }
    ): Promise<Response> {
      const headers: Record<string, string> = { ...opts?.headers };
      if (opts?.body !== undefined) {
        headers['Content-Type'] = 'application/json';
      }
      return fetch(`${normalizedUrl}${path}`, {
        method,
        headers,
        body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
    },
  };
}

export type SandboxClient = ReturnType<typeof createSandboxClient>;
