/**
 * Sprites URL Set Tool for TPMJS
 * Sets the access settings for a sprite URL (public or private).
 *
 * @requires SPRITES_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const SPRITES_API_BASE = 'https://api.sprites.dev/v1';

export interface SpriteUrlResult {
  url: string;
  auth: 'sprite' | 'public';
  name: string;
  updated: boolean;
}

type SpritesUrlSetInput = {
  name: string;
  auth: 'sprite' | 'public';
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

export const spritesUrlSetTool = tool({
  description:
    "Set the access settings for a sprite URL. Use 'public' to allow anyone to access the sprite URL (for web servers, APIs, webhooks), or 'sprite' to require authentication. The sprite must have a server listening on port 8080 for the URL to work.",
  inputSchema: jsonSchema<SpritesUrlSetInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the sprite to update',
      },
      auth: {
        type: 'string',
        enum: ['sprite', 'public'],
        description:
          "Access mode - 'public' for public access, 'sprite' for authenticated access only",
      },
    },
    required: ['name', 'auth'],
    additionalProperties: false,
  }),
  async execute({ name, auth }): Promise<SpriteUrlResult> {
    if (!name || typeof name !== 'string') {
      throw new Error('Sprite name is required and must be a string');
    }
    if (auth !== 'sprite' && auth !== 'public') {
      throw new Error("Auth must be 'sprite' or 'public'");
    }

    const token = getSpritesToken();

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // PUT /v1/sprites/{name} with url_settings
      response = await fetch(`${SPRITES_API_BASE}/sprites/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TPMJS/1.0',
        },
        body: JSON.stringify({
          url_settings: { auth },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request to set URL auth for sprite "${name}" timed out`);
        }
        throw new Error(`Failed to set URL auth for sprite "${name}": ${error.message}`);
      }
      throw new Error(`Failed to set URL auth for sprite "${name}": Unknown network error`);
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
        `Failed to set URL auth for sprite "${name}": HTTP ${response.status} - ${errorText}`
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
      auth: (urlSettings?.auth as 'sprite' | 'public') || auth,
      name: (data.name as string) || name,
      updated: true,
    };
  },
});

export default spritesUrlSetTool;
