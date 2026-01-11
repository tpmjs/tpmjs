/**
 * Discord Post Tool
 * Posts messages and embeds to a Discord channel
 */

import { jsonSchema, tool } from 'ai';

// Tool input type
type DiscordPostInput = {
  channelId: string;
  content?: string;
  embed?: {
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    footer?: string;
    timestamp?: string;
  };
};

const DISCORD_API_BASE = 'https://discord.com/api/v10';

/**
 * Discord Post Tool
 * Posts a message or rich embed to a Discord channel
 */
export const discordPostTool = tool({
  description:
    'Post a message or rich embed to a Discord channel. Supports plain text messages and formatted embeds with titles, descriptions, colors, and fields.',
  inputSchema: jsonSchema<DiscordPostInput>({
    type: 'object',
    properties: {
      channelId: {
        type: 'string',
        description: 'Discord channel ID to post to',
      },
      content: {
        type: 'string',
        description: 'Plain text message content (max 2000 characters)',
      },
      embed: {
        type: 'object',
        description: 'Rich embed object for formatted messages',
        properties: {
          title: {
            type: 'string',
            description: 'Embed title (max 256 characters)',
          },
          description: {
            type: 'string',
            description: 'Embed description (max 4096 characters)',
          },
          color: {
            type: 'number',
            description: 'Embed color as decimal (e.g., 5793266 for Discord blurple)',
          },
          fields: {
            type: 'array',
            description: 'Array of field objects',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Field name (max 256 chars)',
                },
                value: {
                  type: 'string',
                  description: 'Field value (max 1024 chars)',
                },
                inline: { type: 'boolean', description: 'Display inline' },
              },
              required: ['name', 'value'],
            },
          },
          footer: {
            type: 'string',
            description: 'Footer text (max 2048 characters)',
          },
          timestamp: {
            type: 'string',
            description: 'ISO8601 timestamp to display',
          },
        },
      },
    },
    required: ['channelId'],
    additionalProperties: false,
  }),
  execute: discordPostExecute,
});

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Discord embed building with validation
async function discordPostExecute(input: DiscordPostInput) {
  // Get token from environment - the executor injects this
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    return {
      success: false,
      error: 'DISCORD_BOT_TOKEN environment variable is required',
    };
  }

  // Validate that we have something to post
  if (!input.content && !input.embed) {
    return {
      success: false,
      error: 'Either content or embed must be provided',
    };
  }

  // Build the message payload
  const payload: {
    content?: string;
    embeds?: Array<{
      title?: string;
      description?: string;
      color?: number;
      fields?: Array<{ name: string; value: string; inline?: boolean }>;
      footer?: { text: string };
      timestamp?: string;
    }>;
  } = {};

  if (input.content) {
    // Truncate to Discord's limit
    payload.content = input.content.slice(0, 2000);
  }

  if (input.embed) {
    const embed: {
      title?: string;
      description?: string;
      color?: number;
      fields?: Array<{ name: string; value: string; inline?: boolean }>;
      footer?: { text: string };
      timestamp?: string;
    } = {};

    if (input.embed.title) {
      embed.title = input.embed.title.slice(0, 256);
    }

    if (input.embed.description) {
      embed.description = input.embed.description.slice(0, 4096);
    }

    if (input.embed.color !== undefined) {
      embed.color = input.embed.color;
    }

    if (input.embed.fields && input.embed.fields.length > 0) {
      embed.fields = input.embed.fields.slice(0, 25).map((field) => ({
        name: field.name.slice(0, 256),
        value: field.value.slice(0, 1024),
        inline: field.inline,
      }));
    }

    if (input.embed.footer) {
      embed.footer = { text: input.embed.footer.slice(0, 2048) };
    }

    if (input.embed.timestamp) {
      embed.timestamp = input.embed.timestamp;
    }

    payload.embeds = [embed];
  }

  try {
    const response = await fetch(`${DISCORD_API_BASE}/channels/${input.channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Discord API error (${response.status}): ${errorText}`,
      };
    }

    const message = (await response.json()) as {
      id: string;
      channel_id: string;
      timestamp: string;
    };

    return {
      success: true,
      messageId: message.id,
      channelId: message.channel_id,
      timestamp: message.timestamp,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
