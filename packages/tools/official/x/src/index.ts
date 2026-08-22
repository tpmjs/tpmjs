/**
 * @tpmjs/tools-x — post to X (Twitter) as yourself.
 *
 * OAuth 1.0a user-context signing (HMAC-SHA1 via WebCrypto, no dependencies) against the
 * X API v2 for tweets and the v1.1 media endpoint for image uploads. Works on the free
 * API tier for posting/deleting/whoami; mentions and search need the Basic tier and
 * return a clear error otherwise.
 *
 * @env X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET (TWITTER_* aliases accepted)
 */

import { jsonSchema, tool } from 'ai';

interface Creds {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

function envValue(...names: string[]): string | undefined {
  for (const name of names) {
    const value = globalThis.process?.env?.[name];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function creds(): Creds {
  const c = {
    apiKey: envValue('X_API_KEY', 'TWITTER_API_KEY'),
    apiSecret: envValue('X_API_SECRET', 'TWITTER_API_SECRET'),
    accessToken: envValue('X_ACCESS_TOKEN', 'TWITTER_ACCESS_TOKEN'),
    accessSecret: envValue('X_ACCESS_SECRET', 'TWITTER_ACCESS_SECRET'),
  };
  const missing = Object.entries(c)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `X credentials missing: ${missing.join(', ')} (X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET or their TWITTER_* aliases).`
    );
  }
  return c as Creds;
}

// ─── OAuth 1.0a ──────────────────────────────────────────────────────────────

const rfc3986 = (s: string): string =>
  encodeURIComponent(s).replace(
    /[!'()*]/g,
    (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`
  );

function nonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha1Base64(key: string, data: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/** Authorization header for a request whose body is JSON or multipart (body excluded from the base string). */
async function oauthHeader(
  method: string,
  url: string,
  query: Record<string, string> = {}
): Promise<string> {
  const c = creds();
  const oauth: Record<string, string> = {
    oauth_consumer_key: c.apiKey,
    oauth_nonce: nonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: c.accessToken,
    oauth_version: '1.0',
  };
  const params = { ...oauth, ...query };
  const paramString = Object.keys(params)
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(params[k] as string)}`)
    .join('&');
  const base = [method.toUpperCase(), rfc3986(url), rfc3986(paramString)].join('&');
  const signingKey = `${rfc3986(c.apiSecret)}&${rfc3986(c.accessSecret)}`;
  oauth.oauth_signature = await hmacSha1Base64(signingKey, base);
  return `OAuth ${Object.keys(oauth)
    .sort()
    .map((k) => `${rfc3986(k)}="${rfc3986(oauth[k] as string)}"`)
    .join(', ')}`;
}

async function xFetch<T>(
  method: string,
  url: string,
  options: { query?: Record<string, string>; json?: unknown; form?: FormData } = {}
): Promise<T> {
  const query = options.query ?? {};
  const qs = new URLSearchParams(query).toString();
  const headers: Record<string, string> = { Authorization: await oauthHeader(method, url, query) };
  let body: BodyInit | undefined;
  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  } else if (options.form) {
    body = options.form;
  }
  const res = await fetch(qs ? `${url}?${qs}` : url, { method, headers, body });
  const text = await res.text();
  if (!res.ok) {
    const hint =
      res.status === 402 || res.status === 403
        ? ' (this endpoint needs a paid X API tier, or the app lacks the right permission)'
        : res.status === 429
          ? ' (rate limited — wait and retry)'
          : '';
    throw new Error(
      `X ${method} ${url.replace('https://api.x.com/2', '')} failed: ${res.status}${hint}${text ? ` — ${text.slice(0, 300)}` : ''}`
    );
  }
  return (text ? JSON.parse(text) : {}) as T;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const V2 = 'https://api.x.com/2';

interface TweetData {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  public_metrics?: Record<string, number>;
  referenced_tweets?: Array<{ type: string; id: string }>;
}
interface UserData {
  id: string;
  username: string;
  name: string;
}

// Not memoised at module scope: the executor shares one module instance across callers.
async function whoami(): Promise<UserData> {
  const res = await xFetch<{ data: UserData }>('GET', `${V2}/users/me`);
  return res.data;
}

async function uploadMedia(url: string): Promise<string> {
  const download = await fetch(url);
  if (!download.ok) throw new Error(`Could not download media ${url}: ${download.status}`);
  const blob = await download.blob();
  if (blob.size > 5 * 1024 * 1024)
    throw new Error(`Media ${url} is ${Math.round(blob.size / 1024)} KB; images must be ≤ 5 MB.`);
  const form = new FormData();
  form.append('media', blob, 'upload');
  const res = await xFetch<{ media_id_string: string }>(
    'POST',
    'https://upload.twitter.com/1.1/media/upload.json',
    { form }
  );
  return res.media_id_string;
}

async function postTweet(
  text: string,
  options: { replyTo?: string; quoteTweetId?: string; mediaUrls?: string[] } = {}
): Promise<{ id: string; text: string; url: string }> {
  if (text.length > 280 && !options.mediaUrls) {
    // X counts weighted characters; 280 is the safe ceiling for plain text.
    throw new Error(`Tweet is ${text.length} chars; the limit is 280.`);
  }
  const mediaIds = options.mediaUrls?.length
    ? await Promise.all(options.mediaUrls.slice(0, 4).map(uploadMedia))
    : undefined;
  const body: Record<string, unknown> = { text };
  if (options.replyTo) body.reply = { in_reply_to_tweet_id: options.replyTo };
  if (options.quoteTweetId) body.quote_tweet_id = options.quoteTweetId;
  if (mediaIds) body.media = { media_ids: mediaIds };
  const res = await xFetch<{ data: { id: string; text: string } }>('POST', `${V2}/tweets`, {
    json: body,
  });
  const user = await whoami().catch(() => null);
  return {
    id: res.data.id,
    text: res.data.text,
    url: `https://x.com/${user?.username ?? 'i'}/status/${res.data.id}`,
  };
}

const TWEET_FIELDS = 'created_at,public_metrics,author_id,referenced_tweets,conversation_id';

// ─── tools ───────────────────────────────────────────────────────────────────

export const xWhoAmI = tool({
  description:
    'Show which X account the configured credentials belong to — use it to verify setup before posting.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<UserData & { url: string }> {
    const user = await whoami();
    return { ...user, url: `https://x.com/${user.username}` };
  },
});

export const tweet = tool({
  description:
    'Post a tweet, optionally as a reply or quote, with up to 4 images attached from URLs. Returns the tweet id and URL.',
  inputSchema: jsonSchema<{
    text: string;
    replyTo?: string;
    quoteTweetId?: string;
    mediaUrls?: string[];
  }>({
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Tweet text (≤ 280 characters)' },
      replyTo: { type: 'string', description: 'Tweet id to reply to' },
      quoteTweetId: { type: 'string', description: 'Tweet id to quote' },
      mediaUrls: {
        type: 'array',
        items: { type: 'string' },
        description: 'Up to 4 image URLs to attach (≤ 5 MB each)',
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute({ text, replyTo, quoteTweetId, mediaUrls }) {
    return postTweet(text, { replyTo, quoteTweetId, mediaUrls });
  },
});

export const tweetThread = tool({
  description:
    'Post a thread: each text becomes a reply to the previous tweet. Returns every tweet id and the thread URL.',
  inputSchema: jsonSchema<{ tweets: string[]; mediaUrls?: string[] }>({
    type: 'object',
    properties: {
      tweets: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        description: 'Tweet texts in order',
      },
      mediaUrls: {
        type: 'array',
        items: { type: 'string' },
        description: 'Images attached to the first tweet',
      },
    },
    required: ['tweets'],
    additionalProperties: false,
  }),
  async execute({ tweets, mediaUrls }) {
    const posted: Array<{ id: string; text: string; url: string }> = [];
    for (const [i, text] of tweets.entries()) {
      const prev = posted[posted.length - 1];
      posted.push(
        await postTweet(text, { replyTo: prev?.id, mediaUrls: i === 0 ? mediaUrls : undefined })
      );
    }
    return { count: posted.length, url: posted[0]?.url ?? null, tweets: posted };
  },
});

export const deleteTweet = tool({
  description: 'Delete one of your tweets by id.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute({ id }) {
    const res = await xFetch<{ data: { deleted: boolean } }>('DELETE', `${V2}/tweets/${id}`);
    return { id, deleted: res.data.deleted };
  },
});

export const getTweet = tool({
  description: 'Fetch a tweet by id with author, metrics and referenced tweets.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute({ id }) {
    const res = await xFetch<{ data: TweetData; includes?: { users?: UserData[] } }>(
      'GET',
      `${V2}/tweets/${id}`,
      {
        query: {
          'tweet.fields': TWEET_FIELDS,
          expansions: 'author_id',
          'user.fields': 'username,name',
        },
      }
    );
    const author = res.includes?.users?.[0];
    return {
      ...res.data,
      author: author ? { username: author.username, name: author.name } : null,
      url: `https://x.com/${author?.username ?? 'i'}/status/${res.data.id}`,
    };
  },
});

export const myMentions = tool({
  description:
    'Read recent tweets that mention the authenticated account (needs the Basic API tier).',
  inputSchema: jsonSchema<{ limit?: number }>({
    type: 'object',
    properties: { limit: { type: 'integer', description: '5–100 (default 20)', default: 20 } },
    additionalProperties: false,
  }),
  async execute({ limit = 20 }) {
    const user = await whoami();
    const res = await xFetch<{ data?: TweetData[]; includes?: { users?: UserData[] } }>(
      'GET',
      `${V2}/users/${user.id}/mentions`,
      {
        query: {
          max_results: String(Math.min(100, Math.max(5, limit))),
          'tweet.fields': TWEET_FIELDS,
          expansions: 'author_id',
          'user.fields': 'username,name',
        },
      }
    );
    const users = new Map((res.includes?.users ?? []).map((u) => [u.id, u]));
    return {
      mentions: (res.data ?? []).map((t) => ({
        ...t,
        author: users.get(t.author_id ?? '')?.username ?? null,
        url: `https://x.com/i/status/${t.id}`,
      })),
    };
  },
});

export const searchTweets = tool({
  description:
    'Search recent tweets (last 7 days) with the X search syntax, e.g. "from:user keyword -is:retweet" (needs the Basic API tier).',
  inputSchema: jsonSchema<{ query: string; limit?: number }>({
    type: 'object',
    properties: {
      query: { type: 'string' },
      limit: { type: 'integer', description: '10–100 (default 20)', default: 20 },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute({ query, limit = 20 }) {
    const res = await xFetch<{ data?: TweetData[]; includes?: { users?: UserData[] } }>(
      'GET',
      `${V2}/tweets/search/recent`,
      {
        query: {
          query,
          max_results: String(Math.min(100, Math.max(10, limit))),
          'tweet.fields': TWEET_FIELDS,
          expansions: 'author_id',
          'user.fields': 'username,name',
        },
      }
    );
    const users = new Map((res.includes?.users ?? []).map((u) => [u.id, u]));
    return {
      query,
      tweets: (res.data ?? []).map((t) => ({
        ...t,
        author: users.get(t.author_id ?? '')?.username ?? null,
        url: `https://x.com/i/status/${t.id}`,
      })),
    };
  },
});
