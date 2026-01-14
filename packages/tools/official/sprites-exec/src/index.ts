/**
 * Sprites Exec Tool for TPMJS
 * Executes a command inside a sprite and returns the output.
 * Supports stdin input for interactive commands.
 *
 * @requires SPRITES_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const SPRITES_API_BASE = 'https://api.sprites.dev/v1';

// Binary stream IDs from Sprites API
const STREAM_STDIN = 0x00;
const STREAM_STDOUT = 0x01;
const STREAM_STDERR = 0x02;
const STREAM_EXIT = 0x03;

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

type SpritesExecInput = {
  name: string;
  cmd: string;
  stdin?: string;
  timeoutMs?: number;
};

function getSpritesToken(): string {
  const token = process.env.SPRITES_TOKEN;
  if (!token) {
    throw new Error(
      'SPRITES_TOKEN environment variable is required. Get your token from https://sprites.dev'
    );
  }
  return token;
}

/**
 * Parse a command string into command and arguments.
 * Handles quoted strings and escapes.
 */
function parseCommand(cmdString: string): string[] {
  const args: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let i = 0; i < cmdString.length; i++) {
    const char = cmdString[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && !inSingleQuote) {
      escaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (char === ' ' && !inSingleQuote && !inDoubleQuote) {
      if (current.length > 0) {
        args.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    args.push(current);
  }

  return args;
}

/**
 * Parse the binary response from Sprites API.
 * Format: [stream_id: 1 byte][payload: rest until next stream_id or end]
 */
function parseBinaryResponse(buffer: Uint8Array): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  let stdout = '';
  let stderr = '';
  let exitCode = 0;

  const decoder = new TextDecoder();
  let i = 0;

  while (i < buffer.length) {
    const streamId = buffer[i];
    i++;

    if (streamId === STREAM_EXIT) {
      // Exit code is a single byte
      if (i < buffer.length) {
        exitCode = buffer[i] as number;
        i++;
      }
      continue;
    }

    // Find the next stream marker or end of buffer
    let end = i;
    while (end < buffer.length) {
      const nextByte = buffer[end] as number;
      // Check if this looks like a stream ID (0x00-0x03) at a boundary
      // We detect boundaries by looking for stream IDs that make sense
      if (nextByte <= STREAM_EXIT) {
        // Look ahead to see if this is really a stream marker
        // Stream markers are followed by data or another marker
        break;
      }
      end++;
    }

    const payload = decoder.decode(buffer.slice(i, end));

    switch (streamId) {
      case STREAM_STDIN:
        // Ignore stdin echo
        break;
      case STREAM_STDOUT:
        stdout += payload;
        break;
      case STREAM_STDERR:
        stderr += payload;
        break;
    }

    i = end;
  }

  return { stdout, stderr, exitCode };
}

export const spritesExecTool = tool({
  description:
    'Execute a command inside a sprite and return the output. Supports stdin input for interactive commands. Returns exit code, stdout, stderr, and execution duration.',
  inputSchema: jsonSchema<SpritesExecInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the sprite to execute command in',
      },
      cmd: {
        type: 'string',
        description: "Command to execute (e.g., 'ls -la', 'python script.py')",
      },
      stdin: {
        type: 'string',
        description: 'Optional stdin input to pass to the command',
      },
      timeoutMs: {
        type: 'number',
        description: 'Execution timeout in milliseconds (default: 60000)',
      },
    },
    required: ['name', 'cmd'],
    additionalProperties: false,
  }),
  async execute({ name, cmd, stdin, timeoutMs }): Promise<ExecResult> {
    if (!name || typeof name !== 'string') {
      throw new Error('Sprite name is required and must be a string');
    }
    if (!cmd || typeof cmd !== 'string') {
      throw new Error('Command is required and must be a string');
    }

    const token = getSpritesToken();
    const timeout = timeoutMs || 60000;
    const startTime = Date.now();

    // Parse command into parts
    const cmdParts = parseCommand(cmd);
    if (cmdParts.length === 0) {
      throw new Error('Command cannot be empty');
    }

    // Build URL with repeatable cmd query parameters
    // API expects: ?cmd=echo&cmd=hello&cmd=world for "echo hello world"
    const url = new URL(`${SPRITES_API_BASE}/sprites/${encodeURIComponent(name)}/exec`);
    for (const part of cmdParts) {
      url.searchParams.append('cmd', part);
    }

    // Add stdin flag if stdin is provided
    if (stdin) {
      url.searchParams.set('stdin', 'true');
    }

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'TPMJS/1.0',
          ...(stdin ? { 'Content-Type': 'application/octet-stream' } : {}),
        },
        body: stdin || undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Command execution in sprite "${name}" timed out after ${timeout}ms`);
        }
        throw new Error(`Failed to execute command in sprite "${name}": ${error.message}`);
      }
      throw new Error(`Failed to execute command in sprite "${name}": Unknown network error`);
    }

    const duration = Date.now() - startTime;

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Sprite "${name}" not found`);
      }
      if (response.status === 401) {
        throw new Error('Invalid SPRITES_TOKEN. Check your API token at https://sprites.dev');
      }
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Failed to execute command in sprite "${name}": HTTP ${response.status} - ${errorText}`
      );
    }

    // Parse binary response
    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const { stdout, stderr, exitCode } = parseBinaryResponse(buffer);

    return {
      exitCode,
      stdout,
      stderr,
      duration,
    };
  },
});

export default spritesExecTool;
