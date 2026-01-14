/**
 * Sprites Delete Tool for TPMJS
 * Deletes a sprite and all its associated data including checkpoints.
 *
 * @requires SPRITES_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const SPRITES_API_BASE = 'https://api.sprites.dev/v1';

export interface SpritesDeleteResult {
  deleted: boolean;
  name: string;
}

type SpritesDeleteInput = {
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

export const spritesDeleteTool = tool({
  description:
    'Delete a sprite and all its associated data including checkpoints. This action is irreversible.',
  inputSchema: jsonSchema<SpritesDeleteInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the sprite to delete',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute({ name }): Promise<SpritesDeleteResult> {
    if (!name || typeof name !== 'string') {
      throw new Error('Sprite name is required and must be a string');
    }

    const token = getSpritesToken();

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      response = await fetch(`${SPRITES_API_BASE}/sprites/${encodeURIComponent(name)}`, {
        method: 'DELETE',
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
          throw new Error(`Request to delete sprite "${name}" timed out after 30 seconds`);
        }
        throw new Error(`Failed to delete sprite "${name}": ${error.message}`);
      }
      throw new Error(`Failed to delete sprite "${name}": Unknown network error`);
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Sprite "${name}" not found`);
      }
      if (response.status === 401) {
        throw new Error('Invalid SPRITES_TOKEN. Check your API token at https://sprites.dev');
      }
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to delete sprite "${name}": HTTP ${response.status} - ${errorText}`);
    }

    return {
      deleted: true,
      name,
    };
  },
});

export default spritesDeleteTool;
