/**
 * Unsandbox Code Execution Tools for TPMJS
 * Execute code in a secure sandbox environment supporting 42+ languages.
 *
 * @requires UNSANDBOX_PUBLIC_KEY environment variable (unsb-pk-xxxx-xxxx-xxxx-xxxx)
 * @requires UNSANDBOX_SECRET_KEY environment variable (unsb-sk-xxxxx-xxxxx-xxxxx-xxxxx)
 */

import { createHmac } from 'node:crypto';
import { jsonSchema, tool } from 'ai';

const UNSANDBOX_API_BASE = 'https://api.unsandbox.com';

/**
 * Supported programming languages
 */
export const SUPPORTED_LANGUAGES = [
  'python',
  'javascript',
  'typescript',
  'ruby',
  'perl',
  'php',
  'lua',
  'bash',
  'r',
  'elixir',
  'erlang',
  'tcl',
  'scheme',
  'powershell',
  'clojure',
  'commonlisp',
  'crystal',
  'groovy',
  'deno',
  'awk',
  'raku',
  'c',
  'cpp',
  'go',
  'rust',
  'java',
  'kotlin',
  'cobol',
  'fortran',
  'd',
  'zig',
  'nim',
  'v',
  'objc',
  'dart',
  'julia',
  'haskell',
  'ocaml',
  'fsharp',
  'csharp',
  'prolog',
  'forth',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type NetworkMode = 'zerotrust' | 'semitrusted';

export type JobStatus = 'pending' | 'running' | 'completed' | 'cancelled' | 'timeout' | 'failed';

export interface InputFile {
  filename: string;
  content: string; // Base64 encoded
}

export interface Artifact {
  type: 'base64';
  filename: string;
  data: string;
}

/**
 * Get API keys from environment variables
 */
function getApiKeys(): { publicKey: string; secretKey: string } {
  const publicKey = process.env.UNSANDBOX_PUBLIC_KEY;
  const secretKey = process.env.UNSANDBOX_SECRET_KEY;

  if (!publicKey) {
    throw new Error(
      'UNSANDBOX_PUBLIC_KEY environment variable is required. Get your API keys from https://unsandbox.com/pricing-for-agents'
    );
  }

  if (!secretKey) {
    throw new Error(
      'UNSANDBOX_SECRET_KEY environment variable is required. Get your API keys from https://unsandbox.com/pricing-for-agents'
    );
  }

  return { publicKey, secretKey };
}

/**
 * Compute HMAC-SHA256 signature for API authentication
 * Message format: "{timestamp}:{METHOD}:{path}:{body}"
 */
function computeSignature(
  secretKey: string,
  timestamp: number,
  method: string,
  path: string,
  body: string
): string {
  const message = `${timestamp}:${method}:${path}:${body}`;
  return createHmac('sha256', secretKey).update(message).digest('hex').toLowerCase();
}

/**
 * Make an authenticated request to the Unsandbox API
 */
async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const { publicKey, secretKey } = getApiKeys();
  const timestamp = Math.floor(Date.now() / 1000);
  const bodyString = body !== undefined ? JSON.stringify(body) : '';
  const signature = computeSignature(secretKey, timestamp, method, path, bodyString);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${publicKey}`,
    'X-Timestamp': timestamp.toString(),
    'X-Signature': signature,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${UNSANDBOX_API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? bodyString : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    handleApiError(response.status, errorText);
  }

  return response.json() as Promise<T>;
}

/**
 * Handle API errors with specific messages for common HTTP status codes
 */
function handleApiError(status: number, errorText: string): never {
  switch (status) {
    case 400:
      throw new Error(`Bad request: ${errorText}`);
    case 401:
      throw new Error(
        `Authentication failed: Invalid API keys. Ensure UNSANDBOX_PUBLIC_KEY and UNSANDBOX_SECRET_KEY are correct.`
      );
    case 403:
      throw new Error(`Access forbidden: ${errorText}`);
    case 404:
      throw new Error(`Resource not found: ${errorText}`);
    case 429:
      throw new Error(`Rate limit exceeded or concurrency limit reached: ${errorText}`);
    case 500:
    case 502:
    case 503:
      throw new Error(`Unsandbox service error (${status}): ${errorText}`);
    default:
      throw new Error(`Unsandbox API error: HTTP ${status} - ${errorText}`);
  }
}

/**
 * Make an authenticated request with text/plain body (for /run endpoints)
 */
async function apiRequestText<T>(path: string, body: string): Promise<T> {
  const { publicKey, secretKey } = getApiKeys();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = computeSignature(secretKey, timestamp, 'POST', path, body);

  const response = await fetch(`${UNSANDBOX_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      Authorization: `Bearer ${publicKey}`,
      'X-Timestamp': timestamp.toString(),
      'X-Signature': signature,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    handleApiError(response.status, errorText);
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// Execute Async
// ============================================================================

export interface ExecuteAsyncInput {
  language: string;
  code: string;
  input_files?: InputFile[];
  env?: Record<string, string>;
  network_mode?: NetworkMode;
  ttl?: number;
  vcpu?: number;
  return_artifact?: boolean;
  return_wasm_artifact?: boolean;
}

export interface ExecuteAsyncResult {
  job_id: string;
  status: 'pending';
  message: string;
}

/**
 * Execute code asynchronously in a secure sandbox.
 * Returns a job_id immediately. Use getJob to check status and retrieve results.
 * Supports 42+ languages including Python, JavaScript, TypeScript, Go, Rust, C, C++, Java, Ruby, and more.
 */
export const executeCodeAsync = tool({
  description:
    'Execute code asynchronously in a secure sandbox. Returns a job_id immediately. Use getJob to check status and retrieve results. Supports 42+ languages including Python, JavaScript, TypeScript, Go, Rust, C, C++, Java, Ruby, and more.',
  inputSchema: jsonSchema<ExecuteAsyncInput>({
    type: 'object',
    properties: {
      language: {
        type: 'string',
        description:
          'Programming language to execute. Supported: python, javascript, typescript, ruby, perl, php, lua, bash, r, elixir, erlang, tcl, scheme, powershell, clojure, commonlisp, crystal, groovy, deno, awk, raku, c, cpp, go, rust, java, kotlin, cobol, fortran, d, zig, nim, v, objc, dart, julia, haskell, ocaml, fsharp, csharp, prolog, forth.',
      },
      code: {
        type: 'string',
        description: 'The source code to execute.',
      },
      input_files: {
        type: 'array',
        description: 'Optional array of input files to make available in /tmp/input/.',
        items: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Name of the file.',
            },
            content: {
              type: 'string',
              description: 'Base64-encoded file content.',
            },
          },
          required: ['filename', 'content'],
        },
      },
      env: {
        type: 'object',
        description: 'Environment variables as key-value pairs.',
        additionalProperties: { type: 'string' },
      },
      network_mode: {
        type: 'string',
        enum: ['zerotrust', 'semitrusted'],
        description:
          'Network isolation mode. "zerotrust" (default) blocks all network. "semitrusted" allows outbound.',
      },
      ttl: {
        type: 'number',
        description: 'Execution timeout in seconds (1-900). Default: 60.',
      },
      vcpu: {
        type: 'number',
        description: 'Number of vCPUs (1-8). Each vCPU includes 2GB RAM. Default: 1.',
      },
      return_artifact: {
        type: 'boolean',
        description: 'For compiled languages, return the compiled binary.',
      },
      return_wasm_artifact: {
        type: 'boolean',
        description: 'Compile to WebAssembly. Supported for C, C++, Rust, Zig, Go.',
      },
    },
    required: ['language', 'code'],
    additionalProperties: false,
  }),
  async execute(input: ExecuteAsyncInput): Promise<ExecuteAsyncResult> {
    if (!input.language || typeof input.language !== 'string') {
      throw new Error('Language is required and must be a string');
    }

    const normalizedLanguage = input.language.toLowerCase();
    if (!SUPPORTED_LANGUAGES.includes(normalizedLanguage as SupportedLanguage)) {
      throw new Error(
        `Unsupported language: "${input.language}". Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`
      );
    }

    if (!input.code || typeof input.code !== 'string') {
      throw new Error('Code is required and must be a string');
    }

    // Default TTL to 60 seconds if not provided (API default)
    const ttl = input.ttl ?? 60;
    if (ttl < 1 || ttl > 900) {
      throw new Error('TTL must be between 1 and 900 seconds');
    }

    if (input.vcpu !== undefined && (input.vcpu < 1 || input.vcpu > 8)) {
      throw new Error('vCPU must be between 1 and 8');
    }

    // Default network_mode to 'zerotrust' (most secure)
    const networkMode = input.network_mode ?? 'zerotrust';

    const requestBody: Record<string, unknown> = {
      language: normalizedLanguage,
      code: input.code,
      network_mode: networkMode,
      ttl,
    };

    if (input.input_files) {
      requestBody.input_files = input.input_files;
    }

    if (input.env) {
      requestBody.env = input.env;
    }

    if (input.vcpu) {
      requestBody.vcpu = input.vcpu;
    }

    if (input.return_artifact) {
      requestBody.return_artifact = input.return_artifact;
    }

    if (input.return_wasm_artifact) {
      requestBody.return_wasm_artifact = input.return_wasm_artifact;
    }

    // Call the Unsandbox API POST /execute/async endpoint
    const result = await apiRequest<ExecuteAsyncResult>('POST', '/execute/async', requestBody);

    return {
      job_id: result.job_id,
      status: 'pending',
      message: result.message || 'Job accepted for execution',
    };
  },
});

// ============================================================================
// Get Job
// ============================================================================

export interface GetJobInput {
  job_id: string;
}

export interface GetJobResult {
  job_id: string;
  status: JobStatus;
  language?: string;
  network_mode?: string;
  stdout?: string;
  stderr?: string;
  exit_code?: number;
  total_time_ms?: number;
  error?: string;
  artifacts?: Artifact[];
  artifact?: Artifact;
  wasm_artifact?: Artifact;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  success?: boolean;
}

/**
 * Get the status and results of an async code execution job.
 * Poll this endpoint until status is 'completed' or 'failed'.
 */
export const getJob = tool({
  description:
    "Get the status and results of an async code execution job. Poll this endpoint until status is 'completed', 'failed', 'cancelled', or 'timeout'.",
  inputSchema: jsonSchema<GetJobInput>({
    type: 'object',
    properties: {
      job_id: {
        type: 'string',
        description: 'The job ID returned from executeCodeAsync',
      },
    },
    required: ['job_id'],
    additionalProperties: false,
  }),
  async execute(input: GetJobInput): Promise<GetJobResult> {
    if (!input.job_id || typeof input.job_id !== 'string') {
      throw new Error('job_id is required and must be a string');
    }

    const result = await apiRequest<GetJobResult>(
      'GET',
      `/jobs/${encodeURIComponent(input.job_id)}`,
      undefined
    );

    return {
      job_id: result.job_id || input.job_id,
      status: result.status,
      language: result.language,
      network_mode: result.network_mode,
      stdout: result.stdout,
      stderr: result.stderr,
      exit_code: result.exit_code,
      total_time_ms: result.total_time_ms,
      error: result.error,
      artifacts: result.artifacts,
      artifact: result.artifact,
      wasm_artifact: result.wasm_artifact,
      created_at: result.created_at,
      started_at: result.started_at,
      completed_at: result.completed_at,
      success: result.success,
    };
  },
});

// ============================================================================
// Execute Sync
// ============================================================================

export interface ExecuteSyncInput {
  language: string;
  code: string;
  input_files?: InputFile[];
  env?: Record<string, string>;
  network_mode?: NetworkMode;
  ttl?: number;
  vcpu?: number;
  return_artifact?: boolean;
  return_wasm_artifact?: boolean;
}

export interface ExecuteSyncResult {
  job_id: string;
  language: string;
  network_mode: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  total_time_ms: number;
  success: boolean;
  artifact?: Artifact;
  wasm_artifact?: Artifact;
}

/**
 * Execute code synchronously in a secure sandbox.
 * Blocks until execution completes and returns results directly.
 * Best for quick scripts under 60 seconds.
 */
export const execute = tool({
  description:
    'Execute code synchronously in a secure sandbox. Blocks until execution completes and returns results directly. Best for quick scripts under 60 seconds.',
  inputSchema: jsonSchema<ExecuteSyncInput>({
    type: 'object',
    properties: {
      language: {
        type: 'string',
        description: 'Programming language to execute',
      },
      code: {
        type: 'string',
        description: 'The source code to execute',
      },
      input_files: {
        type: 'array',
        description: 'Optional array of input files to make available in /tmp/input/',
        items: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            content: { type: 'string' },
          },
          required: ['filename', 'content'],
        },
      },
      env: {
        type: 'object',
        description: 'Environment variables as key-value pairs.',
        additionalProperties: { type: 'string' },
      },
      network_mode: {
        type: 'string',
        enum: ['zerotrust', 'semitrusted'],
        description: "Network isolation mode. Default: 'zerotrust'",
      },
      ttl: {
        type: 'number',
        description: 'Execution timeout in seconds (1-900). Default: 60.',
      },
      vcpu: {
        type: 'number',
        description: 'Number of vCPUs (1-8). Each vCPU includes 2GB RAM. Default: 1.',
      },
      return_artifact: {
        type: 'boolean',
        description: 'For compiled languages, return the compiled binary.',
      },
      return_wasm_artifact: {
        type: 'boolean',
        description: 'Compile to WebAssembly. Supported for C, C++, Rust, Zig, Go.',
      },
    },
    required: ['language', 'code'],
    additionalProperties: false,
  }),
  async execute(input: ExecuteSyncInput): Promise<ExecuteSyncResult> {
    if (!input.language || typeof input.language !== 'string') {
      throw new Error('Language is required and must be a string');
    }

    const normalizedLanguage = input.language.toLowerCase();
    if (!SUPPORTED_LANGUAGES.includes(normalizedLanguage as SupportedLanguage)) {
      throw new Error(
        `Unsupported language: "${input.language}". Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`
      );
    }

    if (!input.code || typeof input.code !== 'string') {
      throw new Error('Code is required and must be a string');
    }

    // Default TTL to 60 seconds if not provided (API default)
    const ttl = input.ttl ?? 60;
    if (ttl < 1 || ttl > 900) {
      throw new Error('TTL must be between 1 and 900 seconds');
    }

    if (input.vcpu !== undefined && (input.vcpu < 1 || input.vcpu > 8)) {
      throw new Error('vCPU must be between 1 and 8');
    }

    // Default network_mode to 'zerotrust' (most secure)
    const networkMode = input.network_mode ?? 'zerotrust';

    const requestBody: Record<string, unknown> = {
      language: normalizedLanguage,
      code: input.code,
      network_mode: networkMode,
      ttl,
    };

    if (input.input_files) {
      requestBody.input_files = input.input_files;
    }

    if (input.env) {
      requestBody.env = input.env;
    }

    if (input.vcpu) {
      requestBody.vcpu = input.vcpu;
    }

    if (input.return_artifact) {
      requestBody.return_artifact = input.return_artifact;
    }

    if (input.return_wasm_artifact) {
      requestBody.return_wasm_artifact = input.return_wasm_artifact;
    }

    // Call the Unsandbox API POST /execute endpoint (synchronous)
    const result = await apiRequest<ExecuteSyncResult>('POST', '/execute', requestBody);

    return {
      job_id: result.job_id,
      language: result.language,
      network_mode: result.network_mode || 'zerotrust',
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exit_code: result.exit_code ?? 0,
      total_time_ms: result.total_time_ms || 0,
      success: result.success ?? (result.exit_code === 0),
      artifact: result.artifact,
      wasm_artifact: result.wasm_artifact,
    };
  },
});

// ============================================================================
// Run (auto-detect language)
// ============================================================================

export interface RunInput {
  code: string;
  network_mode?: NetworkMode;
  ttl?: number;
  env?: Record<string, string>;
}

export interface RunResult {
  job_id: string;
  language: string;
  detected_language: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  success: boolean;
}

/**
 * Execute code with automatic language detection.
 * Uses shebang lines, syntax patterns, and heuristics for detection.
 */
export const run = tool({
  description:
    'Execute code with automatic language detection. Uses shebang lines (e.g., #!/usr/bin/env python), syntax patterns, and heuristics for detection.',
  inputSchema: jsonSchema<RunInput>({
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description:
          'The source code to execute. Can include shebang line (e.g., #!/usr/bin/env python) for explicit language hint.',
      },
      network_mode: {
        type: 'string',
        enum: ['zerotrust', 'semitrusted'],
        description: "Network isolation mode. Default: 'zerotrust'",
      },
      ttl: {
        type: 'number',
        description: 'Execution timeout in seconds (1-900). Default: 60.',
      },
      env: {
        type: 'object',
        description: 'Environment variables as key-value pairs (URL-encoded JSON).',
        additionalProperties: { type: 'string' },
      },
    },
    required: ['code'],
    additionalProperties: false,
  }),
  async execute(input: RunInput): Promise<RunResult> {
    if (!input.code || typeof input.code !== 'string') {
      throw new Error('Code is required and must be a string');
    }

    if (input.ttl !== undefined && (input.ttl < 1 || input.ttl > 900)) {
      throw new Error('TTL must be between 1 and 900 seconds');
    }

    // Build query params
    let path = '/run';
    const params = new URLSearchParams();
    if (input.network_mode) {
      params.set('network_mode', input.network_mode);
    }
    if (input.ttl) {
      params.set('ttl', input.ttl.toString());
    }
    if (input.env) {
      params.set('env', JSON.stringify(input.env));
    }
    const queryString = params.toString();
    if (queryString) {
      path = `${path}?${queryString}`;
    }

    const result = await apiRequestText<RunResult>(path, input.code);

    return {
      job_id: result.job_id,
      language: result.language || result.detected_language || 'unknown',
      detected_language: result.detected_language || result.language || 'unknown',
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exit_code: result.exit_code ?? 0,
      success: result.success ?? (result.exit_code === 0),
    };
  },
});

// ============================================================================
// Run Async (auto-detect language)
// ============================================================================

export interface RunAsyncInput {
  code: string;
  network_mode?: NetworkMode;
  ttl?: number;
}

export interface RunAsyncResult {
  job_id: string;
  status: 'pending';
  detected_language: string;
  message: string;
}

/**
 * Execute code asynchronously with automatic language detection.
 * Returns a job_id immediately. Use getJob to check status and retrieve results.
 */
export const runAsync = tool({
  description:
    'Execute code asynchronously with automatic language detection. Returns a job_id immediately. Use getJob to check status and retrieve results.',
  inputSchema: jsonSchema<RunAsyncInput>({
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description:
          'The source code to execute. Can include shebang line (e.g., #!/usr/bin/env python) for explicit language hint.',
      },
      network_mode: {
        type: 'string',
        enum: ['zerotrust', 'semitrusted'],
        description: "Network isolation mode. Default: 'zerotrust'",
      },
      ttl: {
        type: 'number',
        description: 'Execution timeout in seconds (1-900). Default: 60.',
      },
    },
    required: ['code'],
    additionalProperties: false,
  }),
  async execute(input: RunAsyncInput): Promise<RunAsyncResult> {
    if (!input.code || typeof input.code !== 'string') {
      throw new Error('Code is required and must be a string');
    }

    if (input.ttl !== undefined && (input.ttl < 1 || input.ttl > 900)) {
      throw new Error('TTL must be between 1 and 900 seconds');
    }

    // Build query params
    let path = '/run/async';
    const params = new URLSearchParams();
    if (input.network_mode) {
      params.set('network_mode', input.network_mode);
    }
    if (input.ttl) {
      params.set('ttl', input.ttl.toString());
    }
    const queryString = params.toString();
    if (queryString) {
      path = `${path}?${queryString}`;
    }

    const result = await apiRequestText<RunAsyncResult>(path, input.code);

    return {
      job_id: result.job_id,
      status: 'pending',
      detected_language: result.detected_language || 'unknown',
      message: result.message || 'Job accepted for execution',
    };
  },
});

// ============================================================================
// List Jobs
// ============================================================================

export interface JobSummary {
  job_id: string;
  language: string;
  network_mode: string;
  status: JobStatus;
  created_at: string;
}

export interface ListJobsResult {
  jobs: JobSummary[];
  count: number;
}

/**
 * List all active (pending or running) code execution jobs.
 */
export const listJobs = tool({
  description:
    'List all active (pending or running) code execution jobs. Returns an array of job objects with their current status.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<ListJobsResult> {
    // API returns array directly per OpenAPI spec
    const result = await apiRequest<JobSummary[]>('GET', '/jobs', undefined);

    // Handle both array response and object with jobs array
    const jobs = Array.isArray(result) ? result : [];

    return {
      jobs: jobs.map((job) => ({
        job_id: job.job_id || '',
        language: job.language || 'unknown',
        network_mode: job.network_mode || 'zerotrust',
        status: job.status || 'pending',
        created_at: job.created_at || '',
      })),
      count: jobs.length,
    };
  },
});

// ============================================================================
// Delete/Cancel Job
// ============================================================================

export interface DeleteJobInput {
  job_id: string;
}

export interface DeleteJobResult {
  job_id: string;
  status: string;
  message: string;
  stdout?: string;
  stderr?: string;
  success: boolean;
  artifacts?: Artifact[];
}

/**
 * Cancel a pending or running code execution job.
 * Returns any partial output and compiled artifacts.
 */
export const deleteJob = tool({
  description:
    'Cancel a pending or running code execution job. Returns any partial output and compiled artifacts. Cancellation is best-effort - jobs may complete before cancellation takes effect.',
  inputSchema: jsonSchema<DeleteJobInput>({
    type: 'object',
    properties: {
      job_id: {
        type: 'string',
        description: 'The job ID to cancel',
      },
    },
    required: ['job_id'],
    additionalProperties: false,
  }),
  async execute(input: DeleteJobInput): Promise<DeleteJobResult> {
    if (!input.job_id || typeof input.job_id !== 'string') {
      throw new Error('job_id is required and must be a string');
    }

    const result = await apiRequest<DeleteJobResult>(
      'DELETE',
      `/jobs/${encodeURIComponent(input.job_id)}`,
      undefined
    );

    return {
      job_id: result.job_id || input.job_id,
      status: result.status || 'cancelled',
      message: result.message || 'Job cancelled',
      stdout: result.stdout,
      stderr: result.stderr,
      success: result.success ?? true,
      artifacts: result.artifacts,
    };
  },
});

// ============================================================================
// Languages
// ============================================================================

export interface LanguagesResult {
  languages: string[];
  aliases: Record<string, string>;
  count: number;
}

/**
 * List all supported programming languages.
 */
export const getLanguages = tool({
  description:
    'List all supported programming languages and their aliases for code execution.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<LanguagesResult> {
    const result = await apiRequest<LanguagesResult>('GET', '/languages', undefined);
    return {
      languages: result.languages || [],
      aliases: result.aliases || {},
      count: result.count || result.languages?.length || 0,
    };
  },
});

export interface ShellsResult {
  shells: string[];
  categories: Record<string, string[]>;
  count: number;
}

/**
 * List all supported shells and REPLs for interactive sessions.
 */
export const getShells = tool({
  description:
    'List all supported shells and REPLs for interactive sessions, grouped by category.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<ShellsResult> {
    const result = await apiRequest<ShellsResult>('GET', '/shells', undefined);
    return {
      shells: result.shells || [],
      categories: result.categories || {},
      count: result.count || result.shells?.length || 0,
    };
  },
});

// ============================================================================
// Sessions
// ============================================================================

export type SessionStatus = 'running' | 'frozen' | 'terminated';

export interface CreateSessionInput {
  shell?: string;
  network_mode?: NetworkMode;
  ttl?: number;
}

export interface SessionResult {
  session_id: string;
  status: SessionStatus;
  shell: string;
  network_mode: string;
  websocket_url?: string;
  created_at?: string;
  expires_at?: string;
}

/**
 * Create an interactive shell session with WebSocket access.
 */
export const createSession = tool({
  description:
    'Create a persistent interactive shell session with WebSocket access. Sessions persist between commands and can be frozen/unfrozen.',
  inputSchema: jsonSchema<CreateSessionInput>({
    type: 'object',
    properties: {
      shell: {
        type: 'string',
        description: 'Shell or REPL to start (bash, python3, node, etc.). Default: bash',
      },
      network_mode: {
        type: 'string',
        enum: ['zerotrust', 'semitrusted'],
        description: "Network isolation mode. Default: 'zerotrust'",
      },
      ttl: {
        type: 'number',
        description: 'Time-to-live in seconds (0 = no limit). Default: 3600',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: CreateSessionInput): Promise<SessionResult> {
    const requestBody: Record<string, unknown> = {};
    if (input.shell) requestBody.shell = input.shell;
    if (input.network_mode) requestBody.network_mode = input.network_mode;
    if (input.ttl !== undefined) requestBody.ttl = input.ttl;

    const result = await apiRequest<SessionResult>('POST', '/sessions', requestBody);
    return result;
  },
});

export interface GetSessionInput {
  session_id: string;
}

/**
 * Get session status and details.
 */
export const getSession = tool({
  description: 'Get detailed session information including status, shell, and WebSocket URL.',
  inputSchema: jsonSchema<GetSessionInput>({
    type: 'object',
    properties: {
      session_id: {
        type: 'string',
        description: 'The session ID',
      },
    },
    required: ['session_id'],
    additionalProperties: false,
  }),
  async execute(input: GetSessionInput): Promise<SessionResult> {
    return apiRequest<SessionResult>('GET', `/sessions/${encodeURIComponent(input.session_id)}`, undefined);
  },
});

export interface SessionSummary {
  session_id: string;
  status: string;
  network_mode: string;
  remaining_ttl?: number;
}

export interface ListSessionsResult {
  sessions: SessionSummary[];
}

/**
 * List all active sessions.
 */
export const listSessions = tool({
  description: 'List all active interactive sessions for the authenticated API key.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<ListSessionsResult> {
    const result = await apiRequest<ListSessionsResult>('GET', '/sessions', undefined);
    return { sessions: result.sessions || [] };
  },
});

export interface SessionCommandInput {
  session_id: string;
  command: string;
}

export interface SessionCommandResult {
  stdout: string;
  stderr: string;
  exit_code: number;
}

/**
 * Execute a command in a session.
 */
export const executeInSession = tool({
  description: "Run a command inside a session's container and return output.",
  inputSchema: jsonSchema<SessionCommandInput>({
    type: 'object',
    properties: {
      session_id: {
        type: 'string',
        description: 'The session ID',
      },
      command: {
        type: 'string',
        description: 'The command to execute',
      },
    },
    required: ['session_id', 'command'],
    additionalProperties: false,
  }),
  async execute(input: SessionCommandInput): Promise<SessionCommandResult> {
    return apiRequest<SessionCommandResult>(
      'POST',
      `/sessions/${encodeURIComponent(input.session_id)}/execute`,
      { command: input.command }
    );
  },
});

export interface SessionIdInput {
  session_id: string;
}

export interface SessionStateResult {
  session_id: string;
  status: string;
}

/**
 * Freeze a session to save resources.
 */
export const freezeSession = tool({
  description: 'Freeze a session to save resources. Container state is preserved and can be woken later.',
  inputSchema: jsonSchema<SessionIdInput>({
    type: 'object',
    properties: {
      session_id: { type: 'string', description: 'The session ID' },
    },
    required: ['session_id'],
    additionalProperties: false,
  }),
  async execute(input: SessionIdInput): Promise<SessionStateResult> {
    return apiRequest<SessionStateResult>(
      'POST',
      `/sessions/${encodeURIComponent(input.session_id)}/freeze`,
      {}
    );
  },
});

export interface UnfreezeResult {
  session_id: string;
  status: string;
  unfreeze_time_ms?: number;
}

/**
 * Wake a frozen session.
 */
export const unfreezeSession = tool({
  description: 'Wake a frozen session and restore its state.',
  inputSchema: jsonSchema<SessionIdInput>({
    type: 'object',
    properties: {
      session_id: { type: 'string', description: 'The session ID' },
    },
    required: ['session_id'],
    additionalProperties: false,
  }),
  async execute(input: SessionIdInput): Promise<UnfreezeResult> {
    return apiRequest<UnfreezeResult>(
      'POST',
      `/sessions/${encodeURIComponent(input.session_id)}/unfreeze`,
      {}
    );
  },
});

export interface LockResult {
  locked: boolean;
}

/**
 * Lock a session to prevent accidental deletion.
 */
export const lockSession = tool({
  description: 'Lock a session to prevent accidental deletion.',
  inputSchema: jsonSchema<SessionIdInput>({
    type: 'object',
    properties: {
      session_id: { type: 'string', description: 'The session ID' },
    },
    required: ['session_id'],
    additionalProperties: false,
  }),
  async execute(input: SessionIdInput): Promise<LockResult> {
    return apiRequest<LockResult>(
      'POST',
      `/sessions/${encodeURIComponent(input.session_id)}/lock`,
      {}
    );
  },
});

/**
 * Unlock a locked session.
 */
export const unlockSession = tool({
  description: 'Unlock a locked session to allow deletion.',
  inputSchema: jsonSchema<SessionIdInput>({
    type: 'object',
    properties: {
      session_id: { type: 'string', description: 'The session ID' },
    },
    required: ['session_id'],
    additionalProperties: false,
  }),
  async execute(input: SessionIdInput): Promise<LockResult> {
    return apiRequest<LockResult>(
      'POST',
      `/sessions/${encodeURIComponent(input.session_id)}/unlock`,
      {}
    );
  },
});

export interface CreateSnapshotInput {
  session_id: string;
  name?: string;
  hot?: boolean;
  ttl?: number;
}

export interface SnapshotResult {
  snapshot_id: string;
  name?: string;
  source_id: string;
  source_type: string;
  size_bytes?: number;
  created_at?: string;
}

/**
 * Create a snapshot of a session.
 */
export const createSessionSnapshot = tool({
  description: "Create a snapshot of the session's container state.",
  inputSchema: jsonSchema<CreateSnapshotInput>({
    type: 'object',
    properties: {
      session_id: { type: 'string', description: 'The session ID' },
      name: { type: 'string', description: 'Optional snapshot name' },
      hot: { type: 'boolean', description: 'Create hot snapshot without stopping container. Default: false' },
      ttl: { type: 'number', description: 'Auto-delete after N seconds (optional)' },
    },
    required: ['session_id'],
    additionalProperties: false,
  }),
  async execute(input: CreateSnapshotInput): Promise<SnapshotResult> {
    const body: Record<string, unknown> = {};
    if (input.name) body.name = input.name;
    if (input.hot !== undefined) body.hot = input.hot;
    if (input.ttl !== undefined) body.ttl = input.ttl;

    return apiRequest<SnapshotResult>(
      'POST',
      `/sessions/${encodeURIComponent(input.session_id)}/snapshot`,
      body
    );
  },
});

export interface RestoreSessionInput {
  session_id: string;
  snapshot_id: string;
}

/**
 * Restore a session from a snapshot.
 */
export const restoreSession = tool({
  description: 'Restore a session to a previous snapshot state.',
  inputSchema: jsonSchema<RestoreSessionInput>({
    type: 'object',
    properties: {
      session_id: { type: 'string', description: 'The session ID' },
      snapshot_id: { type: 'string', description: 'The snapshot ID to restore from' },
    },
    required: ['session_id', 'snapshot_id'],
    additionalProperties: false,
  }),
  async execute(input: RestoreSessionInput): Promise<SessionStateResult> {
    return apiRequest<SessionStateResult>(
      'POST',
      `/sessions/${encodeURIComponent(input.session_id)}/restore`,
      { snapshot_id: input.snapshot_id }
    );
  },
});

/**
 * Delete a session.
 */
export const deleteSession = tool({
  description: 'Terminate and destroy a session permanently.',
  inputSchema: jsonSchema<SessionIdInput>({
    type: 'object',
    properties: {
      session_id: { type: 'string', description: 'The session ID' },
    },
    required: ['session_id'],
    additionalProperties: false,
  }),
  async execute(input: SessionIdInput): Promise<SessionStateResult> {
    return apiRequest<SessionStateResult>(
      'DELETE',
      `/sessions/${encodeURIComponent(input.session_id)}`,
      undefined
    );
  },
});

// ============================================================================
// Services
// ============================================================================

export type ServiceState = 'starting' | 'running' | 'frozen' | 'redeploying' | 'failed';

export interface CreateServiceInput {
  name: string;
  bootstrap?: string;
  bootstrap_content?: string;
  ports?: number[];
  network_mode?: NetworkMode;
  custom_domains?: string[];
  input_files?: InputFile[];
}

export interface ServiceResult {
  service_id: string;
  name: string;
  state: ServiceState;
  url?: string;
  ports?: number[];
  created_at?: string;
}

/**
 * Create a persistent service with custom subdomain.
 */
export const createService = tool({
  description:
    'Create a long-running service with custom subdomain. Services persist until explicitly destroyed and can auto-unfreeze on HTTP requests.',
  inputSchema: jsonSchema<CreateServiceInput>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Service name (becomes NAME.on.unsandbox.com)' },
      bootstrap: { type: 'string', description: 'Bootstrap script content or URL' },
      bootstrap_content: { type: 'string', description: 'Bootstrap script content (alternative to bootstrap)' },
      ports: {
        type: 'array',
        items: { type: 'number' },
        description: 'Ports to expose',
      },
      network_mode: {
        type: 'string',
        enum: ['zerotrust', 'semitrusted'],
        description: "Network isolation mode. Default: 'semitrusted'",
      },
      custom_domains: {
        type: 'array',
        items: { type: 'string' },
        description: 'Custom domain names',
      },
      input_files: {
        type: 'array',
        description: 'Input files to make available',
        items: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            content: { type: 'string' },
          },
          required: ['filename', 'content'],
        },
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input: CreateServiceInput): Promise<ServiceResult> {
    return apiRequest<ServiceResult>('POST', '/services', input);
  },
});

export interface ServiceIdInput {
  service_id: string;
}

/**
 * Get service status and details.
 */
export const getService = tool({
  description: 'Get detailed service information including state, ports, and URL.',
  inputSchema: jsonSchema<ServiceIdInput>({
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'The service ID' },
    },
    required: ['service_id'],
    additionalProperties: false,
  }),
  async execute(input: ServiceIdInput): Promise<ServiceResult> {
    return apiRequest<ServiceResult>('GET', `/services/${encodeURIComponent(input.service_id)}`, undefined);
  },
});

export interface ServiceSummary {
  service_id: string;
  name: string;
  state: string;
  ports?: number[];
  domains?: string[];
}

export interface ListServicesResult {
  services: ServiceSummary[];
}

/**
 * List all services.
 */
export const listServices = tool({
  description: 'List all services for the authenticated API key.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<ListServicesResult> {
    const result = await apiRequest<ListServicesResult>('GET', '/services', undefined);
    return { services: result.services || [] };
  },
});

export interface ServiceCommandInput {
  service_id: string;
  command: string;
}

/**
 * Execute a command in a service.
 */
export const executeInService = tool({
  description: 'Run a command inside a running service container.',
  inputSchema: jsonSchema<ServiceCommandInput>({
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'The service ID' },
      command: { type: 'string', description: 'The command to execute' },
    },
    required: ['service_id', 'command'],
    additionalProperties: false,
  }),
  async execute(input: ServiceCommandInput): Promise<SessionCommandResult> {
    return apiRequest<SessionCommandResult>(
      'POST',
      `/services/${encodeURIComponent(input.service_id)}/execute`,
      { command: input.command }
    );
  },
});

export interface ServiceStateResult {
  service_id: string;
  state: string;
}

/**
 * Freeze a service to save resources.
 */
export const freezeService = tool({
  description: 'Freeze a service to save resources. Auto-unfreezes on first HTTP request.',
  inputSchema: jsonSchema<ServiceIdInput>({
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'The service ID' },
    },
    required: ['service_id'],
    additionalProperties: false,
  }),
  async execute(input: ServiceIdInput): Promise<ServiceStateResult> {
    return apiRequest<ServiceStateResult>(
      'POST',
      `/services/${encodeURIComponent(input.service_id)}/freeze`,
      {}
    );
  },
});

export interface ServiceUnfreezeResult {
  service_id: string;
  state: string;
  unfreeze_time_ms?: number;
}

/**
 * Wake a frozen service.
 */
export const unfreezeService = tool({
  description: 'Manually wake a frozen service.',
  inputSchema: jsonSchema<ServiceIdInput>({
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'The service ID' },
    },
    required: ['service_id'],
    additionalProperties: false,
  }),
  async execute(input: ServiceIdInput): Promise<ServiceUnfreezeResult> {
    return apiRequest<ServiceUnfreezeResult>(
      'POST',
      `/services/${encodeURIComponent(input.service_id)}/unfreeze`,
      {}
    );
  },
});

/**
 * Lock a service to prevent accidental deletion.
 */
export const lockService = tool({
  description: 'Lock a service to prevent accidental deletion.',
  inputSchema: jsonSchema<ServiceIdInput>({
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'The service ID' },
    },
    required: ['service_id'],
    additionalProperties: false,
  }),
  async execute(input: ServiceIdInput): Promise<LockResult> {
    return apiRequest<LockResult>(
      'POST',
      `/services/${encodeURIComponent(input.service_id)}/lock`,
      {}
    );
  },
});

/**
 * Unlock a locked service.
 */
export const unlockService = tool({
  description: 'Unlock a locked service to allow deletion.',
  inputSchema: jsonSchema<ServiceIdInput>({
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'The service ID' },
    },
    required: ['service_id'],
    additionalProperties: false,
  }),
  async execute(input: ServiceIdInput): Promise<LockResult> {
    return apiRequest<LockResult>(
      'POST',
      `/services/${encodeURIComponent(input.service_id)}/unlock`,
      {}
    );
  },
});

export interface RedeployServiceInput {
  service_id: string;
  bootstrap_content?: string;
}

/**
 * Redeploy a service.
 */
export const redeployService = tool({
  description: 'Re-run the bootstrap script. Optionally provide new bootstrap content.',
  inputSchema: jsonSchema<RedeployServiceInput>({
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'The service ID' },
      bootstrap_content: { type: 'string', description: 'New bootstrap script (optional)' },
    },
    required: ['service_id'],
    additionalProperties: false,
  }),
  async execute(input: RedeployServiceInput): Promise<ServiceStateResult> {
    const body: Record<string, unknown> = {};
    if (input.bootstrap_content) body.bootstrap_content = input.bootstrap_content;
    return apiRequest<ServiceStateResult>(
      'POST',
      `/services/${encodeURIComponent(input.service_id)}/redeploy`,
      body
    );
  },
});

export interface ServiceLogsResult {
  log: string;
}

/**
 * Get service logs.
 */
export const getServiceLogs = tool({
  description: 'Get bootstrap and application logs for the service.',
  inputSchema: jsonSchema<ServiceIdInput>({
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'The service ID' },
    },
    required: ['service_id'],
    additionalProperties: false,
  }),
  async execute(input: ServiceIdInput): Promise<ServiceLogsResult> {
    return apiRequest<ServiceLogsResult>(
      'GET',
      `/services/${encodeURIComponent(input.service_id)}/logs`,
      undefined
    );
  },
});

export interface CreateServiceSnapshotInput {
  service_id: string;
  name?: string;
  hot?: boolean;
  ttl?: number;
}

/**
 * Create a snapshot of a service.
 */
export const createServiceSnapshot = tool({
  description: "Create a snapshot of the service's container state.",
  inputSchema: jsonSchema<CreateServiceSnapshotInput>({
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'The service ID' },
      name: { type: 'string', description: 'Optional snapshot name' },
      hot: { type: 'boolean', description: 'Create hot snapshot without stopping container' },
      ttl: { type: 'number', description: 'Auto-delete after N seconds' },
    },
    required: ['service_id'],
    additionalProperties: false,
  }),
  async execute(input: CreateServiceSnapshotInput): Promise<SnapshotResult> {
    const body: Record<string, unknown> = {};
    if (input.name) body.name = input.name;
    if (input.hot !== undefined) body.hot = input.hot;
    if (input.ttl !== undefined) body.ttl = input.ttl;

    return apiRequest<SnapshotResult>(
      'POST',
      `/services/${encodeURIComponent(input.service_id)}/snapshot`,
      body
    );
  },
});

export interface EnvVarsResult {
  env: Record<string, string>;
}

/**
 * Get service environment variables.
 */
export const getServiceEnv = tool({
  description: 'Retrieve all environment variables set for the service.',
  inputSchema: jsonSchema<ServiceIdInput>({
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'The service ID' },
    },
    required: ['service_id'],
    additionalProperties: false,
  }),
  async execute(input: ServiceIdInput): Promise<EnvVarsResult> {
    return apiRequest<EnvVarsResult>(
      'GET',
      `/services/${encodeURIComponent(input.service_id)}/env`,
      undefined
    );
  },
});

export interface SetServiceEnvInput {
  service_id: string;
  env: Record<string, string>;
}

export interface SetEnvResult {
  success: boolean;
  env: Record<string, string>;
}

/**
 * Set service environment variables.
 */
export const setServiceEnv = tool({
  description: 'Set or update environment variables for the service.',
  inputSchema: jsonSchema<SetServiceEnvInput>({
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'The service ID' },
      env: {
        type: 'object',
        description: 'Environment variables as key-value pairs',
        additionalProperties: { type: 'string' },
      },
    },
    required: ['service_id', 'env'],
    additionalProperties: false,
  }),
  async execute(input: SetServiceEnvInput): Promise<SetEnvResult> {
    return apiRequest<SetEnvResult>(
      'PUT',
      `/services/${encodeURIComponent(input.service_id)}/env`,
      { env: input.env }
    );
  },
});

export interface DeleteServiceEnvInput {
  service_id: string;
  keys: string[];
}

export interface DeleteEnvResult {
  success: boolean;
  deleted: string[];
}

/**
 * Delete service environment variables.
 */
export const deleteServiceEnv = tool({
  description: 'Remove specific environment variables from the service.',
  inputSchema: jsonSchema<DeleteServiceEnvInput>({
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'The service ID' },
      keys: {
        type: 'array',
        items: { type: 'string' },
        description: 'Environment variable keys to delete',
      },
    },
    required: ['service_id', 'keys'],
    additionalProperties: false,
  }),
  async execute(input: DeleteServiceEnvInput): Promise<DeleteEnvResult> {
    return apiRequest<DeleteEnvResult>(
      'DELETE',
      `/services/${encodeURIComponent(input.service_id)}/env`,
      { keys: input.keys }
    );
  },
});

/**
 * Delete a service.
 */
export const deleteService = tool({
  description: 'Permanently destroy a service and its container.',
  inputSchema: jsonSchema<ServiceIdInput>({
    type: 'object',
    properties: {
      service_id: { type: 'string', description: 'The service ID' },
    },
    required: ['service_id'],
    additionalProperties: false,
  }),
  async execute(input: ServiceIdInput): Promise<ServiceStateResult> {
    return apiRequest<ServiceStateResult>(
      'DELETE',
      `/services/${encodeURIComponent(input.service_id)}`,
      undefined
    );
  },
});

// ============================================================================
// Snapshots
// ============================================================================

export interface CreateSnapshotFromSourceInput {
  source_type: 'session' | 'service';
  source_id: string;
  name?: string;
  hot?: boolean;
  ttl?: number;
}

/**
 * Create a snapshot from an existing session or service.
 */
export const createSnapshot = tool({
  description: 'Create a snapshot from an existing session or service.',
  inputSchema: jsonSchema<CreateSnapshotFromSourceInput>({
    type: 'object',
    properties: {
      source_type: {
        type: 'string',
        enum: ['session', 'service'],
        description: 'Type of source to snapshot',
      },
      source_id: { type: 'string', description: 'ID of the session or service' },
      name: { type: 'string', description: 'Optional snapshot name' },
      hot: { type: 'boolean', description: 'Create hot snapshot without stopping container' },
      ttl: { type: 'number', description: 'Auto-delete after N seconds' },
    },
    required: ['source_type', 'source_id'],
    additionalProperties: false,
  }),
  async execute(input: CreateSnapshotFromSourceInput): Promise<SnapshotResult> {
    return apiRequest<SnapshotResult>('POST', '/snapshots', input);
  },
});

export interface SnapshotIdInput {
  snapshot_id: string;
}

/**
 * Get snapshot details.
 */
export const getSnapshot = tool({
  description: 'Get detailed information about a snapshot.',
  inputSchema: jsonSchema<SnapshotIdInput>({
    type: 'object',
    properties: {
      snapshot_id: { type: 'string', description: 'The snapshot ID' },
    },
    required: ['snapshot_id'],
    additionalProperties: false,
  }),
  async execute(input: SnapshotIdInput): Promise<SnapshotResult> {
    return apiRequest<SnapshotResult>('GET', `/snapshots/${encodeURIComponent(input.snapshot_id)}`, undefined);
  },
});

export interface SnapshotSummary {
  id: string;
  name?: string;
  source_type: string;
  source_id: string;
  size_bytes?: number;
  locked?: boolean;
}

export interface ListSnapshotsResult {
  snapshots: SnapshotSummary[];
}

/**
 * List all snapshots.
 */
export const listSnapshots = tool({
  description: 'List all snapshots for the authenticated API key.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<ListSnapshotsResult> {
    const result = await apiRequest<ListSnapshotsResult>('GET', '/snapshots', undefined);
    return { snapshots: result.snapshots || [] };
  },
});

/**
 * Lock a snapshot.
 */
export const lockSnapshot = tool({
  description: 'Lock a snapshot to prevent accidental deletion.',
  inputSchema: jsonSchema<SnapshotIdInput>({
    type: 'object',
    properties: {
      snapshot_id: { type: 'string', description: 'The snapshot ID' },
    },
    required: ['snapshot_id'],
    additionalProperties: false,
  }),
  async execute(input: SnapshotIdInput): Promise<LockResult> {
    return apiRequest<LockResult>(
      'POST',
      `/snapshots/${encodeURIComponent(input.snapshot_id)}/lock`,
      {}
    );
  },
});

/**
 * Unlock a snapshot.
 */
export const unlockSnapshot = tool({
  description: 'Unlock a locked snapshot to allow deletion.',
  inputSchema: jsonSchema<SnapshotIdInput>({
    type: 'object',
    properties: {
      snapshot_id: { type: 'string', description: 'The snapshot ID' },
    },
    required: ['snapshot_id'],
    additionalProperties: false,
  }),
  async execute(input: SnapshotIdInput): Promise<LockResult> {
    return apiRequest<LockResult>(
      'POST',
      `/snapshots/${encodeURIComponent(input.snapshot_id)}/unlock`,
      {}
    );
  },
});

export interface RestoreSnapshotResult {
  snapshot_id: string;
  status: string;
}

/**
 * Restore a snapshot to its original source.
 */
export const restoreSnapshot = tool({
  description: 'Restore a snapshot to its original source (session or service).',
  inputSchema: jsonSchema<SnapshotIdInput>({
    type: 'object',
    properties: {
      snapshot_id: { type: 'string', description: 'The snapshot ID' },
    },
    required: ['snapshot_id'],
    additionalProperties: false,
  }),
  async execute(input: SnapshotIdInput): Promise<RestoreSnapshotResult> {
    return apiRequest<RestoreSnapshotResult>(
      'POST',
      `/snapshots/${encodeURIComponent(input.snapshot_id)}/restore`,
      {}
    );
  },
});

export interface CloneSnapshotInput {
  snapshot_id: string;
  type: 'session' | 'service';
  name?: string;
  shell?: string;
}

export interface CloneSnapshotResult {
  session_id?: string;
  service_id?: string;
  name?: string;
  status?: string;
  state?: string;
}

/**
 * Clone a snapshot to create a new session or service.
 */
export const cloneSnapshot = tool({
  description: 'Create a new session or service from a snapshot.',
  inputSchema: jsonSchema<CloneSnapshotInput>({
    type: 'object',
    properties: {
      snapshot_id: { type: 'string', description: 'The snapshot ID' },
      type: {
        type: 'string',
        enum: ['session', 'service'],
        description: 'Type of resource to create',
      },
      name: { type: 'string', description: 'Service name (required for service type)' },
      shell: { type: 'string', description: 'Shell to use (for session type)' },
    },
    required: ['snapshot_id', 'type'],
    additionalProperties: false,
  }),
  async execute(input: CloneSnapshotInput): Promise<CloneSnapshotResult> {
    const body: Record<string, unknown> = { type: input.type };
    if (input.name) body.name = input.name;
    if (input.shell) body.shell = input.shell;

    return apiRequest<CloneSnapshotResult>(
      'POST',
      `/snapshots/${encodeURIComponent(input.snapshot_id)}/clone`,
      body
    );
  },
});

export interface DeleteSnapshotResult {
  snapshot_id: string;
  status: string;
}

/**
 * Delete a snapshot.
 */
export const deleteSnapshot = tool({
  description: 'Permanently delete a snapshot.',
  inputSchema: jsonSchema<SnapshotIdInput>({
    type: 'object',
    properties: {
      snapshot_id: { type: 'string', description: 'The snapshot ID' },
    },
    required: ['snapshot_id'],
    additionalProperties: false,
  }),
  async execute(input: SnapshotIdInput): Promise<DeleteSnapshotResult> {
    return apiRequest<DeleteSnapshotResult>(
      'DELETE',
      `/snapshots/${encodeURIComponent(input.snapshot_id)}`,
      undefined
    );
  },
});

// ============================================================================
// Images
// ============================================================================

export type ImageVisibility = 'private' | 'unlisted' | 'public';

export interface PublishImageInput {
  source_type: 'service' | 'snapshot';
  source_id: string;
  name?: string;
  description?: string;
}

export interface ImageResult {
  id: string;
  name?: string;
  description?: string;
  fingerprint?: string;
  source_type: string;
  source_id: string;
  owner_api_key?: string;
  visibility?: ImageVisibility;
  locked?: boolean;
  size_bytes?: number;
  trusted_keys?: string[];
  node?: string;
  created_at?: string;
}

/**
 * Publish an image from a service or snapshot.
 */
export const publishImage = tool({
  description:
    'Create an independent LXD image from a service or snapshot. Images survive container deletion and can be transferred between API keys.',
  inputSchema: jsonSchema<PublishImageInput>({
    type: 'object',
    properties: {
      source_type: {
        type: 'string',
        enum: ['service', 'snapshot'],
        description: 'Type of source to publish from',
      },
      source_id: { type: 'string', description: 'ID of the service or snapshot' },
      name: { type: 'string', description: 'User-friendly name for the image' },
      description: { type: 'string', description: 'Optional description' },
    },
    required: ['source_type', 'source_id'],
    additionalProperties: false,
  }),
  async execute(input: PublishImageInput): Promise<ImageResult> {
    return apiRequest<ImageResult>('POST', '/images', input);
  },
});

export interface ImageIdInput {
  image_id: string;
}

/**
 * Get image details.
 */
export const getImage = tool({
  description: 'Get detailed information about an image.',
  inputSchema: jsonSchema<ImageIdInput>({
    type: 'object',
    properties: {
      image_id: { type: 'string', description: 'The image ID' },
    },
    required: ['image_id'],
    additionalProperties: false,
  }),
  async execute(input: ImageIdInput): Promise<ImageResult> {
    return apiRequest<ImageResult>('GET', `/images/${encodeURIComponent(input.image_id)}`, undefined);
  },
});

export interface ImageSummary {
  id: string;
  name?: string;
  fingerprint?: string;
  visibility?: ImageVisibility;
  locked?: boolean;
  size_bytes?: number;
  created_at?: string;
}

export interface ListImagesResult {
  images: ImageSummary[];
}

/**
 * List all images.
 */
export const listImages = tool({
  description: 'List all images owned by or shared with the authenticated API key.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<ListImagesResult> {
    const result = await apiRequest<ListImagesResult>('GET', '/images', undefined);
    return { images: result.images || [] };
  },
});

/**
 * Lock an image.
 */
export const lockImage = tool({
  description: 'Lock an image to prevent accidental deletion.',
  inputSchema: jsonSchema<ImageIdInput>({
    type: 'object',
    properties: {
      image_id: { type: 'string', description: 'The image ID' },
    },
    required: ['image_id'],
    additionalProperties: false,
  }),
  async execute(input: ImageIdInput): Promise<ImageResult> {
    return apiRequest<ImageResult>(
      'POST',
      `/images/${encodeURIComponent(input.image_id)}/lock`,
      {}
    );
  },
});

/**
 * Unlock an image.
 */
export const unlockImage = tool({
  description: 'Unlock a locked image to allow deletion.',
  inputSchema: jsonSchema<ImageIdInput>({
    type: 'object',
    properties: {
      image_id: { type: 'string', description: 'The image ID' },
    },
    required: ['image_id'],
    additionalProperties: false,
  }),
  async execute(input: ImageIdInput): Promise<ImageResult> {
    return apiRequest<ImageResult>(
      'POST',
      `/images/${encodeURIComponent(input.image_id)}/unlock`,
      {}
    );
  },
});

export interface GrantImageAccessInput {
  image_id: string;
  api_key: string;
}

/**
 * Grant image access to another API key.
 */
export const grantImageAccess = tool({
  description:
    'Grant access to a private/unlisted image for a specific API key. The granted user can use the image to spawn services.',
  inputSchema: jsonSchema<GrantImageAccessInput>({
    type: 'object',
    properties: {
      image_id: { type: 'string', description: 'The image ID' },
      api_key: { type: 'string', description: 'API key to grant access to' },
    },
    required: ['image_id', 'api_key'],
    additionalProperties: false,
  }),
  async execute(input: GrantImageAccessInput): Promise<ImageResult> {
    return apiRequest<ImageResult>(
      'POST',
      `/images/${encodeURIComponent(input.image_id)}/grant`,
      { api_key: input.api_key }
    );
  },
});

/**
 * Revoke image access from an API key.
 */
export const revokeImageAccess = tool({
  description: 'Revoke previously granted access from an API key.',
  inputSchema: jsonSchema<GrantImageAccessInput>({
    type: 'object',
    properties: {
      image_id: { type: 'string', description: 'The image ID' },
      api_key: { type: 'string', description: 'API key to revoke access from' },
    },
    required: ['image_id', 'api_key'],
    additionalProperties: false,
  }),
  async execute(input: GrantImageAccessInput): Promise<ImageResult> {
    return apiRequest<ImageResult>(
      'POST',
      `/images/${encodeURIComponent(input.image_id)}/revoke`,
      { api_key: input.api_key }
    );
  },
});

export interface TransferImageInput {
  image_id: string;
  to_api_key: string;
}

/**
 * Transfer image ownership to another API key.
 */
export const transferImage = tool({
  description:
    'Transfer full ownership of an image to another API key. The image stays on the same LXD node.',
  inputSchema: jsonSchema<TransferImageInput>({
    type: 'object',
    properties: {
      image_id: { type: 'string', description: 'The image ID' },
      to_api_key: { type: 'string', description: "Recipient's public API key" },
    },
    required: ['image_id', 'to_api_key'],
    additionalProperties: false,
  }),
  async execute(input: TransferImageInput): Promise<ImageResult> {
    return apiRequest<ImageResult>(
      'POST',
      `/images/${encodeURIComponent(input.image_id)}/transfer`,
      { to_api_key: input.to_api_key }
    );
  },
});

export interface SetImageVisibilityInput {
  image_id: string;
  visibility: ImageVisibility;
}

/**
 * Set image visibility.
 */
export const setImageVisibility = tool({
  description:
    'Control who can see and use this image. Options: private (only owner), unlisted (shareable via trust), public (visible to all).',
  inputSchema: jsonSchema<SetImageVisibilityInput>({
    type: 'object',
    properties: {
      image_id: { type: 'string', description: 'The image ID' },
      visibility: {
        type: 'string',
        enum: ['private', 'unlisted', 'public'],
        description: 'Visibility setting',
      },
    },
    required: ['image_id', 'visibility'],
    additionalProperties: false,
  }),
  async execute(input: SetImageVisibilityInput): Promise<ImageResult> {
    return apiRequest<ImageResult>(
      'POST',
      `/images/${encodeURIComponent(input.image_id)}/visibility`,
      { visibility: input.visibility }
    );
  },
});

export interface SpawnFromImageInput {
  image_id: string;
  name?: string;
  network_mode?: NetworkMode;
  ports?: number[];
  bootstrap?: string;
}

export interface SpawnFromImageResult {
  service_id: string;
  name?: string;
  source_image: string;
  state: string;
}

/**
 * Spawn a service from an image.
 */
export const spawnFromImage = tool({
  description: 'Create a new service using this image as the base.',
  inputSchema: jsonSchema<SpawnFromImageInput>({
    type: 'object',
    properties: {
      image_id: { type: 'string', description: 'The image ID' },
      name: { type: 'string', description: 'Service name' },
      network_mode: {
        type: 'string',
        enum: ['zerotrust', 'semitrusted'],
        description: "Network isolation mode. Default: 'zerotrust'",
      },
      ports: {
        type: 'array',
        items: { type: 'number' },
        description: 'Ports to expose',
      },
      bootstrap: { type: 'string', description: 'Optional bootstrap script' },
    },
    required: ['image_id'],
    additionalProperties: false,
  }),
  async execute(input: SpawnFromImageInput): Promise<SpawnFromImageResult> {
    const body: Record<string, unknown> = {};
    if (input.name) body.name = input.name;
    if (input.network_mode) body.network_mode = input.network_mode;
    if (input.ports) body.ports = input.ports;
    if (input.bootstrap) body.bootstrap = input.bootstrap;

    return apiRequest<SpawnFromImageResult>(
      'POST',
      `/images/${encodeURIComponent(input.image_id)}/spawn`,
      body
    );
  },
});

export interface TrustedKeysResult {
  trusted_keys: string[];
}

/**
 * List trusted API keys for an image.
 */
export const getImageTrustedKeys = tool({
  description: 'List all API keys that have been granted access to this image.',
  inputSchema: jsonSchema<ImageIdInput>({
    type: 'object',
    properties: {
      image_id: { type: 'string', description: 'The image ID' },
    },
    required: ['image_id'],
    additionalProperties: false,
  }),
  async execute(input: ImageIdInput): Promise<TrustedKeysResult> {
    return apiRequest<TrustedKeysResult>(
      'GET',
      `/images/${encodeURIComponent(input.image_id)}/trusted`,
      undefined
    );
  },
});

export interface DeleteImageResult {
  success: boolean;
  message: string;
}

/**
 * Delete an image.
 */
export const deleteImage = tool({
  description: 'Permanently delete an image from LXD and the database. Cannot delete locked images.',
  inputSchema: jsonSchema<ImageIdInput>({
    type: 'object',
    properties: {
      image_id: { type: 'string', description: 'The image ID' },
    },
    required: ['image_id'],
    additionalProperties: false,
  }),
  async execute(input: ImageIdInput): Promise<DeleteImageResult> {
    return apiRequest<DeleteImageResult>(
      'DELETE',
      `/images/${encodeURIComponent(input.image_id)}`,
      undefined
    );
  },
});

// ============================================================================
// System
// ============================================================================

export interface HealthResult {
  status: string;
}

/**
 * Health check.
 */
export const healthCheck = tool({
  description: 'Simple health check endpoint to verify the Unsandbox API is operational.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<HealthResult> {
    return apiRequest<HealthResult>('GET', '/health', undefined);
  },
});

export interface ClusterStatusResult {
  mode: string;
  network_mode: string;
  pool_size: number;
  available: number;
  allocated: number;
  spawning: number;
  total_containers: number;
  network_breakdown?: {
    zerotrust?: { total: number; available: number; allocated: number };
    semitrusted?: { total: number; available: number; allocated: number; services?: number };
  };
}

/**
 * Get cluster status.
 */
export const getClusterStatus = tool({
  description: 'Get information about the container pool and system status.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<ClusterStatusResult> {
    return apiRequest<ClusterStatusResult>('GET', '/cluster', undefined);
  },
});

export interface SystemStatsResult {
  containers: number;
  load_1min: string;
  load_5min: string;
  load_15min: string;
}

/**
 * Get system statistics.
 */
export const getSystemStats = tool({
  description: 'Get detailed system statistics including load and container metrics.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<SystemStatsResult> {
    return apiRequest<SystemStatsResult>('GET', '/stats', undefined);
  },
});

export interface PoolInfo {
  id: string;
  total: number;
  available: number;
  allocated: number;
}

export interface ListPoolsResult {
  pools: PoolInfo[];
  pool_count: number;
  total_capacity: number;
  total_available: number;
  total_allocated: number;
}

/**
 * List all pools.
 */
export const listPools = tool({
  description: 'Get status of all registered container pools (horizontal scaling).',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<ListPoolsResult> {
    return apiRequest<ListPoolsResult>('GET', '/pools', undefined);
  },
});

// ============================================================================
// Default Export
// ============================================================================

// Default export with all tools for convenience
export default {
  // Execution
  executeCodeAsync,
  getJob,
  execute,
  run,
  runAsync,
  listJobs,
  deleteJob,
  // Languages
  getLanguages,
  getShells,
  // Sessions
  createSession,
  getSession,
  listSessions,
  executeInSession,
  freezeSession,
  unfreezeSession,
  lockSession,
  unlockSession,
  createSessionSnapshot,
  restoreSession,
  deleteSession,
  // Services
  createService,
  getService,
  listServices,
  executeInService,
  freezeService,
  unfreezeService,
  lockService,
  unlockService,
  redeployService,
  getServiceLogs,
  createServiceSnapshot,
  getServiceEnv,
  setServiceEnv,
  deleteServiceEnv,
  deleteService,
  // Snapshots
  createSnapshot,
  getSnapshot,
  listSnapshots,
  lockSnapshot,
  unlockSnapshot,
  restoreSnapshot,
  cloneSnapshot,
  deleteSnapshot,
  // Images
  publishImage,
  getImage,
  listImages,
  lockImage,
  unlockImage,
  grantImageAccess,
  revokeImageAccess,
  transferImage,
  setImageVisibility,
  spawnFromImage,
  getImageTrustedKeys,
  deleteImage,
  // System
  healthCheck,
  getClusterStatus,
  getSystemStats,
  listPools,
};
