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

      // API endpoint: POST /v1/sprites/{name}/checkpoint (singular, not plural)
      // Note: Returns application/x-ndjson streaming progress events
      response = await fetch(`${SPRITES_API_BASE}/sprites/${encodeURIComponent(name)}/checkpoint`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TPMJS/1.0',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

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

    // API returns application/x-ndjson streaming progress events
    // Each line is a JSON object, we need to parse all lines and find the result
    let text: string;
    try {
      text = await response.text();
    } catch {
      throw new Error('Failed to read response from Sprites API');
    }

    // Parse NDJSON - split by newlines and parse each line as JSON
    // Format: {"type":"info"|"complete"|"error","data":"...","time":"..."}
    // The checkpoint ID is in lines like:
    //   {"type":"info","data":"  ID: v2",...}
    //   {"type":"complete","data":"Checkpoint v2 created successfully",...}
    const lines = text
      .trim()
      .split('\n')
      .filter((line) => line.trim());
    let checkpointId = '';
    let createdAt = '';

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as { type?: string; data?: string; time?: string };

        // Check for error
        if (parsed.type === 'error') {
          throw new Error(`Checkpoint creation failed: ${parsed.data || 'Unknown error'}`);
        }

        // Extract checkpoint ID from "  ID: v2" line
        if (parsed.type === 'info' && parsed.data?.trim().startsWith('ID:')) {
          checkpointId = parsed.data.trim().replace('ID:', '').trim();
        }

        // Extract created time from "  Created: 2026-01-14 18:23:26" line
        if (parsed.type === 'info' && parsed.data?.trim().startsWith('Created:')) {
          createdAt = parsed.data.trim().replace('Created:', '').trim();
        }

        // Also try to extract from complete message like "Checkpoint v2 created successfully"
        if (parsed.type === 'complete' && parsed.data && !checkpointId) {
          const match = parsed.data.match(/Checkpoint\s+(\S+)\s+created/);
          if (match && match[1]) {
            checkpointId = match[1];
          }
        }
      } catch (parseError) {
        // Skip lines that aren't valid JSON (could be progress messages)
        if (parseError instanceof SyntaxError) continue;
        throw parseError;
      }
    }

    if (!checkpointId) {
      throw new Error(
        `Failed to extract checkpoint ID from response. Raw response: ${text.slice(0, 300)}`
      );
    }

    return {
      id: checkpointId,
      name: checkpointName || checkpointId,
      createdAt: createdAt || new Date().toISOString(),
      size: undefined,
    };
  },
});

export default spritesCheckpointCreateTool;
