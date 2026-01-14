/**
 * Sprites Create Tool for TPMJS
 * Creates a new isolated Linux sandbox environment (sprite) with persistent filesystem
 * using the Sprites API.
 *
 * @requires SPRITES_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const SPRITES_API_BASE = 'https://api.sprites.dev/v1';

/**
 * Output interface for a sprite
 */
export interface Sprite {
  name: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  createdAt: string;
  runtime?: string;
  metadata?: Record<string, unknown>;
}

type SpritesCreateInput = {
  name: string;
};

/**
 * Validates that a sprite name is valid
 * Must be lowercase alphanumeric with hyphens, 3-63 characters
 */
function isValidSpriteName(name: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(name);
}

/**
 * Gets the Sprites API token from environment
 */
function getSpritesToken(): string {
  const token = process.env.SPRITES_TOKEN;
  if (!token) {
    throw new Error(
      'SPRITES_TOKEN environment variable is required. Get your token from https://sprites.dev'
    );
  }
  return token;
}

/**
 * Sprites Create Tool
 * Creates a new sprite sandbox environment
 */
export const spritesCreateTool = tool({
  description:
    'Create a new isolated Linux sandbox environment (sprite) with persistent filesystem using the Sprites API. Sprites are lightweight VMs for running code securely.',
  inputSchema: jsonSchema<SpritesCreateInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description:
          'Unique name for the sprite (must be lowercase alphanumeric with hyphens, 3-63 characters)',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute({ name }): Promise<Sprite> {
    // Validate input
    if (!name || typeof name !== 'string') {
      throw new Error('Sprite name is required and must be a string');
    }

    if (!isValidSpriteName(name)) {
      throw new Error(
        `Invalid sprite name: ${name}. Must be lowercase alphanumeric with hyphens, 3-63 characters.`
      );
    }

    const token = getSpritesToken();

    // Create the sprite via API
    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for creation

      response = await fetch(`${SPRITES_API_BASE}/sprites`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TPMJS/1.0',
        },
        body: JSON.stringify({ name }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request to create sprite "${name}" timed out after 60 seconds`);
        }
        throw new Error(`Failed to create sprite "${name}": ${error.message}`);
      }
      throw new Error(`Failed to create sprite "${name}": Unknown network error`);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      if (response.status === 401) {
        throw new Error('Invalid SPRITES_TOKEN. Check your API token at https://sprites.dev');
      }
      if (response.status === 409) {
        throw new Error(`Sprite "${name}" already exists. Choose a different name.`);
      }
      throw new Error(`Failed to create sprite "${name}": HTTP ${response.status} - ${errorText}`);
    }

    // Parse response
    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new Error(`Failed to parse response from Sprites API`);
    }

    const sprite: Sprite = {
      name: (data.name as string) || name,
      status: (data.status as Sprite['status']) || 'creating',
      createdAt: (data.createdAt as string) || new Date().toISOString(),
      runtime: data.runtime as string | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
    };

    return sprite;
  },
});

export default spritesCreateTool;
