/**
 * Unsandbox Code Execution Tools for TPMJS
 * Execute code in a secure sandbox environment supporting 42+ languages.
 *
 * @requires UNSANDBOX_API_KEY environment variable
 */

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

export interface InputFile {
  filename: string;
  content: string; // Base64 encoded
}

export interface ExecuteAsyncInput {
  language: string;
  code: string;
  input_files?: InputFile[];
  network_mode?: NetworkMode;
  ttl?: number;
  return_artifact?: boolean;
  return_wasm_artifact?: boolean;
}

export interface ExecuteAsyncResult {
  job_id: string;
  status: string;
}

export interface GetJobInput {
  job_id: string;
}

export interface GetJobResult {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  stdout?: string;
  stderr?: string;
  exit_code?: number;
  duration_ms?: number;
  error?: string;
  artifact?: string;
  wasm_artifact?: string;
}

function getApiKey(): string {
  const key = process.env.UNSANDBOX_API_KEY;
  if (!key) {
    throw new Error(
      'UNSANDBOX_API_KEY environment variable is required. Get your API key from https://unsandbox.com'
    );
  }
  return key;
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
    const apiKey = getApiKey();

    // Validate language
    if (!input.language || typeof input.language !== 'string') {
      throw new Error('Language is required and must be a string');
    }

    if (!input.code || typeof input.code !== 'string') {
      throw new Error('Code is required and must be a string');
    }

    // Validate TTL if provided
    if (input.ttl !== undefined && (input.ttl < 1 || input.ttl > 900)) {
      throw new Error('TTL must be between 1 and 900 seconds');
    }

    const requestBody: Record<string, unknown> = {
      language: input.language.toLowerCase(),
      code: input.code,
    };

    if (input.input_files) {
      requestBody.input_files = input.input_files;
    }

    if (input.network_mode) {
      requestBody.network_mode = input.network_mode;
    }

    if (input.ttl) {
      requestBody.ttl = input.ttl;
    }

    if (input.return_artifact) {
      requestBody.return_artifact = input.return_artifact;
    }

    if (input.return_wasm_artifact) {
      requestBody.return_wasm_artifact = input.return_wasm_artifact;
    }

    const response = await fetch(`${UNSANDBOX_API_BASE}/execute/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Unsandbox API error: HTTP ${response.status} - ${errorText}`);
    }

    const result = (await response.json()) as { job_id: string; status?: string };

    return {
      job_id: result.job_id,
      status: result.status || 'queued',
    };
  },
});

/**
 * Get the status and results of an async code execution job.
 * Poll this endpoint until status is 'completed' or 'failed'.
 */
export const getJob = tool({
  description:
    "Get the status and results of an async code execution job. Poll this endpoint until status is 'completed' or 'failed'.",
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
    const apiKey = getApiKey();

    if (!input.job_id || typeof input.job_id !== 'string') {
      throw new Error('job_id is required and must be a string');
    }

    const response = await fetch(`${UNSANDBOX_API_BASE}/jobs/${encodeURIComponent(input.job_id)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Job not found: ${input.job_id}`);
      }
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Unsandbox API error: HTTP ${response.status} - ${errorText}`);
    }

    const result = (await response.json()) as GetJobResult;

    return {
      job_id: result.job_id || input.job_id,
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      exit_code: result.exit_code,
      duration_ms: result.duration_ms,
      error: result.error,
      artifact: result.artifact,
      wasm_artifact: result.wasm_artifact,
    };
  },
});

/**
 * Sync execution interfaces
 */
export interface ExecuteSyncInput {
  language: string;
  code: string;
  input_files?: InputFile[];
  network_mode?: NetworkMode;
  ttl?: number;
}

export interface ExecuteSyncResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  duration_ms: number;
}

export interface RunInput {
  code: string;
  network_mode?: NetworkMode;
  ttl?: number;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  detected_language: string;
  duration_ms: number;
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
    required: ['language', 'code'],
    additionalProperties: false,
  }),
  async execute(input: ExecuteSyncInput): Promise<ExecuteSyncResult> {
    const apiKey = getApiKey();

    if (!input.language || typeof input.language !== 'string') {
      throw new Error('Language is required and must be a string');
    }

    if (!input.code || typeof input.code !== 'string') {
      throw new Error('Code is required and must be a string');
    }

    if (input.ttl !== undefined && (input.ttl < 1 || input.ttl > 900)) {
      throw new Error('TTL must be between 1 and 900 seconds');
    }

    const requestBody: Record<string, unknown> = {
      language: input.language.toLowerCase(),
      code: input.code,
    };

    if (input.input_files) {
      requestBody.input_files = input.input_files;
    }

    if (input.network_mode) {
      requestBody.network_mode = input.network_mode;
    }

    if (input.ttl) {
      requestBody.ttl = input.ttl;
    }

    const response = await fetch(`${UNSANDBOX_API_BASE}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Unsandbox API error: HTTP ${response.status} - ${errorText}`);
    }

    const result = (await response.json()) as ExecuteSyncResult;

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exit_code: result.exit_code ?? 0,
      duration_ms: result.duration_ms || 0,
    };
  },
});

/**
 * Execute code with automatic language detection from shebang.
 * Send raw code with a shebang line (e.g., #!/usr/bin/env python) and the language is auto-detected.
 */
export const run = tool({
  description:
    'Execute code with automatic language detection from shebang. Send raw code with a shebang line (e.g., #!/usr/bin/env python) and the language is auto-detected.',
  inputSchema: jsonSchema<RunInput>({
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'The source code with shebang line (e.g., #!/usr/bin/env python)',
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
  async execute(input: RunInput): Promise<RunResult> {
    const apiKey = getApiKey();

    if (!input.code || typeof input.code !== 'string') {
      throw new Error('Code is required and must be a string');
    }

    if (input.ttl !== undefined && (input.ttl < 1 || input.ttl > 900)) {
      throw new Error('TTL must be between 1 and 900 seconds');
    }

    // Build query params for network_mode and ttl
    const url = new URL(`${UNSANDBOX_API_BASE}/run`);
    if (input.network_mode) {
      url.searchParams.set('network_mode', input.network_mode);
    }
    if (input.ttl) {
      url.searchParams.set('ttl', input.ttl.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        Authorization: `Bearer ${apiKey}`,
      },
      body: input.code,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Unsandbox API error: HTTP ${response.status} - ${errorText}`);
    }

    const result = (await response.json()) as RunResult;

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exit_code: result.exit_code ?? 0,
      detected_language: result.detected_language || 'unknown',
      duration_ms: result.duration_ms || 0,
    };
  },
});

// Default export for convenience
export default {
  executeCodeAsync,
  getJob,
  execute,
  run,
};
