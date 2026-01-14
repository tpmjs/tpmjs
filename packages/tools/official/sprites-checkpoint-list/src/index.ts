/**
 * Sprites Checkpoint List Tool for TPMJS
 * Lists all checkpoints for a sprite ordered by creation time.
 *
 * @requires SPRITES_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const SPRITES_API_BASE = 'https://api.sprites.dev/v1';

export interface Checkpoint {
  id: string;
  name?: string;
  createdAt: string;
  size?: number;
}

export interface SpritesCheckpointListResult {
  checkpoints: Checkpoint[];
  count: number;
}

type SpritesCheckpointListInput = {
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

export const spritesCheckpointListTool = tool({
  description:
    'List all checkpoints for a sprite ordered by creation time. Use this to find checkpoint IDs for restoration.',
  inputSchema: jsonSchema<SpritesCheckpointListInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the sprite to list checkpoints for',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute({ name }): Promise<SpritesCheckpointListResult> {
    if (!name || typeof name !== 'string') {
      throw new Error('Sprite name is required and must be a string');
    }

    const token = getSpritesToken();

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      response = await fetch(
        `${SPRITES_API_BASE}/sprites/${encodeURIComponent(name)}/checkpoints`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'TPMJS/1.0',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request to list checkpoints for sprite "${name}" timed out`);
        }
        throw new Error(`Failed to list checkpoints for sprite "${name}": ${error.message}`);
      }
      throw new Error(`Failed to list checkpoints for sprite "${name}": Unknown network error`);
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
        `Failed to list checkpoints for sprite "${name}": HTTP ${response.status} - ${errorText}`
      );
    }

    let data: unknown;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new Error('Failed to parse response from Sprites API');
    }

    const checkpointsArray = Array.isArray(data)
      ? data
      : (data as Record<string, unknown>).checkpoints;

    const checkpoints: Checkpoint[] = (Array.isArray(checkpointsArray) ? checkpointsArray : []).map(
      (c: Record<string, unknown>) => ({
        id: c.id as string,
        name: c.name as string | undefined,
        createdAt: (c.createdAt as string) || (c.created_at as string) || '',
        size: c.size as number | undefined,
      })
    );

    return {
      checkpoints,
      count: checkpoints.length,
    };
  },
});

export default spritesCheckpointListTool;
