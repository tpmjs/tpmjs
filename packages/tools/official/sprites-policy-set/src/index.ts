/**
 * Sprites Policy Set Tool for TPMJS
 * Updates the network policy for a sprite to control outbound network access.
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

export interface SpritesPolicySetResult {
  policy: NetworkPolicy;
  applied: boolean;
}

type SpritesPolicySetInput = {
  name: string;
  mode: 'allow' | 'deny';
  domains: string[];
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

export const spritesPolicySetTool = tool({
  description:
    "Update the network policy for a sprite to control outbound network access with DNS-based filtering. Use 'allow' mode to block all traffic except listed domains, or 'deny' mode to allow all traffic except listed domains.",
  inputSchema: jsonSchema<SpritesPolicySetInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the sprite to update policy for',
      },
      mode: {
        type: 'string',
        enum: ['allow', 'deny'],
        description:
          "Policy mode - 'allow' blocks all except listed domains, 'deny' allows all except listed domains",
      },
      domains: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of domains to allow or deny based on mode',
      },
    },
    required: ['name', 'mode', 'domains'],
    additionalProperties: false,
  }),
  async execute({ name, mode, domains }): Promise<SpritesPolicySetResult> {
    if (!name || typeof name !== 'string') {
      throw new Error('Sprite name is required and must be a string');
    }
    if (mode !== 'allow' && mode !== 'deny') {
      throw new Error("Mode must be 'allow' or 'deny'");
    }
    if (!Array.isArray(domains)) {
      throw new Error('Domains must be an array of strings');
    }

    const token = getSpritesToken();

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // API endpoint: POST /v1/sprites/{name}/policy/network
      // Body format: { "rules": [{ "domain": "...", "action": "allow" | "deny" }] }
      // Convert our mode/domains format to rules array
      const rules = domains.map((domain) => ({
        domain,
        action: mode, // 'allow' or 'deny'
      }));

      response = await fetch(
        `${SPRITES_API_BASE}/sprites/${encodeURIComponent(name)}/policy/network`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'TPMJS/1.0',
          },
          body: JSON.stringify({ rules }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request to set policy for sprite "${name}" timed out`);
        }
        throw new Error(`Failed to set policy for sprite "${name}": ${error.message}`);
      }
      throw new Error(`Failed to set policy for sprite "${name}": Unknown network error`);
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
        `Failed to set policy for sprite "${name}": HTTP ${response.status} - ${errorText}`
      );
    }

    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      // If no JSON response, assume policy was applied with our input
      data = { mode, domains };
    }

    return {
      policy: {
        mode: (data.mode as NetworkPolicy['mode']) || mode,
        domains: (data.domains as string[]) || domains,
        rules: data.rules as Record<string, unknown>[] | undefined,
      },
      applied: true,
    };
  },
});

export default spritesPolicySetTool;
