/**
 * TPMJS Agent Sandbox Server (Deno)
 *
 * Stateful execution server with session-scoped filesystem persistence.
 * Based on the Railway executor but adds session management so files
 * created by one tool call persist for subsequent calls within the same conversation.
 */

// Import zod-to-json-schema for Zod v3 support
import { zodToJsonSchema } from 'https://esm.sh/zod-to-json-schema@3.25.0';

// ─── Crash Protection ───────────────────────────────────────────────────────
globalThis.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  console.error('⚠️  Unhandled promise rejection (caught, process continues):', event.reason);
});

globalThis.addEventListener('error', (event) => {
  console.error('⚠️  Uncaught error (caught, process continues):', event.error || event.message);
  event.preventDefault();
});

// ─── Configuration ──────────────────────────────────────────────────────────
const PORT = Number(Deno.env.get('PORT') || '3002');
const EXECUTOR_API_KEY = Deno.env.get('EXECUTOR_API_KEY');
const MAX_CONCURRENT_SESSIONS = Number(Deno.env.get('MAX_CONCURRENT_SESSIONS') || '50');
const DEFAULT_SESSION_TTL_SECONDS = Number(Deno.env.get('DEFAULT_SESSION_TTL_SECONDS') || '86400');
const SESSION_DISK_QUOTA_MB = Number(Deno.env.get('SESSION_DISK_QUOTA_MB') || '100');
const SESSIONS_BASE_DIR = '/tmp/tpmjs-sandbox/sessions';

// ─── Metrics ─────────────────────────────────────────────────────────────────

const metrics = {
  totalExecutions: 0,
  successfulExecutions: 0,
  failedExecutions: 0,
  totalSessionsCreated: 0,
  totalSessionsDestroyed: 0,
  startTime: Date.now(),
};

// Module cache
const CACHE_TTL_MS = 2 * 60 * 1000;
const MAX_CACHE_SIZE = 200;

interface CacheEntry {
  // biome-ignore lint/suspicious/noExplicitAny: Tool types are dynamic
  module: any;
  expiresAt: number;
  isFactory: boolean;
}

const moduleCache = new Map<string, CacheEntry>();

// ─── Session Management ─────────────────────────────────────────────────────

interface Session {
  sessionId: string;
  workDir: string;
  createdAt: Date;
  expiresAt: Date;
  toolCallCount: number;
}

const sessions = new Map<string, Session>();

function getSessionWorkDir(sessionId: string): string {
  // Sanitize sessionId to be filesystem-safe
  const safe = sessionId.replace(/[^a-zA-Z0-9_:-]/g, '_');
  return `${SESSIONS_BASE_DIR}/${safe}/workspace`;
}

async function createSession(
  sessionId: string,
  timeoutSeconds?: number
): Promise<Session & { resumed: boolean }> {
  const ttl = timeoutSeconds ?? DEFAULT_SESSION_TTL_SECONDS;

  // Idempotent: if session exists, extend TTL and return it
  const existing = sessions.get(sessionId);
  if (existing) {
    existing.expiresAt = new Date(Date.now() + ttl * 1000);
    console.log(`🔄 Session resumed: ${sessionId} (TTL extended to ${ttl}s)`);
    return { ...existing, resumed: true };
  }

  // Check concurrent session limit
  if (sessions.size >= MAX_CONCURRENT_SESSIONS) {
    throw new Error(
      `Maximum concurrent sessions reached (${MAX_CONCURRENT_SESSIONS}). Try again later.`
    );
  }

  const workDir = getSessionWorkDir(sessionId);

  // Create workspace directory
  await Deno.mkdir(workDir, { recursive: true });

  const session: Session = {
    sessionId,
    workDir,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + ttl * 1000),
    toolCallCount: 0,
  };

  sessions.set(sessionId, session);
  metrics.totalSessionsCreated++;
  console.log(`✅ Session created: ${sessionId} (TTL: ${ttl}s, workDir: ${workDir})`);

  return { ...session, resumed: false };
}

async function destroySession(sessionId: string): Promise<boolean> {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  sessions.delete(sessionId);

  // Clean up workspace directory
  try {
    await Deno.remove(session.workDir, { recursive: true });
    // Also remove parent directory (the sessionId dir)
    const parentDir = session.workDir.replace(/\/workspace$/, '');
    await Deno.remove(parentDir, { recursive: true }).catch(() => {});
  } catch {
    // Directory may already be cleaned up
  }

  metrics.totalSessionsDestroyed++;
  console.log(`🗑️  Session destroyed: ${sessionId}`);
  return true;
}

function getSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  // Check if expired
  if (new Date() > session.expiresAt) {
    // Mark for cleanup but don't block
    destroySession(sessionId).catch(() => {});
    return null;
  }

  return session;
}

// ─── Session Cleanup ────────────────────────────────────────────────────────

async function cleanupExpiredSessions(): Promise<void> {
  const now = new Date();
  let cleaned = 0;

  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      await destroySession(sessionId).catch(() => {});
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🗑️  Cleaned ${cleaned} expired sessions (${sessions.size} remaining)`);
  }
}

// Run session cleanup every 60 seconds
setInterval(cleanupExpiredSessions, 60 * 1000);

// ─── Module Cache ───────────────────────────────────────────────────────────

function getCachedModule(cacheKey: string): CacheEntry | null {
  const entry = moduleCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    moduleCache.delete(cacheKey);
    return null;
  }
  return entry;
}

// biome-ignore lint/suspicious/noExplicitAny: Tool types are dynamic
function setCachedModule(cacheKey: string, module: any, isFactory: boolean): void {
  if (moduleCache.size >= MAX_CACHE_SIZE) {
    const entriesToEvict = Math.max(1, Math.floor(MAX_CACHE_SIZE * 0.2));
    const keys = Array.from(moduleCache.keys());
    for (let i = 0; i < entriesToEvict && i < keys.length; i++) {
      moduleCache.delete(keys[i]);
    }
  }
  moduleCache.set(cacheKey, {
    module,
    expiresAt: Date.now() + CACHE_TTL_MS,
    isFactory,
  });
}

function cleanupExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of moduleCache.entries()) {
    if (now > entry.expiresAt) {
      moduleCache.delete(key);
    }
  }
}

setInterval(cleanupExpiredCache, 60 * 1000);

// ─── Auth Middleware ─────────────────────────────────────────────────────────

// Fail-closed: if the key is unset, all requests are refused — a missing env
// var must never expose arbitrary code execution. For local development only,
// set EXECUTOR_ALLOW_UNAUTHENTICATED=true to run without a key.
function checkAuth(req: Request): boolean {
  if (!EXECUTOR_API_KEY) {
    return Deno.env.get('EXECUTOR_ALLOW_UNAUTHENTICATED') === 'true';
  }
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === EXECUTOR_API_KEY;
}

// ─── CORS Headers ───────────────────────────────────────────────────────────

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ─── Built-in Sandbox Shell Tools ────────────────────────────────────────────
// These are built into the server to avoid loading @tpmjs/sandbox-shell from esm.sh.
// They implement the 4 sandbox tools: shellExec, readFile, writeFile, listFiles.

const SHELL_MAX_STDOUT = 100 * 1024; // 100 KB
const SHELL_MAX_READ_SIZE = 500 * 1024; // 500 KB
const SHELL_DEFAULT_TIMEOUT_MS = 30_000;
const SHELL_MAX_TIMEOUT_MS = 300_000;
const SHELL_MAX_LIST_ENTRIES = 1_000;
const SHELL_DEFAULT_MAX_DEPTH = 3;

function resolveSandboxPath(workDir: string, relativePath: string): string {
  const cleaned = relativePath.replace(/^\/+/, '');
  const resolved = `${workDir}/${cleaned}`.replace(/\/+/g, '/');
  const parts = resolved.split('/');
  const normalized: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      normalized.pop();
    } else if (part !== '.' && part !== '') {
      normalized.push(part);
    }
  }
  const final = '/' + normalized.join('/');
  const normalizedWorkDir = '/' + workDir.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!final.startsWith(normalizedWorkDir)) {
    throw new Error(`Path escapes sandbox workspace: ${relativePath}`);
  }
  return final;
}

function truncateText(text: string, maxBytes: number): { text: string; truncated: boolean } {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  if (bytes.length <= maxBytes) {
    return { text, truncated: false };
  }
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return {
    text: decoder.decode(bytes.slice(0, maxBytes)) + '\n... [truncated]',
    truncated: true,
  };
}

async function collectStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number = SHELL_MAX_STDOUT * 2
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
      if (totalLength > maxBytes) {
        reader.cancel().catch(() => {});
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }
  const cappedLength = Math.min(totalLength, maxBytes);
  const result = new Uint8Array(cappedLength);
  let offset = 0;
  for (const chunk of chunks) {
    const copyLen = Math.min(chunk.length, cappedLength - offset);
    if (copyLen <= 0) break;
    result.set(chunk.subarray(0, copyLen), offset);
    offset += copyLen;
  }
  return result.subarray(0, offset);
}

// biome-ignore lint/suspicious/noExplicitAny: Built-in tool params are dynamic
const builtinSandboxTools: Record<string, { execute: (params: any) => Promise<any> }> = {
  shellExec: {
    async execute({ command, timeout, _sandboxWorkDir }) {
      if (!_sandboxWorkDir) {
        throw new Error('shellExec requires a sandbox session (_sandboxWorkDir not set)');
      }
      const timeoutMs = Math.min(
        Math.max(timeout ?? SHELL_DEFAULT_TIMEOUT_MS, 1000),
        SHELL_MAX_TIMEOUT_MS
      );
      const startTime = Date.now();
      const cmd = new Deno.Command('sh', {
        args: ['-c', command],
        cwd: _sandboxWorkDir,
        stdout: 'piped',
        stderr: 'piped',
      });
      const child = cmd.spawn();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        try {
          child.kill('SIGTERM');
          setTimeout(() => {
            try {
              child.kill('SIGKILL');
            } catch {
              // Already exited
            }
          }, 2000);
        } catch {
          // Process may have already exited
        }
      }, timeoutMs);
      try {
        const [stdoutBytes, stderrBytes, status] = await Promise.all([
          collectStream(child.stdout),
          collectStream(child.stderr),
          child.status,
        ]);
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const stdoutRaw = decoder.decode(stdoutBytes);
        const stderrRaw = decoder.decode(stderrBytes);
        const stdout = truncateText(stdoutRaw, SHELL_MAX_STDOUT);
        const stderr = truncateText(stderrRaw, SHELL_MAX_STDOUT);
        return {
          stdout: stdout.text,
          stderr: timedOut ? `[TIMEOUT after ${timeoutMs}ms] ${stderr.text}` : stderr.text,
          exitCode: timedOut ? 137 : status.code,
          durationMs,
          truncated: stdout.truncated || stderr.truncated,
        };
      } catch (error) {
        clearTimeout(timer);
        throw new Error(
          `Shell execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
  },

  readFile: {
    async execute({ path: filePath, _sandboxWorkDir }) {
      if (!_sandboxWorkDir) {
        throw new Error('readFile requires a sandbox session (_sandboxWorkDir not set)');
      }
      const resolved = resolveSandboxPath(_sandboxWorkDir, filePath);
      try {
        const realPath = await Deno.realPath(resolved);
        const normalizedWorkDir = '/' + _sandboxWorkDir.replace(/^\/+/, '').replace(/\/+$/, '');
        if (!realPath.startsWith(normalizedWorkDir)) {
          throw new Error(`Path escapes sandbox workspace via symlink: ${filePath}`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('escapes sandbox')) {
          throw error;
        }
      }
      const content = await Deno.readTextFile(resolved);
      const { text, truncated } = truncateText(content, SHELL_MAX_READ_SIZE);
      const stat = await Deno.stat(resolved);
      return { content: text, path: filePath, size: stat.size, truncated };
    },
  },

  writeFile: {
    async execute({ path: filePath, content, createDirs = true, _sandboxWorkDir }) {
      if (!_sandboxWorkDir) {
        throw new Error('writeFile requires a sandbox session (_sandboxWorkDir not set)');
      }
      const resolved = resolveSandboxPath(_sandboxWorkDir, filePath);
      if (createDirs) {
        const parentDir = resolved.substring(0, resolved.lastIndexOf('/'));
        if (parentDir) {
          await Deno.mkdir(parentDir, { recursive: true });
        }
      }
      await Deno.writeTextFile(resolved, content);
      const encoder = new TextEncoder();
      const bytesWritten = encoder.encode(content).length;
      return { success: true, path: filePath, bytesWritten };
    },
  },

  listFiles: {
    async execute({ path: dirPath = '.', recursive = false, maxDepth, _sandboxWorkDir }) {
      if (!_sandboxWorkDir) {
        throw new Error('listFiles requires a sandbox session (_sandboxWorkDir not set)');
      }
      const effectiveMaxDepth = maxDepth ?? SHELL_DEFAULT_MAX_DEPTH;
      const resolved = resolveSandboxPath(_sandboxWorkDir, dirPath);
      // biome-ignore lint/suspicious/noExplicitAny: File entry type
      const entries: any[] = [];
      let truncated = false;
      const normalizedWorkDir = '/' + _sandboxWorkDir.replace(/^\/+/, '').replace(/\/+$/, '');

      async function walk(dir: string, depth: number, prefix: string): Promise<void> {
        if (entries.length >= SHELL_MAX_LIST_ENTRIES) {
          truncated = true;
          return;
        }
        for await (const entry of Deno.readDir(dir)) {
          if (entries.length >= SHELL_MAX_LIST_ENTRIES) {
            truncated = true;
            return;
          }
          const entryPath = `${dir}/${entry.name}`;
          const displayName = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isSymlink) {
            try {
              const realPath = await Deno.realPath(entryPath);
              if (!realPath.startsWith(normalizedWorkDir)) {
                continue;
              }
            } catch {
              continue;
            }
          }
          let size: number | null = null;
          if (entry.isFile) {
            try {
              const info = await Deno.stat(entryPath);
              size = info.size;
            } catch {
              // Permission or race condition
            }
          }
          entries.push({
            name: displayName,
            type: entry.isDirectory ? 'directory' : entry.isSymlink ? 'symlink' : 'file',
            size,
          });
          if (recursive && entry.isDirectory && depth < effectiveMaxDepth) {
            await walk(entryPath, depth + 1, displayName);
          }
        }
      }

      await walk(resolved, 0, '');
      return { path: dirPath, entries, truncated };
    },
  },
};

// ─── Tool Loading & Execution ───────────────────────────────────────────────

// biome-ignore lint/suspicious/noExplicitAny: Dynamic tool loading
async function loadTool(
  packageName: string,
  name: string,
  version: string,
  importUrl?: string
): Promise<any> {
  // Built-in sandbox tools — no esm.sh import needed
  if (packageName === '@tpmjs/sandbox-shell' || packageName === '@tpmjs/official-sandbox-shell') {
    const builtin = builtinSandboxTools[name];
    if (!builtin) {
      throw new Error(
        `Built-in sandbox tool "${name}" not found. Available: ${Object.keys(builtinSandboxTools).join(', ')}`
      );
    }
    return builtin;
  }
  const cacheKey = `${packageName}::${name}`;

  const cached = getCachedModule(cacheKey);
  if (cached) {
    return cached.module;
  }

  const url = importUrl || `https://esm.sh/${packageName}@${version}`;
  console.log(`📦 Importing: ${url}`);

  const module = await import(url);
  let rawExport = module[name];

  if (!rawExport) {
    throw new Error(
      `Export "${name}" not found in module. Available: ${Object.keys(module).join(', ')}`
    );
  }

  // Check if it's a factory function
  if (typeof rawExport === 'function' && !rawExport.description && !rawExport.execute) {
    console.log(`🏭 Detected factory function for ${cacheKey}, attempting to call...`);

    let factoryResult = null;

    // Strategy 1: no arguments
    try {
      factoryResult = rawExport();
      if (factoryResult?.description && factoryResult?.execute) {
        rawExport = factoryResult;
      } else {
        factoryResult = null;
      }
    } catch {
      factoryResult = null;
    }

    // Strategy 2: empty config object
    if (!factoryResult) {
      try {
        factoryResult = rawExport({});
        if (factoryResult?.description && factoryResult?.execute) {
          rawExport = factoryResult;
        }
      } catch {
        // Not a factory
      }
    }
  }

  const isFactory = rawExport !== module[name];
  setCachedModule(cacheKey, rawExport, isFactory);

  return rawExport;
}

// ─── Route Handlers ─────────────────────────────────────────────────────────

async function handleCreateSession(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { sessionId, timeoutSeconds } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return Response.json(
        { error: 'sessionId is required' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const session = await createSession(sessionId, timeoutSeconds);

    return Response.json(
      {
        sessionId: session.sessionId,
        workDir: session.workDir,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        resumed: session.resumed,
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create session';
    console.error('❌ Create session error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders() });
  }
}

function handleGetSession(sessionId: string): Response {
  const session = getSession(sessionId);

  if (!session) {
    return Response.json(
      { error: 'Session not found or expired' },
      { status: 404, headers: corsHeaders() }
    );
  }

  return Response.json(
    {
      sessionId: session.sessionId,
      workDir: session.workDir,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      toolCallCount: session.toolCallCount,
    },
    { status: 200, headers: corsHeaders() }
  );
}

async function handleDestroySession(sessionId: string): Promise<Response> {
  const destroyed = await destroySession(sessionId);

  return Response.json({ sessionId, destroyed }, { status: 200, headers: corsHeaders() });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Tool execution with session support
async function handleExecuteTool(req: Request): Promise<Response> {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { packageName, name, version, importUrl, params, env, sessionId } = body;

    if (!packageName || !name) {
      return Response.json(
        { success: false, error: 'Missing required fields: packageName, name' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Load the tool
    const tool = await loadTool(packageName, name, version || 'latest', importUrl);

    if (!tool || typeof tool.execute !== 'function') {
      return Response.json(
        { success: false, error: `"${name}" is not a valid tool (missing execute function)` },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Resolve session workspace for cwd if sessionId provided
    let cwd: string | undefined;
    if (sessionId) {
      const session = getSession(sessionId);
      if (session) {
        cwd = session.workDir;
        session.toolCallCount++;
        // Extend session TTL on each tool call
        session.expiresAt = new Date(Date.now() + DEFAULT_SESSION_TTL_SECONDS * 1000);
      }
    }

    // Enforce disk quota before execution
    if (cwd) {
      const usageKB = await getDirectorySizeKB(cwd);
      const quotaKB = SESSION_DISK_QUOTA_MB * 1024;
      if (usageKB > quotaKB) {
        return Response.json(
          {
            success: false,
            error: `Session disk quota exceeded: ${Math.round(usageKB / 1024)}MB / ${SESSION_DISK_QUOTA_MB}MB`,
            executionTimeMs: Date.now() - startTime,
          },
          { status: 413, headers: corsHeaders() }
        );
      }
    }

    // Set environment variables if provided
    if (env && typeof env === 'object') {
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === 'string') {
          Deno.env.set(key, value);
        }
      }
    }

    // Execute the tool, injecting cwd into params if session is active
    const executeParams = cwd ? { ...params, _sandboxWorkDir: cwd } : params;
    const output = await tool.execute(executeParams);

    // Clean up injected env vars
    if (env && typeof env === 'object') {
      for (const key of Object.keys(env)) {
        try {
          Deno.env.delete(key);
        } catch {
          // Some vars may be read-only
        }
      }
    }

    const executionTimeMs = Date.now() - startTime;
    metrics.totalExecutions++;
    metrics.successfulExecutions++;

    return Response.json(
      { success: true, output, executionTimeMs },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Execute tool error:', message);
    metrics.totalExecutions++;
    metrics.failedExecutions++;

    return Response.json(
      { success: false, error: message, executionTimeMs },
      { status: 200, headers: corsHeaders() }
    );
  }
}

// ─── Disk Quota Helper ──────────────────────────────────────────────────────

async function getDirectorySizeKB(dir: string): Promise<number> {
  try {
    const cmd = new Deno.Command('du', { args: ['-sk', dir], stdout: 'piped', stderr: 'piped' });
    const { stdout } = await cmd.output();
    const output = new TextDecoder().decode(stdout);
    const sizeKB = parseInt(output.split('\t')[0], 10);
    return isNaN(sizeKB) ? 0 : sizeKB;
  } catch {
    return 0;
  }
}

function handleMetrics(): Response {
  const memInfo = Deno.memoryUsage();
  return Response.json(
    {
      uptime: Date.now() - metrics.startTime,
      sessions: {
        active: sessions.size,
        max: MAX_CONCURRENT_SESSIONS,
        totalCreated: metrics.totalSessionsCreated,
        totalDestroyed: metrics.totalSessionsDestroyed,
      },
      executions: {
        total: metrics.totalExecutions,
        successful: metrics.successfulExecutions,
        failed: metrics.failedExecutions,
      },
      memory: {
        rss: memInfo.rss,
        heapUsed: memInfo.heapUsed,
        heapTotal: memInfo.heapTotal,
      },
      cache: {
        modules: moduleCache.size,
        maxSize: MAX_CACHE_SIZE,
      },
    },
    { status: 200, headers: corsHeaders() }
  );
}

function handleHealth(): Response {
  return Response.json(
    {
      status: 'ok',
      version: '1.0.0',
      info: {
        runtime: 'deno',
        denoVersion: Deno.version.deno,
        activeSessions: sessions.size,
        maxSessions: MAX_CONCURRENT_SESSIONS,
        cachedModules: moduleCache.size,
        capabilities: {
          sessions: true,
          executeToolWithSession: true,
        },
      },
    },
    { status: 200, headers: corsHeaders() }
  );
}

// ─── Request Router ─────────────────────────────────────────────────────────

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Health check (no auth required)
  if (pathname === '/health' && method === 'GET') {
    return handleHealth();
  }

  // Metrics (no auth required, for monitoring)
  if (pathname === '/metrics' && method === 'GET') {
    return handleMetrics();
  }

  // Auth check for all other routes
  if (!checkAuth(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  }

  // Session endpoints
  if (pathname === '/sessions' && method === 'POST') {
    return handleCreateSession(req);
  }

  const sessionMatch = pathname.match(/^\/sessions\/(.+)$/);
  if (sessionMatch) {
    const sessionId = decodeURIComponent(sessionMatch[1]);
    if (method === 'GET') {
      return handleGetSession(sessionId);
    }
    if (method === 'DELETE') {
      return handleDestroySession(sessionId);
    }
  }

  // Tool execution
  if (pathname === '/execute-tool' && method === 'POST') {
    return handleExecuteTool(req);
  }

  return Response.json({ error: 'Not Found' }, { status: 404, headers: corsHeaders() });
}

// ─── Server Startup ─────────────────────────────────────────────────────────

// Ensure sessions directory exists
try {
  await Deno.mkdir(SESSIONS_BASE_DIR, { recursive: true });
} catch {
  // May already exist
}

// Clean up orphaned session directories from previous server runs
async function cleanupOrphanedSessions(): Promise<void> {
  try {
    let cleaned = 0;
    for await (const entry of Deno.readDir(SESSIONS_BASE_DIR)) {
      if (entry.isDirectory && !sessions.has(entry.name)) {
        const dir = `${SESSIONS_BASE_DIR}/${entry.name}`;
        await Deno.remove(dir, { recursive: true }).catch(() => {});
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`🗑️  Cleaned ${cleaned} orphaned session directories from previous run`);
    }
  } catch {
    // Directory may be empty or inaccessible
  }
}
await cleanupOrphanedSessions();

console.log(`🚀 TPMJS Agent Sandbox Server starting on port ${PORT}`);
console.log(`📁 Sessions base dir: ${SESSIONS_BASE_DIR}`);
console.log(`🔒 Auth: ${EXECUTOR_API_KEY ? 'enabled' : 'disabled'}`);
console.log(`📊 Max sessions: ${MAX_CONCURRENT_SESSIONS}, TTL: ${DEFAULT_SESSION_TTL_SECONDS}s`);

Deno.serve({ port: PORT }, handler);

// ─── Graceful Shutdown ──────────────────────────────────────────────────────

async function shutdown(signal: string) {
  console.log(`\n${signal} received. Cleaning up ${sessions.size} sessions...`);

  // Destroy all sessions
  for (const sessionId of sessions.keys()) {
    await destroySession(sessionId).catch(() => {});
  }

  console.log('✅ Cleanup complete. Exiting.');
  Deno.exit(0);
}

Deno.addSignalListener('SIGTERM', () => shutdown('SIGTERM'));
Deno.addSignalListener('SIGINT', () => shutdown('SIGINT'));
