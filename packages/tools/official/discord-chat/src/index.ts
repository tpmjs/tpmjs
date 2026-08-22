/**
 * @tpmjs/tools-discord-chat — Discord the way a person uses it.
 *
 * Channels are addressed by NAME (or id), reads come back as clean normalised messages,
 * "catch up" summarises everything since a point in time across channels, and posting
 * works with a bot token or falls back to a plain webhook URL.
 *
 * @env DISCORD_BOT_TOKEN  bot token (reading, reacting, posting as the bot)
 * @env DISCORD_GUILD_ID   default server used to resolve channel names (optional)
 * @env DISCORD_WEBHOOK_URL webhook used by discordPost when no channel is given (optional)
 */

import { jsonSchema, tool } from 'ai';

const API = 'https://discord.com/api/v10';
const DISCORD_EPOCH = 1_420_070_400_000n;

function envValue(name: string): string | undefined {
  const value = globalThis.process?.env?.[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function botToken(): string {
  const token = envValue('DISCORD_BOT_TOKEN');
  if (!token) {
    throw new Error(
      'DISCORD_BOT_TOKEN is required for this operation (create one at https://discord.com/developers/applications).'
    );
  }
  return token;
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bot ${botToken()}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 429) {
    const retry = Number(res.headers.get('retry-after') ?? '1');
    await new Promise((r) => setTimeout(r, Math.min(retry, 5) * 1000));
    return api<T>(method, path, body);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Discord ${method} ${path} failed: ${res.status}${text ? ` — ${text.slice(0, 300)}` : ''}`
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ─── channel resolution ──────────────────────────────────────────────────────

interface RawGuild {
  id: string;
  name: string;
}
interface RawChannel {
  id: string;
  name: string;
  type: number;
  topic?: string | null;
  guild_id?: string;
  parent_id?: string | null;
  last_message_id?: string | null;
}

export interface ChannelInfo {
  id: string;
  name: string;
  topic: string | null;
  guildId: string;
  guild: string;
  kind: 'text' | 'announcement' | 'forum' | 'voice' | 'thread' | 'other';
}

const TEXT_TYPES = new Set([0, 5, 15, 10, 11, 12]);
function kindOf(type: number): ChannelInfo['kind'] {
  if (type === 0) return 'text';
  if (type === 5) return 'announcement';
  if (type === 15) return 'forum';
  if (type === 2 || type === 13) return 'voice';
  if (type === 10 || type === 11 || type === 12) return 'thread';
  return 'other';
}

async function listGuilds(): Promise<RawGuild[]> {
  const forced = envValue('DISCORD_GUILD_ID');
  if (forced) {
    const guild = await api<RawGuild>('GET', `/guilds/${forced}`);
    return [guild];
  }
  return api<RawGuild[]>('GET', '/users/@me/guilds');
}

// No module-level memoisation: the executor shares one module instance across callers,
// so anything cached here would leak one caller's data to the next.
async function allChannels(): Promise<ChannelInfo[]> {
  const guilds = await listGuilds();
  const out: ChannelInfo[] = [];
  for (const guild of guilds) {
    const channels = await api<RawChannel[]>('GET', `/guilds/${guild.id}/channels`);
    for (const c of channels) {
      if (!TEXT_TYPES.has(c.type) && c.type !== 2 && c.type !== 13) continue;
      out.push({
        id: c.id,
        name: c.name,
        topic: c.topic ?? null,
        guildId: guild.id,
        guild: guild.name,
        kind: kindOf(c.type),
      });
    }
  }
  return out;
}

async function resolveChannel(ref: string): Promise<ChannelInfo> {
  if (/^\d{15,22}$/.test(ref)) {
    const c = await api<RawChannel>('GET', `/channels/${ref}`);
    return {
      id: c.id,
      name: c.name,
      topic: c.topic ?? null,
      guildId: c.guild_id ?? '',
      guild: '',
      kind: kindOf(c.type),
    };
  }
  const wanted = ref.replace(/^#/, '').toLowerCase();
  const channels = await allChannels();
  const exact = channels.filter((c) => c.name.toLowerCase() === wanted);
  const hit = exact[0] ?? channels.find((c) => c.name.toLowerCase().includes(wanted));
  if (!hit) {
    throw new Error(
      `No channel named "${ref}". Known: ${channels
        .slice(0, 40)
        .map((c) => `#${c.name}`)
        .join(', ')}`
    );
  }
  return hit;
}

// ─── messages ────────────────────────────────────────────────────────────────

interface RawMessage {
  id: string;
  content: string;
  timestamp: string;
  author: { id: string; username: string; global_name?: string | null; bot?: boolean };
  attachments?: Array<{ url: string; filename: string; content_type?: string }>;
  embeds?: Array<{ title?: string; url?: string; description?: string }>;
  referenced_message?: { id: string; author?: { username: string } } | null;
  reactions?: Array<{ emoji: { name: string }; count: number }>;
  thread?: { id: string; name: string } | null;
}

export interface Message {
  id: string;
  at: string;
  author: string;
  bot: boolean;
  content: string;
  attachments: string[];
  embeds: Array<{ title?: string; url?: string; description?: string }>;
  replyTo: string | null;
  reactions: Array<{ emoji: string; count: number }>;
}

function normalise(m: RawMessage): Message {
  return {
    id: m.id,
    at: m.timestamp,
    author: m.author.global_name || m.author.username,
    bot: Boolean(m.author.bot),
    content: m.content,
    attachments: (m.attachments ?? []).map((a) => a.url),
    embeds: (m.embeds ?? [])
      .map((e) => ({ title: e.title, url: e.url, description: e.description }))
      .filter((e) => e.title || e.url || e.description),
    replyTo: m.referenced_message?.id ?? null,
    reactions: (m.reactions ?? []).map((r) => ({ emoji: r.emoji.name, count: r.count })),
  };
}

/** "24h", "7d", "90m", or an ISO date → Date */
function parseSince(value: string): Date {
  const rel = /^(\d+)\s*([mhd])$/i.exec(value.trim());
  if (rel) {
    const n = Number(rel[1]);
    const unit = (rel[2] as string).toLowerCase();
    const ms = unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
    return new Date(Date.now() - n * ms);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime()))
    throw new Error(`Unrecognised time "${value}" — use "24h", "7d", "90m" or an ISO date.`);
  return d;
}

const snowflakeFor = (date: Date): string =>
  ((BigInt(date.getTime()) - DISCORD_EPOCH) << 22n).toString();

async function readSince(channelId: string, since: Date | null, limit: number): Promise<Message[]> {
  const out: RawMessage[] = [];
  let after = since ? snowflakeFor(since) : undefined;
  let before: string | undefined;
  while (out.length < limit) {
    const page = Math.min(100, limit - out.length);
    const query = after
      ? `after=${after}&limit=${page}`
      : `limit=${page}${before ? `&before=${before}` : ''}`;
    const batch = await api<RawMessage[]>('GET', `/channels/${channelId}/messages?${query}`);
    if (batch.length === 0) break;
    out.push(...batch);
    if (batch.length < page) break;
    if (after)
      after = batch.reduce(
        (max, m) => (BigInt(m.id) > BigInt(max) ? m.id : max),
        batch[0]?.id ?? after
      );
    else before = batch[batch.length - 1]?.id;
  }
  const sorted = out.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
  return sorted.slice(-limit).map(normalise);
}

// ─── tools ───────────────────────────────────────────────────────────────────

export const discordChannels = tool({
  description:
    'List the text channels the bot can see (id, name, topic, server), optionally filtered by name.',
  inputSchema: jsonSchema<{ filter?: string }>({
    type: 'object',
    properties: {
      filter: { type: 'string', description: 'Substring to match channel names against' },
    },
    additionalProperties: false,
  }),
  async execute({ filter }): Promise<{ channels: ChannelInfo[] }> {
    const channels = await allChannels();
    const q = filter?.replace(/^#/, '').toLowerCase();
    return { channels: q ? channels.filter((c) => c.name.toLowerCase().includes(q)) : channels };
  },
});

export const discordRead = tool({
  description:
    'Read recent messages from a channel by name or id, newest last, with authors, attachments and reply links.',
  inputSchema: jsonSchema<{ channel: string; limit?: number; since?: string }>({
    type: 'object',
    properties: {
      channel: {
        type: 'string',
        description: 'Channel name (e.g. "general" or "#general") or channel id',
      },
      limit: { type: 'integer', description: 'Max messages (default 25, max 200)', default: 25 },
      since: {
        type: 'string',
        description: 'Only messages after this point: "24h", "7d", "90m" or an ISO date',
      },
    },
    required: ['channel'],
    additionalProperties: false,
  }),
  async execute({
    channel,
    limit = 25,
    since,
  }): Promise<{ channel: ChannelInfo; messages: Message[] }> {
    const info = await resolveChannel(channel);
    const messages = await readSince(
      info.id,
      since ? parseSince(since) : null,
      Math.min(Math.max(1, limit), 200)
    );
    return { channel: info, messages };
  },
});

export const discordCatchUp = tool({
  description:
    'Catch up on everything posted since a point in time (e.g. "24h") across one, several or all text channels; returns messages grouped per channel, quiet channels omitted.',
  inputSchema: jsonSchema<{ since?: string; channels?: string[]; perChannelLimit?: number }>({
    type: 'object',
    properties: {
      since: {
        type: 'string',
        description: '"24h", "7d", "90m" or ISO date (default 24h)',
        default: '24h',
      },
      channels: {
        type: 'array',
        items: { type: 'string' },
        description: 'Channel names/ids; omit for all text channels',
      },
      perChannelLimit: {
        type: 'integer',
        description: 'Max messages per channel (default 50, max 200)',
        default: 50,
      },
    },
    additionalProperties: false,
  }),
  async execute({ since = '24h', channels, perChannelLimit = 50 }) {
    const sinceDate = parseSince(since);
    const targets = channels?.length
      ? await Promise.all(channels.map((c) => resolveChannel(c)))
      : (await allChannels()).filter((c) => c.kind === 'text' || c.kind === 'announcement');
    const limit = Math.min(Math.max(1, perChannelLimit), 200);
    const results: Array<{ channel: ChannelInfo; messages: Message[] }> = [];
    for (const target of targets) {
      try {
        const messages = await readSince(target.id, sinceDate, limit);
        if (messages.length) results.push({ channel: target, messages });
      } catch {
        // channels the bot cannot read are skipped, not fatal
      }
    }
    const total = results.reduce((n, r) => n + r.messages.length, 0);
    return {
      since: sinceDate.toISOString(),
      channelsChecked: targets.length,
      totalMessages: total,
      channels: results,
    };
  },
});

export const discordPost = tool({
  description:
    'Post a message to a channel by name or id (optionally as a reply to a message id), or to DISCORD_WEBHOOK_URL when no channel is given.',
  inputSchema: jsonSchema<{
    content: string;
    channel?: string;
    replyTo?: string;
    username?: string;
    embedTitle?: string;
    embedUrl?: string;
  }>({
    type: 'object',
    properties: {
      content: { type: 'string', description: 'Message text (Discord markdown, ≤ 2000 chars)' },
      channel: {
        type: 'string',
        description: 'Channel name or id; omit to use DISCORD_WEBHOOK_URL',
      },
      replyTo: { type: 'string', description: 'Message id to reply to (bot token only)' },
      username: { type: 'string', description: 'Display name override (webhook only)' },
      embedTitle: { type: 'string', description: 'Optional embed title' },
      embedUrl: { type: 'string', description: 'Optional embed URL' },
    },
    required: ['content'],
    additionalProperties: false,
  }),
  async execute({ content, channel, replyTo, username, embedTitle, embedUrl }) {
    if (content.length > 2000)
      throw new Error(`Message is ${content.length} chars; Discord allows 2000.`);
    const embeds = embedTitle || embedUrl ? [{ title: embedTitle, url: embedUrl }] : undefined;
    if (!channel) {
      const webhook = envValue('DISCORD_WEBHOOK_URL');
      if (!webhook)
        throw new Error('Pass `channel` (needs DISCORD_BOT_TOKEN) or set DISCORD_WEBHOOK_URL.');
      const res = await fetch(`${webhook}?wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, username, embeds }),
      });
      if (!res.ok)
        throw new Error(`Webhook post failed: ${res.status} ${await res.text().catch(() => '')}`);
      const m = (await res.json()) as RawMessage & { channel_id?: string };
      return { ok: true, via: 'webhook', messageId: m.id, channelId: m.channel_id ?? null };
    }
    const info = await resolveChannel(channel);
    const m = await api<RawMessage>('POST', `/channels/${info.id}/messages`, {
      content,
      embeds,
      message_reference: replyTo ? { message_id: replyTo } : undefined,
    });
    return {
      ok: true,
      via: 'bot',
      messageId: m.id,
      channel: info,
      url: `https://discord.com/channels/${info.guildId || '@me'}/${info.id}/${m.id}`,
    };
  },
});

export const discordReact = tool({
  description: 'Add an emoji reaction to a message in a channel.',
  inputSchema: jsonSchema<{ channel: string; messageId: string; emoji: string }>({
    type: 'object',
    properties: {
      channel: { type: 'string', description: 'Channel name or id' },
      messageId: { type: 'string' },
      emoji: { type: 'string', description: 'Unicode emoji (👍) or custom "name:id"' },
    },
    required: ['channel', 'messageId', 'emoji'],
    additionalProperties: false,
  }),
  async execute({ channel, messageId, emoji }) {
    const info = await resolveChannel(channel);
    await api<undefined>(
      'PUT',
      `/channels/${info.id}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`
    );
    return { ok: true, channel: info.name, messageId, emoji };
  },
});
