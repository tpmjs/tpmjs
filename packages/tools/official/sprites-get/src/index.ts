/**
 * Sprites Get Tool for TPMJS
 * Retrieves details of a specific sprite by name including status and configuration.
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

type SpritesGetInput = {
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

export const spritesGetTool = tool({
  description:
    'Retrieve details of a specific sprite by name including status and configuration. Use this to check if a sprite exists and get its current state.',
  inputSchema: jsonSchema<SpritesGetInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the sprite to retrieve',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute({ name }): Promise<Sprite> {
    if (!name || typeof name !== 'string') {
      throw new Error('Sprite name is required and must be a string');
    }

    const token = getSpritesToken();

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      response = await fetch(`${SPRITES_API_BASE}/sprites/${encodeURIComponent(name)}`, {
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
          throw new Error(`Request to get sprite "${name}" timed out after 30 seconds`);
        }
        throw new Error(`Failed to get sprite "${name}": ${error.message}`);
      }
      throw new Error(`Failed to get sprite "${name}": Unknown network error`);
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Sprite "${name}" not found`);
      }
      if (response.status === 401) {
        throw new Error('Invalid SPRITES_TOKEN. Check your API token at https://sprites.dev');
      }
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to get sprite "${name}": HTTP ${response.status} - ${errorText}`);
    }

    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new Error('Failed to parse response from Sprites API');
    }

    return {
      name: (data.name as string) || name,
      status: (data.status as Sprite['status']) || 'running',
      createdAt: (data.createdAt as string) || '',
      runtime: data.runtime as string | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
    };
  },
});

export default spritesGetTool;
