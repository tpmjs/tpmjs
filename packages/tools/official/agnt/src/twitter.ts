/**
 * @tpmjs/official-agnt-twitter — Twitter/X API Tools for AI Agents
 *
 * Post tweets, search tweets, and manage Twitter/X profiles.
 *
 * @requires TWITTER_BEARER_TOKEN for read operations
 * @requires TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET for write operations
 */

import { createHmac, randomBytes } from 'node:crypto';
import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://api.twitter.com/2';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getBearerToken(): string {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    throw new Error(
      'TWITTER_BEARER_TOKEN environment variable is required for read operations. Get your token from https://developer.twitter.com/en/portal/dashboard'
    );
  }
  return token;
}

function getOAuthCredentials(): {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
} {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error(
      'TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_SECRET environment variables are all required for write operations. Get your credentials from https://developer.twitter.com/en/portal/dashboard'
    );
  }

  return { apiKey, apiSecret, accessToken, accessSecret };
}

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  apiSecret: string,
  accessSecret: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key] as string)}`)
    .join('&');

  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(apiSecret)}&${percentEncode(accessSecret)}`;

  return createHmac('sha1', signingKey).update(baseString).digest('base64');
}

function buildOAuthHeader(
  method: string,
  url: string,
  credentials: ReturnType<typeof getOAuthCredentials>
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString('hex');

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: credentials.accessToken,
    oauth_version: '1.0',
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    credentials.apiSecret,
    credentials.accessSecret
  );

  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((key) => `${percentEncode(key)}="${percentEncode(oauthParams[key] as string)}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

async function twitterBearerRequest<T>(path: string): Promise<T> {
  const token = getBearerToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleTwitterError(response);
  }

  return (await response.json()) as T;
}

async function twitterOAuthRequest<T>(method: string, url: string, body?: unknown): Promise<T> {
  const credentials = getOAuthCredentials();
  const authHeader = buildOAuthHeader(method, url, credentials);

  const options: RequestInit = {
    method,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    await handleTwitterError(response);
  }

  return (await response.json()) as T;
}

async function handleTwitterError(response: Response): Promise<never> {
  let errorMessage: string;
  try {
    const errorData = (await response.json()) as {
      detail?: string;
      title?: string;
      errors?: { message: string }[];
    };
    errorMessage =
      errorData.detail ||
      errorData.title ||
      errorData.errors?.[0]?.message ||
      `HTTP ${response.status}`;
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  switch (response.status) {
    case 400:
      throw new Error(`Bad request: ${errorMessage}`);
    case 401:
      throw new Error(
        'Authentication failed: Invalid Twitter credentials. Check your API keys and tokens.'
      );
    case 403:
      throw new Error(`Access forbidden: ${errorMessage}`);
    case 404:
      throw new Error(`Not found: ${errorMessage}`);
    case 429:
      throw new Error(`Rate limit exceeded: ${errorMessage}`);
    default:
      throw new Error(`Twitter API error (${response.status}): ${errorMessage}`);
  }
}

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
  );
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface PostTweetResult {
  tweetId: string;
  text: string;
  url: string;
}

export interface SearchTweetItem {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
}

export interface SearchTweetsResult {
  tweets: SearchTweetItem[];
  resultCount: number;
}

export interface UserProfileResult {
  id: string;
  name: string;
  username: string;
  description: string;
  followers: number;
  following: number;
  tweetCount: number;
  profileImageUrl: string;
}

export interface UserTweetItem {
  id: string;
  text: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
}

export interface UserTweetsResult {
  tweets: UserTweetItem[];
}

// ─── postTweet ───────────────────────────────────────────────────────────────

export interface PostTweetInput {
  text: string;
  replyToId?: string;
}

export const postTweet = tool({
  description:
    'Post a new tweet to Twitter/X. Supports plain text tweets and replies to existing tweets.',
  inputSchema: jsonSchema<PostTweetInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text content of the tweet (max 280 characters).',
      },
      replyToId: {
        type: 'string',
        description: 'The ID of an existing tweet to reply to.',
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute(input: PostTweetInput): Promise<PostTweetResult> {
    try {
      if (!input.text) {
        throw new Error('text is required and must be non-empty');
      }
      if (input.text.length > 280) {
        throw new Error('Tweet text must be 280 characters or less');
      }

      const body: Record<string, unknown> = { text: input.text };
      if (input.replyToId) {
        body.reply = { in_reply_to_tweet_id: input.replyToId };
      }

      const url = `${BASE_URL}/tweets`;
      const data = await twitterOAuthRequest<{
        data: { id: string; text: string };
      }>('POST', url, body);

      return {
        tweetId: data.data.id,
        text: data.data.text,
        url: `https://twitter.com/i/web/status/${data.data.id}`,
      };
    } catch (error) {
      throw new Error(`Failed to post tweet: ${(error as Error).message}`);
    }
  },
});

// ─── searchTweets ────────────────────────────────────────────────────────────

export interface SearchTweetsInput {
  query: string;
  maxResults?: number;
  sortOrder?: string;
}

export const searchTweets = tool({
  description:
    'Search for recent tweets on Twitter/X matching a query. Returns tweets from the last 7 days.',
  inputSchema: jsonSchema<SearchTweetsInput>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query string. Supports Twitter search operators.',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (10-100, default: 10).',
      },
      sortOrder: {
        type: 'string',
        description: 'Sort order: "recency" (newest first) or "relevancy" (most relevant first).',
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute(input: SearchTweetsInput): Promise<SearchTweetsResult> {
    try {
      if (!input.query) {
        throw new Error('query is required and must be non-empty');
      }

      if (input.maxResults !== undefined && (input.maxResults < 10 || input.maxResults > 100)) {
        throw new Error('maxResults must be between 10 and 100');
      }

      if (
        input.sortOrder !== undefined &&
        input.sortOrder !== 'recency' &&
        input.sortOrder !== 'relevancy'
      ) {
        throw new Error('sortOrder must be either "recency" or "relevancy"');
      }

      const qs = buildQueryString({
        query: input.query,
        max_results: input.maxResults ?? 10,
        sort_order: input.sortOrder,
        'tweet.fields': 'created_at,author_id',
      });

      const data = await twitterBearerRequest<{
        data?: { id: string; text: string; author_id: string; created_at: string }[];
        meta: { result_count: number };
      }>(`/tweets/search/recent${qs}`);

      return {
        tweets: (data.data || []).map((tweet) => ({
          id: tweet.id,
          text: tweet.text,
          authorId: tweet.author_id,
          createdAt: tweet.created_at,
        })),
        resultCount: data.meta.result_count,
      };
    } catch (error) {
      throw new Error(`Failed to search tweets: ${(error as Error).message}`);
    }
  },
});

// ─── getUserProfile ──────────────────────────────────────────────────────────

export interface GetUserProfileInput {
  username: string;
}

export const getUserProfile = tool({
  description: 'Get a Twitter/X user profile including bio, follower counts, and profile image.',
  inputSchema: jsonSchema<GetUserProfileInput>({
    type: 'object',
    properties: {
      username: {
        type: 'string',
        description: 'The Twitter/X username (without the @ symbol).',
      },
    },
    required: ['username'],
    additionalProperties: false,
  }),
  async execute(input: GetUserProfileInput): Promise<UserProfileResult> {
    try {
      if (!input.username) {
        throw new Error('username is required and must be non-empty');
      }

      const username = input.username.replace(/^@/, '');
      const qs = buildQueryString({
        'user.fields': 'description,public_metrics,profile_image_url,created_at',
      });

      const data = await twitterBearerRequest<{
        data: {
          id: string;
          name: string;
          username: string;
          description: string;
          public_metrics: {
            followers_count: number;
            following_count: number;
            tweet_count: number;
          };
          profile_image_url: string;
        };
      }>(`/users/by/username/${username}${qs}`);

      return {
        id: data.data.id,
        name: data.data.name,
        username: data.data.username,
        description: data.data.description || '',
        followers: data.data.public_metrics.followers_count,
        following: data.data.public_metrics.following_count,
        tweetCount: data.data.public_metrics.tweet_count,
        profileImageUrl: data.data.profile_image_url || '',
      };
    } catch (error) {
      throw new Error(`Failed to get user profile: ${(error as Error).message}`);
    }
  },
});

// ─── getUserTweets ───────────────────────────────────────────────────────────

export interface GetUserTweetsInput {
  userId: string;
  maxResults?: number;
}

export const getUserTweets = tool({
  description:
    'Get recent tweets from a Twitter/X user by their user ID. Includes engagement metrics.',
  inputSchema: jsonSchema<GetUserTweetsInput>({
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description:
          'The Twitter/X user ID (numeric). Use getUserProfile to find user IDs from usernames.',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of tweets to return (5-100, default: 10).',
      },
    },
    required: ['userId'],
    additionalProperties: false,
  }),
  async execute(input: GetUserTweetsInput): Promise<UserTweetsResult> {
    try {
      if (!input.userId) {
        throw new Error('userId is required and must be non-empty');
      }

      if (input.maxResults !== undefined && (input.maxResults < 5 || input.maxResults > 100)) {
        throw new Error('maxResults must be between 5 and 100');
      }

      const qs = buildQueryString({
        max_results: input.maxResults ?? 10,
        'tweet.fields': 'created_at,public_metrics',
      });

      const data = await twitterBearerRequest<{
        data?: {
          id: string;
          text: string;
          created_at: string;
          public_metrics: {
            like_count: number;
            retweet_count: number;
            reply_count: number;
          };
        }[];
      }>(`/users/${input.userId}/tweets${qs}`);

      return {
        tweets: (data.data || []).map((tweet) => ({
          id: tweet.id,
          text: tweet.text,
          createdAt: tweet.created_at,
          likes: tweet.public_metrics.like_count,
          retweets: tweet.public_metrics.retweet_count,
          replies: tweet.public_metrics.reply_count,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get user tweets: ${(error as Error).message}`);
    }
  },
});
