/**
 * Sandbox Shell Tools for TPMJS Agent Sandbox
 *
 * Execute shell commands, read/write files, and list directories
 * within the stateful sandbox workspace. All paths are resolved
 * relative to `_sandboxWorkDir` (injected by the sandbox server).
 *
 * Runs inside Deno — uses Deno.Command, Deno.readTextFile, etc.
 */

import { jsonSchema, tool } from 'ai';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_STDOUT = 100 * 1024; // 100 KB
const MAX_READ_SIZE = 500 * 1024; // 500 KB
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 300_000;
const MAX_LIST_ENTRIES = 1_000;
const DEFAULT_MAX_DEPTH = 3;

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ShellExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  truncated: boolean;
}

export interface ReadFileResult {
  content: string;
  path: string;
  size: number;
  truncated: boolean;
}

export interface WriteFileResult {
  success: boolean;
  path: string;
  bytesWritten: number;
}

export interface FileEntry {
  name: string;
  type: 'file' | 'directory' | 'symlink';
  size: number | null;
}

export interface ListFilesResult {
  path: string;
  entries: FileEntry[];
  truncated: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveSandboxPath(workDir: string, relativePath: string): string {
  // Normalize: remove leading slash (paths are relative to workDir)
  const cleaned = relativePath.replace(/^\/+/, '');

  // Simple join — Deno runs on Linux so forward slashes only
  const resolved = `${workDir}/${cleaned}`.replace(/\/+/g, '/');

  // Security: ensure the resolved path stays inside workDir
  // Normalize away any .. segments by splitting and resolving
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

function truncate(text: string, maxBytes: number): { text: string; truncated: boolean } {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  if (bytes.length <= maxBytes) {
    return { text, truncated: false };
  }
  // Truncate at byte boundary, decode back (may lose partial char)
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return {
    text: decoder.decode(bytes.slice(0, maxBytes)) + '\n... [truncated]',
    truncated: true,
  };
}

async function collectStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number = MAX_STDOUT * 2
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
      // Prevent OOM: stop reading if we exceed the limit
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

// ---------------------------------------------------------------------------
// shellExec
// ---------------------------------------------------------------------------

type ShellExecInput = {
  command: string;
  timeout?: number;
  _sandboxWorkDir?: string;
};

export const shellExec = tool({
  description:
    'Execute a shell command in the sandbox workspace. Supports git, npm, and any CLI tools available in the container.',
  inputSchema: jsonSchema<ShellExecInput>({
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Shell command to execute (passed to sh -c)',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 30000, max: 300000)',
      },
      _sandboxWorkDir: {
        type: 'string',
        description: 'Injected by sandbox server — workspace directory',
      },
    },
    required: ['command'],
    additionalProperties: false,
  }),
  async execute({ command, timeout, _sandboxWorkDir }) {
    if (!_sandboxWorkDir) {
      throw new Error('shellExec requires a sandbox session (_sandboxWorkDir not set)');
    }

    const timeoutMs = Math.min(Math.max(timeout ?? DEFAULT_TIMEOUT_MS, 1000), MAX_TIMEOUT_MS);
    const startTime = Date.now();

    const cmd = new Deno.Command('sh', {
      args: ['-c', command],
      cwd: _sandboxWorkDir,
      stdout: 'piped',
      stderr: 'piped',
    });

    const child = cmd.spawn();

    // Timeout handling — kill the process tree if it exceeds the limit
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        // Try SIGTERM first for graceful shutdown
        child.kill('SIGTERM');
        // Force kill after 2 seconds if still running
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
      // Collect stdout and stderr concurrently
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

      const stdout = truncate(stdoutRaw, MAX_STDOUT);
      const stderr = truncate(stderrRaw, MAX_STDOUT);

      const result: ShellExecResult = {
        stdout: stdout.text,
        stderr: timedOut ? `[TIMEOUT after ${timeoutMs}ms] ${stderr.text}` : stderr.text,
        exitCode: timedOut ? 137 : status.code,
        durationMs,
        truncated: stdout.truncated || stderr.truncated,
      };

      return result;
    } catch (error) {
      clearTimeout(timer);
      throw new Error(
        `Shell execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

// ---------------------------------------------------------------------------
// readFile
// ---------------------------------------------------------------------------

type ReadFileInput = {
  path: string;
  _sandboxWorkDir?: string;
};

export const readFile = tool({
  description: 'Read a file from the sandbox workspace.',
  inputSchema: jsonSchema<ReadFileInput>({
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path relative to workspace root',
      },
      _sandboxWorkDir: {
        type: 'string',
        description: 'Injected by sandbox server — workspace directory',
      },
    },
    required: ['path'],
    additionalProperties: false,
  }),
  async execute({ path: filePath, _sandboxWorkDir }) {
    if (!_sandboxWorkDir) {
      throw new Error('readFile requires a sandbox session (_sandboxWorkDir not set)');
    }

    const resolved = resolveSandboxPath(_sandboxWorkDir, filePath);

    // Symlink escape check: verify the real (canonical) path is still in workspace
    try {
      const realPath = await Deno.realPath(resolved);
      const normalizedWorkDir = '/' + _sandboxWorkDir.replace(/^\/+/, '').replace(/\/+$/, '');
      if (!realPath.startsWith(normalizedWorkDir)) {
        throw new Error(`Path escapes sandbox workspace via symlink: ${filePath}`);
      }
    } catch (error) {
      // Re-throw our own escape error
      if (error instanceof Error && error.message.includes('escapes sandbox')) {
        throw error;
      }
      // NotFound is fine — stat will fail with a better error below
    }

    const content = await Deno.readTextFile(resolved);

    const { text, truncated } = truncate(content, MAX_READ_SIZE);

    const stat = await Deno.stat(resolved);

    const result: ReadFileResult = {
      content: text,
      path: filePath,
      size: stat.size,
      truncated,
    };

    return result;
  },
});

// ---------------------------------------------------------------------------
// writeFile
// ---------------------------------------------------------------------------

type WriteFileInput = {
  path: string;
  content: string;
  createDirs?: boolean;
  _sandboxWorkDir?: string;
};

export const writeFile = tool({
  description: 'Write or create a file in the sandbox workspace.',
  inputSchema: jsonSchema<WriteFileInput>({
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path relative to workspace root',
      },
      content: {
        type: 'string',
        description: 'Content to write to the file',
      },
      createDirs: {
        type: 'boolean',
        description: 'Create parent directories if they do not exist (default: true)',
      },
      _sandboxWorkDir: {
        type: 'string',
        description: 'Injected by sandbox server — workspace directory',
      },
    },
    required: ['path', 'content'],
    additionalProperties: false,
  }),
  async execute({ path: filePath, content, createDirs = true, _sandboxWorkDir }) {
    if (!_sandboxWorkDir) {
      throw new Error('writeFile requires a sandbox session (_sandboxWorkDir not set)');
    }

    const resolved = resolveSandboxPath(_sandboxWorkDir, filePath);

    // Create parent directories if requested
    if (createDirs) {
      const parentDir = resolved.substring(0, resolved.lastIndexOf('/'));
      if (parentDir) {
        await Deno.mkdir(parentDir, { recursive: true });
      }
    }

    await Deno.writeTextFile(resolved, content);

    const encoder = new TextEncoder();
    const bytesWritten = encoder.encode(content).length;

    const result: WriteFileResult = {
      success: true,
      path: filePath,
      bytesWritten,
    };

    return result;
  },
});

// ---------------------------------------------------------------------------
// listFiles
// ---------------------------------------------------------------------------

type ListFilesInput = {
  path?: string;
  recursive?: boolean;
  maxDepth?: number;
  _sandboxWorkDir?: string;
};

export const listFiles = tool({
  description: 'List files and directories in the sandbox workspace.',
  inputSchema: jsonSchema<ListFilesInput>({
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Directory path relative to workspace root (default: root)',
      },
      recursive: {
        type: 'boolean',
        description: 'List recursively (default: false)',
      },
      maxDepth: {
        type: 'number',
        description: 'Maximum depth for recursive listing (default: 3)',
      },
      _sandboxWorkDir: {
        type: 'string',
        description: 'Injected by sandbox server — workspace directory',
      },
    },
    additionalProperties: false,
  }),
  async execute({ path: dirPath = '.', recursive = false, maxDepth, _sandboxWorkDir }) {
    if (!_sandboxWorkDir) {
      throw new Error('listFiles requires a sandbox session (_sandboxWorkDir not set)');
    }

    const effectiveMaxDepth = maxDepth ?? DEFAULT_MAX_DEPTH;
    const resolved = resolveSandboxPath(_sandboxWorkDir, dirPath);
    const entries: FileEntry[] = [];
    let truncated = false;

    const normalizedWorkDir = '/' + _sandboxWorkDir.replace(/^\/+/, '').replace(/\/+$/, '');

    async function walk(dir: string, depth: number, prefix: string): Promise<void> {
      if (entries.length >= MAX_LIST_ENTRIES) {
        truncated = true;
        return;
      }

      for await (const entry of Deno.readDir(dir)) {
        if (entries.length >= MAX_LIST_ENTRIES) {
          truncated = true;
          return;
        }

        const entryPath = `${dir}/${entry.name}`;
        const displayName = prefix ? `${prefix}/${entry.name}` : entry.name;

        // Skip symlinks that escape the workspace
        if (entry.isSymlink) {
          try {
            const realPath = await Deno.realPath(entryPath);
            if (!realPath.startsWith(normalizedWorkDir)) {
              continue; // silently skip symlinks that point outside
            }
          } catch {
            continue; // skip broken symlinks
          }
        }

        let size: number | null = null;
        if (entry.isFile) {
          try {
            const info = await Deno.stat(entryPath);
            size = info.size;
          } catch {
            // Permission or race condition — skip size
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

    const result: ListFilesResult = {
      path: dirPath,
      entries,
      truncated,
    };

    return result;
  },
});

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default { shellExec, readFile, writeFile, listFiles };
