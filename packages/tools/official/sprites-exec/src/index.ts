/**
 * Sprites Exec Tool for TPMJS
 * Executes a command inside a sprite and returns the output.
 * Supports stdin input for interactive commands.
 *
 * @requires SPRITES_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const SPRITES_API_BASE = 'https://api.sprites.dev/v1';

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

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const body: Record<string, unknown> = { cmd };
      if (stdin) {
        body.stdin = stdin;
      }

      response = await fetch(`${SPRITES_API_BASE}/sprites/${encodeURIComponent(name)}/exec`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TPMJS/1.0',
        },
        body: JSON.stringify(body),
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

    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new Error('Failed to parse response from Sprites API');
    }

    return {
      exitCode: (data.exitCode as number) ?? (data.exit_code as number) ?? 0,
      stdout: (data.stdout as string) || '',
      stderr: (data.stderr as string) || '',
      duration: (data.duration as number) || duration,
    };
  },
});

export default spritesExecTool;
