/**
 * Sprites List Tool for TPMJS
 * Lists all sprites in the account with their current status and metadata.
 *
 * @requires SPRITES_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const SPRITES_API_BASE = 'https://api.sprites.dev/v1';

export interface Sprite {
  name: string;
  status: 'creating' | 'running' | 'stopped' | 'error' | 'cold' | 'warm';
  createdAt: string;
  runtime?: string;
  metadata?: Record<string, unknown>;
}

export interface SpritesListResult {
  sprites: Sprite[];
  count: number;
}

function getSpritesToken(): string {
  const token = process.env.SPRITES_TOKEN;
  if (!token) {
    throw new Error(
      'SPRITES_TOKEN environment variable is required. Get your token from https://sprites.dev'
    );
  }
  return token;
}

export const spritesListTool = tool({
  description:
    'List all sprites in the account with their current status and metadata. Returns an array of sprites with their names, statuses, and creation times.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<SpritesListResult> {
    const token = getSpritesToken();

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      response = await fetch(`${SPRITES_API_BASE}/sprites`, {
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
          throw new Error('Request to list sprites timed out after 30 seconds');
        }
        throw new Error(`Failed to list sprites: ${error.message}`);
      }
      throw new Error('Failed to list sprites: Unknown network error');
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      if (response.status === 401) {
        throw new Error('Invalid SPRITES_TOKEN. Check your API token at https://sprites.dev');
      }
      throw new Error(`Failed to list sprites: HTTP ${response.status} - ${errorText}`);
    }

    let data: unknown;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new Error('Failed to parse response from Sprites API');
    }

    // Handle both array response and object with sprites property
    const spritesArray = Array.isArray(data) ? data : (data as Record<string, unknown>).sprites;

    if (!Array.isArray(spritesArray)) {
      throw new Error('Invalid response from Sprites API: expected an array of sprites');
    }

    const sprites: Sprite[] = spritesArray.map((s: unknown) => {
      const sprite = s as Record<string, unknown>;
      const status = sprite.status as string | undefined;

      // Validate status is a known value
      // Note: "cold" is returned for sprites that have been idle
      // Note: "warm" is returned for sprites that are warming up
      if (status && !['creating', 'running', 'stopped', 'error', 'cold', 'warm'].includes(status)) {
        throw new Error(`Invalid sprite status: ${status}`);
      }

      return {
        name: sprite.name as string,
        status: (status as Sprite['status']) || 'running',
        createdAt: (sprite.createdAt as string) || '',
        runtime: sprite.runtime as string | undefined,
        metadata: sprite.metadata as Record<string, unknown> | undefined,
      };
    });

    return {
      sprites,
      count: sprites.length,
    };
  },
});

export default spritesListTool;
