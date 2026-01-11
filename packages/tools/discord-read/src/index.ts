/**
 * Discord Read Tool
 * Fetches messages from a Discord server for the past N hours
 */

import { jsonSchema, tool } from 'ai';

// Tool input type
type DiscordReadInput = {
  guildId: string;
  hours?: number;
  excludeChannels?: string[];
  excludeBots?: boolean;
};

const DISCORD_API_BASE = 'https://discord.com/api/v10';

/**
 * Fetch messages from a channel, paginating through results
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Discord API pagination with time filtering
async function fetchChannelMessages(
  headers: Record<string, string>,
  channelId: string,
  cutoffTime: number,
  excludeBots: boolean
): Promise<
  Array<{
    author: string;
    content: string;
    timestamp: string;
    attachments: number;
    reactions: number;
  }>
> {
  const messages: Array<{
    author: string;
    content: string;
    timestamp: string;
    attachments: number;
    reactions: number;
  }> = [];

  let lastMessageId: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${DISCORD_API_BASE}/channels/${channelId}/messages`);
    url.searchParams.set('limit', '100');
    if (lastMessageId) {
      url.searchParams.set('before', lastMessageId);
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      // Channel might not be accessible, skip it
      break;
    }

    const batch = (await response.json()) as Array<{
      id: string;
      content: string;
      author: { id: string; username: string; bot?: boolean };
      timestamp: string;
      attachments: unknown[];
      reactions?: unknown[];
    }>;

    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    for (const msg of batch) {
      const msgTime = new Date(msg.timestamp).getTime();

      // Stop if we've gone past our time window
      if (msgTime < cutoffTime) {
        hasMore = false;
        break;
      }

      // Skip bot messages if requested
      if (excludeBots && msg.author.bot) {
        continue;
      }

      // Skip empty messages (system messages, etc.)
      if (!msg.content && msg.attachments.length === 0) {
        continue;
      }

      messages.push({
        author: msg.author.username,
        content: msg.content || '[attachment]',
        timestamp: msg.timestamp,
        attachments: msg.attachments.length,
        reactions: msg.reactions?.length || 0,
      });
    }

    lastMessageId = batch[batch.length - 1]?.id;

    // Rate limit protection
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return messages;
}

/**
 * Discord Read Tool
 * Reads messages from all text channels in a Discord server for the past N hours
 */
export const discordReadTool = tool({
  description:
    'Read messages from a Discord server for the past N hours. Fetches all text channels and their messages, filtering by time and optionally excluding bot messages.',
  inputSchema: jsonSchema<DiscordReadInput>({
    type: 'object',
    properties: {
      guildId: {
        type: 'string',
        description: 'Discord server (guild) ID',
      },
      hours: {
        type: 'number',
        description: 'Number of hours to look back (default: 24)',
      },
      excludeChannels: {
        type: 'array',
        items: { type: 'string' },
        description: 'Channel IDs to exclude from reading',
      },
      excludeBots: {
        type: 'boolean',
        description: 'Whether to exclude bot messages (default: true)',
      },
    },
    required: ['guildId'],
    additionalProperties: false,
  }),
  execute: discordReadExecute,
});

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Multi-step Discord API workflow
async function discordReadExecute(input: DiscordReadInput) {
  // Get token from environment - the executor injects this
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    return {
      success: false,
      error: 'DISCORD_BOT_TOKEN environment variable is required',
    };
  }

  const headers = {
    Authorization: `Bot ${token}`,
    'Content-Type': 'application/json',
  };

  const hours = input.hours || 24;
  const excludeBots = input.excludeBots !== false;
  const excludeChannels = input.excludeChannels || [];
  const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

  try {
    // 1. Get guild info
    const guildResponse = await fetch(`${DISCORD_API_BASE}/guilds/${input.guildId}`, { headers });

    if (!guildResponse.ok) {
      const error = await guildResponse.text();
      return {
        success: false,
        error: `Failed to fetch guild: ${error}`,
      };
    }

    const guild = (await guildResponse.json()) as { id: string; name: string };

    // 2. Get all channels
    const channelsResponse = await fetch(`${DISCORD_API_BASE}/guilds/${input.guildId}/channels`, {
      headers,
    });

    if (!channelsResponse.ok) {
      return {
        success: false,
        error: 'Failed to fetch channels',
      };
    }

    const allChannels = (await channelsResponse.json()) as Array<{
      id: string;
      name: string;
      type: number;
    }>;

    // Filter to text channels only (type 0 = GUILD_TEXT)
    const textChannels = allChannels.filter((c) => c.type === 0 && !excludeChannels.includes(c.id));

    // 3. Fetch messages from each channel
    const channelResults: Array<{
      id: string;
      name: string;
      messageCount: number;
      messages: Array<{
        author: string;
        content: string;
        timestamp: string;
        attachments: number;
        reactions: number;
      }>;
    }> = [];

    for (const channel of textChannels) {
      const messages = await fetchChannelMessages(headers, channel.id, cutoffTime, excludeBots);

      if (messages.length > 0) {
        channelResults.push({
          id: channel.id,
          name: channel.name,
          messageCount: messages.length,
          messages,
        });
      }
    }

    const totalMessages = channelResults.reduce((sum, c) => sum + c.messageCount, 0);

    return {
      success: true,
      guildName: guild.name,
      channels: channelResults,
      totalMessages,
      timeRange: {
        start: new Date(cutoffTime).toISOString(),
        end: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
