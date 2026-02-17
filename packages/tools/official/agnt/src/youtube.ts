/**
 * @tpmjs/official-agnt-youtube — YouTube API Tools for AI Agents
 *
 * Search videos, get video details, list channel videos, and retrieve
 * transcriptions from YouTube.
 *
 * @requires YOUTUBE_API_KEY environment variable
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error(
      'YOUTUBE_API_KEY environment variable is required. Get your API key from https://console.cloud.google.com/apis/credentials'
    );
  }
  return key;
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

async function youtubeRequest<T>(path: string, params: Record<string, unknown>): Promise<T> {
  const key = getApiKey();
  const allParams = { ...params, key };
  const qs = buildQueryString(allParams);

  const response = await fetch(`${BASE_URL}${path}${qs}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = (await response.json()) as {
        error?: { message?: string; errors?: { reason: string }[] };
      };
      errorMessage = errorData.error?.message || `HTTP ${response.status}`;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }

    switch (response.status) {
      case 400:
        throw new Error(`Bad request: ${errorMessage}`);
      case 401:
        throw new Error('Authentication failed: Invalid YouTube API key. Check YOUTUBE_API_KEY.');
      case 403:
        throw new Error(`Access forbidden or quota exceeded: ${errorMessage}`);
      case 404:
        throw new Error(`Resource not found: ${errorMessage}`);
      case 429:
        throw new Error(`Rate limit exceeded: ${errorMessage}`);
      default:
        throw new Error(`YouTube API error (${response.status}): ${errorMessage}`);
    }
  }

  return (await response.json()) as T;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractVideoId(input: string): string {
  const urlPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of urlPatterns) {
    const match = input.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return input;
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface SearchVideoItem {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
}

export interface SearchVideosResult {
  results: SearchVideoItem[];
  totalResults: number;
}

export interface VideoDetailsResult {
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  duration: string;
  thumbnailUrl: string;
}

export interface ChannelVideoItem {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
}

export interface ChannelVideosResult {
  results: ChannelVideoItem[];
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptResult {
  text: string;
  segments: TranscriptSegment[];
  language: string;
}

// ─── searchVideos ────────────────────────────────────────────────────────────

export interface SearchVideosInput {
  query: string;
  maxResults?: number;
}

export const searchVideos = tool({
  description:
    'Search for videos on YouTube by keyword or phrase. Returns video IDs, titles, and thumbnails.',
  inputSchema: jsonSchema<SearchVideosInput>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find videos.',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (1-50, default: 10).',
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute(input: SearchVideosInput): Promise<SearchVideosResult> {
    try {
      if (!input.query) {
        throw new Error('query is required and must be non-empty');
      }

      if (input.maxResults !== undefined && (input.maxResults < 1 || input.maxResults > 50)) {
        throw new Error('maxResults must be between 1 and 50');
      }

      const data = await youtubeRequest<{
        items: {
          id: { videoId: string };
          snippet: {
            title: string;
            description: string;
            channelTitle: string;
            publishedAt: string;
            thumbnails: { high?: { url: string }; default?: { url: string } };
          };
        }[];
        pageInfo: { totalResults: number };
      }>('/search', {
        part: 'snippet',
        type: 'video',
        q: input.query,
        maxResults: input.maxResults ?? 10,
      });

      return {
        results: data.items.map((item) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          thumbnailUrl:
            item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
        })),
        totalResults: data.pageInfo.totalResults,
      };
    } catch (error) {
      throw new Error(`Failed to search videos: ${(error as Error).message}`);
    }
  },
});

// ─── getVideoDetails ─────────────────────────────────────────────────────────

export interface GetVideoDetailsInput {
  videoId: string;
}

export const getVideoDetails = tool({
  description:
    'Get detailed information about a YouTube video including view count, likes, duration, and description. Accepts video IDs or full YouTube URLs.',
  inputSchema: jsonSchema<GetVideoDetailsInput>({
    type: 'object',
    properties: {
      videoId: {
        type: 'string',
        description:
          'The YouTube video ID or full URL (e.g. "dQw4w9WgXcQ" or "https://youtube.com/watch?v=dQw4w9WgXcQ").',
      },
    },
    required: ['videoId'],
    additionalProperties: false,
  }),
  async execute(input: GetVideoDetailsInput): Promise<VideoDetailsResult> {
    try {
      if (!input.videoId) {
        throw new Error('videoId is required and must be non-empty');
      }

      const videoId = extractVideoId(input.videoId);

      const data = await youtubeRequest<{
        items: {
          snippet: {
            title: string;
            description: string;
            channelTitle: string;
            publishedAt: string;
            thumbnails: { high?: { url: string }; default?: { url: string } };
          };
          statistics: {
            viewCount: string;
            likeCount: string;
            commentCount: string;
          };
          contentDetails: { duration: string };
        }[];
      }>('/videos', {
        part: 'snippet,statistics,contentDetails',
        id: videoId,
      });

      if (!data.items || data.items.length === 0) {
        throw new Error(`Video not found: ${videoId}`);
      }

      const video = data.items[0]!;

      return {
        title: video.snippet.title,
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        viewCount: video.statistics.viewCount || '0',
        likeCount: video.statistics.likeCount || '0',
        commentCount: video.statistics.commentCount || '0',
        duration: video.contentDetails.duration,
        thumbnailUrl:
          video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url || '',
      };
    } catch (error) {
      throw new Error(`Failed to get video details: ${(error as Error).message}`);
    }
  },
});

// ─── listChannelVideos ───────────────────────────────────────────────────────

export interface ListChannelVideosInput {
  channelId: string;
  maxResults?: number;
}

export const listChannelVideos = tool({
  description:
    'List recent videos from a YouTube channel, ordered by date. Returns video IDs and titles.',
  inputSchema: jsonSchema<ListChannelVideosInput>({
    type: 'object',
    properties: {
      channelId: {
        type: 'string',
        description: 'The YouTube channel ID (starts with "UC").',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (1-50, default: 10).',
      },
    },
    required: ['channelId'],
    additionalProperties: false,
  }),
  async execute(input: ListChannelVideosInput): Promise<ChannelVideosResult> {
    try {
      if (!input.channelId) {
        throw new Error('channelId is required and must be non-empty');
      }

      if (input.maxResults !== undefined && (input.maxResults < 1 || input.maxResults > 50)) {
        throw new Error('maxResults must be between 1 and 50');
      }

      const data = await youtubeRequest<{
        items: {
          id: { videoId: string };
          snippet: {
            title: string;
            description: string;
            publishedAt: string;
            thumbnails: { high?: { url: string }; default?: { url: string } };
          };
        }[];
      }>('/search', {
        part: 'snippet',
        channelId: input.channelId,
        type: 'video',
        order: 'date',
        maxResults: input.maxResults ?? 10,
      });

      return {
        results: data.items.map((item) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          thumbnailUrl:
            item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
        })),
      };
    } catch (error) {
      throw new Error(`Failed to list channel videos: ${(error as Error).message}`);
    }
  },
});

// ─── getTranscript ───────────────────────────────────────────────────────────

export interface GetTranscriptInput {
  videoId: string;
}

function parseTimedTextXml(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const textRegex = /<text\s+start="([^"]*)"(?:\s+dur="([^"]*)")?[^>]*>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null = textRegex.exec(xml);

  while (match !== null) {
    const start = parseFloat(match[1]!) || 0;
    const duration = parseFloat(match[2]!) || 0;
    const rawText = (match[3] || '')

      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/<[^>]+>/g, '')
      .replace(/\n/g, ' ')
      .trim();

    if (rawText) {
      segments.push({ text: rawText, start, duration });
    }
    match = textRegex.exec(xml);
  }

  return segments;
}

export const getTranscript = tool({
  description:
    'Get the transcript/captions of a YouTube video. Extracts auto-generated or manual captions with timestamps.',
  inputSchema: jsonSchema<GetTranscriptInput>({
    type: 'object',
    properties: {
      videoId: {
        type: 'string',
        description:
          'The YouTube video ID or full URL (e.g. "dQw4w9WgXcQ" or "https://youtube.com/watch?v=dQw4w9WgXcQ").',
      },
    },
    required: ['videoId'],
    additionalProperties: false,
  }),
  async execute(input: GetTranscriptInput): Promise<TranscriptResult> {
    try {
      if (!input.videoId) {
        throw new Error('videoId is required and must be non-empty');
      }

      const videoId = extractVideoId(input.videoId);

      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const pageResponse = await fetch(watchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!pageResponse.ok) {
        throw new Error(`Failed to fetch video page: HTTP ${pageResponse.status}`);
      }

      const pageHtml = await pageResponse.text();

      const playerResponseMatch = pageHtml.match(
        /ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;(?:\s*var\s|\s*<\/script>)/
      );

      if (!playerResponseMatch?.[1]) {
        throw new Error(
          'Could not find player response data. The video may be private, age-restricted, or unavailable.'
        );
      }

      let playerResponse: {
        captions?: {
          playerCaptionsTracklistRenderer?: {
            captionTracks?: {
              baseUrl: string;
              languageCode: string;
              kind?: string;
              name?: { simpleText?: string };
            }[];
          };
        };
      };

      try {
        playerResponse = JSON.parse(playerResponseMatch[1]);
      } catch {
        throw new Error('Failed to parse video player data');
      }

      const captionTracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;

      if (!captionTracks || captionTracks.length === 0) {
        throw new Error(
          'No captions available for this video. The video may not have subtitles enabled.'
        );
      }

      const englishTrack =
        captionTracks.find((t) => t.languageCode === 'en' && t.kind !== 'asr') ||
        captionTracks.find((t) => t.languageCode === 'en') ||
        captionTracks.find((t) => t.languageCode.startsWith('en')) ||
        captionTracks[0];

      if (!englishTrack) {
        throw new Error('No caption tracks available for this video');
      }

      const captionUrl = englishTrack.baseUrl;
      const captionResponse = await fetch(captionUrl);

      if (!captionResponse.ok) {
        throw new Error(`Failed to fetch caption data: HTTP ${captionResponse.status}`);
      }

      const captionXml = await captionResponse.text();
      const segments = parseTimedTextXml(captionXml);

      if (segments.length === 0) {
        throw new Error('Caption data was empty or could not be parsed');
      }

      const fullText = segments.map((s) => s.text).join(' ');

      return {
        text: fullText,
        segments,
        language: englishTrack.languageCode,
      };
    } catch (error) {
      throw new Error(`Failed to get transcript: ${(error as Error).message}`);
    }
  },
});
