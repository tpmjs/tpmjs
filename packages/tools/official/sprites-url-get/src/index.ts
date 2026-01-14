/**
 * Sprites URL Get Tool for TPMJS
 * Retrieves the public URL and access settings for a sprite.
 *
 * @requires SPRITES_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const SPRITES_API_BASE = 'https://api.sprites.dev/v1';

export interface SpriteUrl {
  url: string;
  auth: 'sprite' | 'public';
  name: string;
  status: string;
}

type SpritesUrlGetInput = {
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

export const spritesUrlGetTool = tool({
  description:
    'Get the public URL and access settings for a sprite. Returns the URL that can be used to access web servers running on port 8080 in the sprite. The URL format is https://{name}-{id}.sprites.app',
  inputSchema: jsonSchema<SpritesUrlGetInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the sprite to get URL for',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute({ name }): Promise<SpriteUrl> {
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
          throw new Error(`Request to get URL for sprite "${name}" timed out`);
        }
        throw new Error(`Failed to get URL for sprite "${name}": ${error.message}`);
      }
      throw new Error(`Failed to get URL for sprite "${name}": Unknown network error`);
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
        `Failed to get URL for sprite "${name}": HTTP ${response.status} - ${errorText}`
      );
    }

    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new Error('Failed to parse response from Sprites API');
    }

    const urlSettings = data.url_settings as Record<string, unknown> | undefined;

    return {
      url: (data.url as string) || '',
      auth: (urlSettings?.auth as 'sprite' | 'public') || 'sprite',
      name: (data.name as string) || name,
      status: (data.status as string) || 'unknown',
    };
  },
});

export default spritesUrlGetTool;
