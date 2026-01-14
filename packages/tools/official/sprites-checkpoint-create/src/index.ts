/**
 * Sprites Checkpoint Create Tool for TPMJS
 * Creates a point-in-time snapshot of a sprite's filesystem state for later restoration.
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

type SpritesCheckpointCreateInput = {
  name: string;
  checkpointName?: string;
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

export const spritesCheckpointCreateTool = tool({
  description:
    "Create a point-in-time snapshot (checkpoint) of a sprite's filesystem state for later restoration. Useful for saving state before risky operations.",
  inputSchema: jsonSchema<SpritesCheckpointCreateInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the sprite to checkpoint',
      },
      checkpointName: {
        type: 'string',
        description: 'Optional human-readable name for the checkpoint',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute({ name, checkpointName }): Promise<Checkpoint> {
    if (!name || typeof name !== 'string') {
      throw new Error('Sprite name is required and must be a string');
    }

    const token = getSpritesToken();

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min for checkpoints

      const body: Record<string, unknown> = {};
      if (checkpointName) {
        body.name = checkpointName;
      }

      response = await fetch(
        `${SPRITES_API_BASE}/sprites/${encodeURIComponent(name)}/checkpoints`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'TPMJS/1.0',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request to create checkpoint for sprite "${name}" timed out`);
        }
        throw new Error(`Failed to create checkpoint for sprite "${name}": ${error.message}`);
      }
      throw new Error(`Failed to create checkpoint for sprite "${name}": Unknown network error`);
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
        `Failed to create checkpoint for sprite "${name}": HTTP ${response.status} - ${errorText}`
      );
    }

    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new Error('Failed to parse response from Sprites API');
    }

    return {
      id: (data.id as string) || '',
      name: (data.name as string) || checkpointName,
      createdAt:
        (data.createdAt as string) || (data.created_at as string) || new Date().toISOString(),
      size: data.size as number | undefined,
    };
  },
});

export default spritesCheckpointCreateTool;
