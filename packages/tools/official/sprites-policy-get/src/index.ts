/**
 * Sprites Policy Get Tool for TPMJS
 * Retrieves the current network policy for a sprite including allowed domains.
 *
 * @requires SPRITES_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const SPRITES_API_BASE = 'https://api.sprites.dev/v1';

export interface NetworkPolicy {
  mode: 'allow' | 'deny';
  domains: string[];
  rules?: Record<string, unknown>[];
}

type SpritesPolicyGetInput = {
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

export const spritesPolicyGetTool = tool({
  description:
    'Retrieve the current network policy for a sprite including allowed domains and filtering rules. Use this to understand what network access a sprite has.',
  inputSchema: jsonSchema<SpritesPolicyGetInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the sprite to get policy for',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute({ name }): Promise<NetworkPolicy> {
    if (!name || typeof name !== 'string') {
      throw new Error('Sprite name is required and must be a string');
    }

    const token = getSpritesToken();

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // API endpoint: GET /v1/sprites/{name}/policy/network
      response = await fetch(
        `${SPRITES_API_BASE}/sprites/${encodeURIComponent(name)}/policy/network`,
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
          throw new Error(`Request to get policy for sprite "${name}" timed out`);
        }
        throw new Error(`Failed to get policy for sprite "${name}": ${error.message}`);
      }
      throw new Error(`Failed to get policy for sprite "${name}": Unknown network error`);
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
        `Failed to get policy for sprite "${name}": HTTP ${response.status} - ${errorText}`
      );
    }

    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new Error('Failed to parse response from Sprites API');
    }

    return {
      mode: (data.mode as NetworkPolicy['mode']) || 'deny',
      domains: (data.domains as string[]) || (data.allowedDomains as string[]) || [],
      rules: data.rules as Record<string, unknown>[] | undefined,
    };
  },
});

export default spritesPolicyGetTool;
