/**
 * Sprites Sessions Tool for TPMJS
 * Lists active execution sessions for a sprite.
 *
 * @requires SPRITES_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const SPRITES_API_BASE = 'https://api.sprites.dev/v1';

export interface ExecSession {
  id: string;
  status: 'active' | 'completed' | 'terminated';
  startedAt: string;
  command?: string;
}

export interface SpritesSessionsResult {
  sessions: ExecSession[];
  count: number;
}

type SpritesSessionsInput = {
  name: string;
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

export const spritesSessionsTool = tool({
  description:
    'List active execution sessions for a sprite. Useful for monitoring running commands or attaching to existing sessions.',
  inputSchema: jsonSchema<SpritesSessionsInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the sprite to list sessions for',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute({ name }): Promise<SpritesSessionsResult> {
    if (!name || typeof name !== 'string') {
      throw new Error('Sprite name is required and must be a string');
    }

    const token = getSpritesToken();

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // API endpoint: GET /v1/sprites/{name}/exec lists active exec sessions
      response = await fetch(`${SPRITES_API_BASE}/sprites/${encodeURIComponent(name)}/exec`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'TPMJS/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request to list sessions for sprite "${name}" timed out`);
        }
        throw new Error(`Failed to list sessions for sprite "${name}": ${error.message}`);
      }
      throw new Error(`Failed to list sessions for sprite "${name}": Unknown network error`);
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Sprite "${name}" not found`);
      }
      if (response.status === 401) {
        throw new Error('Invalid SPRITES_TOKEN. Check your API token at https://sprites.dev');
      }
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Failed to list sessions for sprite "${name}": HTTP ${response.status} - ${errorText}`
      );
    }

    let data: unknown;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new Error('Failed to parse response from Sprites API');
    }

    const sessionsArray = Array.isArray(data) ? data : (data as Record<string, unknown>).sessions;

    const sessions: ExecSession[] = (Array.isArray(sessionsArray) ? sessionsArray : []).map(
      (s: Record<string, unknown>) => ({
        id: s.id as string,
        status: (s.status as ExecSession['status']) || 'active',
        startedAt: (s.startedAt as string) || (s.started_at as string) || '',
        command: s.command as string | undefined,
      })
    );

    return {
      sessions,
      count: sessions.length,
    };
  },
});

export default spritesSessionsTool;
