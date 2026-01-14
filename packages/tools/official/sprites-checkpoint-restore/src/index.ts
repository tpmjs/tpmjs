/**
 * Sprites Checkpoint Restore Tool for TPMJS
 * Restores a sprite to a previous checkpoint state, reverting all filesystem changes.
 *
 * @requires SPRITES_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const SPRITES_API_BASE = 'https://api.sprites.dev/v1';

export interface Sprite {
  name: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  createdAt: string;
  runtime?: string;
  metadata?: Record<string, unknown>;
}

export interface SpritesCheckpointRestoreResult {
  restored: boolean;
  checkpointId: string;
  sprite: Sprite;
}

type SpritesCheckpointRestoreInput = {
  name: string;
  checkpointId: string;
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

export const spritesCheckpointRestoreTool = tool({
  description:
    'Restore a sprite to a previous checkpoint state, reverting all filesystem changes since that checkpoint. Use this to undo changes or recover from errors.',
  inputSchema: jsonSchema<SpritesCheckpointRestoreInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the sprite to restore',
      },
      checkpointId: {
        type: 'string',
        description: 'ID of the checkpoint to restore to',
      },
    },
    required: ['name', 'checkpointId'],
    additionalProperties: false,
  }),
  async execute({ name, checkpointId }): Promise<SpritesCheckpointRestoreResult> {
    if (!name || typeof name !== 'string') {
      throw new Error('Sprite name is required and must be a string');
    }
    if (!checkpointId || typeof checkpointId !== 'string') {
      throw new Error('Checkpoint ID is required and must be a string');
    }

    const token = getSpritesToken();

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min for restore

      response = await fetch(
        `${SPRITES_API_BASE}/sprites/${encodeURIComponent(name)}/checkpoints/${encodeURIComponent(checkpointId)}/restore`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'TPMJS/1.0',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request to restore checkpoint "${checkpointId}" timed out`);
        }
        throw new Error(`Failed to restore checkpoint "${checkpointId}": ${error.message}`);
      }
      throw new Error(`Failed to restore checkpoint "${checkpointId}": Unknown network error`);
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Sprite "${name}" or checkpoint "${checkpointId}" not found`);
      }
      if (response.status === 401) {
        throw new Error('Invalid SPRITES_TOKEN. Check your API token at https://sprites.dev');
      }
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Failed to restore checkpoint "${checkpointId}": HTTP ${response.status} - ${errorText}`
      );
    }

    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      // If no JSON response, assume success
      data = {};
    }

    const spriteData = (data.sprite as Record<string, unknown>) || data;

    return {
      restored: true,
      checkpointId,
      sprite: {
        name: (spriteData.name as string) || name,
        status: (spriteData.status as Sprite['status']) || 'running',
        createdAt: (spriteData.createdAt as string) || '',
        runtime: spriteData.runtime as string | undefined,
        metadata: spriteData.metadata as Record<string, unknown> | undefined,
      },
    };
  },
});

export default spritesCheckpointRestoreTool;
