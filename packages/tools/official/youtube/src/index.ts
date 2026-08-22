/**
 * @tpmjs/tools-youtube — upload and manage videos on your own YouTube channel.
 *
 * YouTube Data API v3 with headless OAuth (a refresh token minted once from your Google
 * account). No dependencies beyond `ai`. Uploads use the resumable protocol in 8 MiB chunks
 * streamed straight from a URL, and can be continued across calls: when a call's time
 * budget runs out it returns the upload session so the next call picks up where it left off.
 *
 * @env YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
 *      (or a short-lived YOUTUBE_ACCESS_TOKEN if you manage tokens yourself)
 */

import { jsonSchema, tool } from 'ai';

const API = 'https://www.googleapis.com/youtube/v3';
const UPLOAD = 'https://www.googleapis.com/upload/youtube/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const DEFAULT_REDIRECT = 'http://localhost:8765/callback';
const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.force-ssl',
];
/** Resumable chunk size — must be a multiple of 256 KiB. */
export const CHUNK_BYTES = 8 * 1024 * 1024;
const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024;
const DEFAULT_BUDGET_SECONDS = 75;
const MAX_BUDGET_SECONDS = 280;

// ─── env + auth ──────────────────────────────────────────────────────────────

function envValue(...names: string[]): string | undefined {
  for (const name of names) {
    const value = globalThis.process?.env?.[name];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function clientCreds(): { clientId: string; clientSecret: string } {
  const clientId = envValue('YOUTUBE_CLIENT_ID', 'GOOGLE_CLIENT_ID');
  const clientSecret = envValue('YOUTUBE_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error(
      'YouTube OAuth client missing: set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET (a "Desktop app" OAuth client from console.cloud.google.com with the YouTube Data API v3 enabled).'
    );
  }
  return { clientId, clientSecret };
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
}

async function postToken(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const text = await res.text();
  let data: TokenResponse = {};
  try {
    data = text ? (JSON.parse(text) as TokenResponse) : {};
  } catch {
    data = { error: 'invalid_response', error_description: text.slice(0, 200) };
  }
  if (!res.ok) {
    const hint =
      data.error === 'invalid_grant'
        ? ' (the refresh token was revoked or expired — if the OAuth consent screen is still in "Testing", tokens die after 7 days; publish the app, then re-run youtubeAuthUrl / youtubeExchangeCode)'
        : '';
    throw new Error(
      `YouTube OAuth token request failed: ${res.status} ${data.error ?? ''}${data.error_description ? `: ${data.error_description}` : ''}${hint}`
    );
  }
  return data;
}

/** A fresh access token per call — nothing is cached at module level (tools share one process). */
async function accessToken(): Promise<string> {
  const direct = envValue('YOUTUBE_ACCESS_TOKEN');
  if (direct) return direct;
  const refreshToken = envValue('YOUTUBE_REFRESH_TOKEN');
  if (!refreshToken) {
    throw new Error(
      'YouTube credentials missing: set YOUTUBE_REFRESH_TOKEN (mint it once with youtubeAuthUrl → youtubeExchangeCode) alongside YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET, or pass a short-lived YOUTUBE_ACCESS_TOKEN.'
    );
  }
  const { clientId, clientSecret } = clientCreds();
  const data = await postToken({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  if (!data.access_token) throw new Error('YouTube OAuth refresh returned no access_token.');
  return data.access_token;
}

// ─── API client ──────────────────────────────────────────────────────────────

interface GoogleError {
  error?: {
    code?: number;
    message?: string;
    errors?: Array<{ reason?: string; message?: string; domain?: string }>;
  };
}

function describeFailure(method: string, url: string, status: number, text: string): Error {
  let reason = '';
  let message = text.slice(0, 300);
  try {
    const parsed = JSON.parse(text) as GoogleError;
    reason = parsed.error?.errors?.[0]?.reason ?? '';
    message = parsed.error?.message ?? message;
  } catch {
    // non-JSON body — keep the raw excerpt
  }
  let hint = '';
  if (status === 401)
    hint = ' (access token rejected — refresh token revoked/expired or wrong client)';
  else if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded')
    hint =
      ' (YouTube Data API daily quota exhausted — uploads cost 1,600 of the default 10,000 units/day; resets at midnight Pacific)';
  else if (reason === 'insufficientPermissions' || reason === 'forbidden')
    hint =
      ' (the OAuth grant lacks the needed scope, or the channel cannot do this — e.g. custom thumbnails need a phone-verified channel)';
  else if (reason === 'uploadLimitExceeded')
    hint = ' (the channel hit its upload limit for the day)';
  else if (status === 429) hint = ' (rate limited — wait and retry)';
  const path = url.replace(API, '').replace(UPLOAD, '/upload').split('?')[0];
  return new Error(
    `YouTube ${method} ${path} failed: ${status}${reason ? ` ${reason}` : ''}${hint}${message ? ` — ${message}` : ''}`
  );
}

interface FetchOptions {
  query?: Record<string, string | number | boolean | undefined>;
  json?: unknown;
  body?: BodyInit;
  headers?: Record<string, string>;
}

function withQuery(url: string, query: FetchOptions['query']): string {
  if (!query) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined) qs.set(k, String(v));
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

async function ytFetch<T>(method: string, url: string, options: FetchOptions = {}): Promise<T> {
  const token = await accessToken();
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, ...options.headers };
  let body: BodyInit | undefined = options.body;
  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  }
  const res = await fetch(withQuery(url, options.query), { method, headers, body });
  const text = await res.text();
  if (!res.ok) throw describeFailure(method, url, res.status, text);
  return (text ? JSON.parse(text) : {}) as T;
}

// ─── shapes ──────────────────────────────────────────────────────────────────

interface VideoResource {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
    publishedAt?: string;
    defaultLanguage?: string;
    thumbnails?: Record<string, { url?: string }>;
  };
  status?: {
    uploadStatus?: string;
    privacyStatus?: string;
    publishAt?: string;
    selfDeclaredMadeForKids?: boolean;
    failureReason?: string;
    rejectionReason?: string;
    embeddable?: boolean;
    license?: string;
  };
  processingDetails?: {
    processingStatus?: string;
    processingProgress?: { partsTotal?: string; partsProcessed?: string; timeLeftMs?: string };
    processingFailureReason?: string;
  };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  contentDetails?: { duration?: string; definition?: string };
}

interface ListResponse<T> {
  items?: T[];
  nextPageToken?: string;
  pageInfo?: { totalResults?: number };
}

interface ChannelResource {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    customUrl?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url?: string }>;
  };
  statistics?: { subscriberCount?: string; videoCount?: string; viewCount?: string };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
}

const videoUrl = (id: string): string => `https://www.youtube.com/watch?v=${id}`;
const num = (v: string | undefined): number | undefined =>
  v === undefined ? undefined : Number(v);

function summarizeVideo(v: VideoResource): Record<string, unknown> {
  return {
    videoId: v.id,
    url: videoUrl(v.id),
    title: v.snippet?.title,
    publishedAt: v.snippet?.publishedAt,
    privacy: v.status?.privacyStatus,
    publishAt: v.status?.publishAt,
    uploadStatus: v.status?.uploadStatus,
    processingStatus: v.processingDetails?.processingStatus,
    failureReason: v.status?.failureReason ?? v.processingDetails?.processingFailureReason,
    rejectionReason: v.status?.rejectionReason,
    duration: v.contentDetails?.duration,
    views: num(v.statistics?.viewCount),
    likes: num(v.statistics?.likeCount),
    comments: num(v.statistics?.commentCount),
    tags: v.snippet?.tags,
    categoryId: v.snippet?.categoryId,
    thumbnail: v.snippet?.thumbnails?.high?.url ?? v.snippet?.thumbnails?.default?.url,
  };
}

async function myChannelResource(): Promise<ChannelResource> {
  const data = await ytFetch<ListResponse<ChannelResource>>('GET', `${API}/channels`, {
    query: { part: 'snippet,statistics,contentDetails', mine: true },
  });
  const channel = data.items?.[0];
  if (!channel)
    throw new Error(
      'No YouTube channel found for this Google account (create one at youtube.com first, or authorise the account that owns the channel).'
    );
  return channel;
}

// ─── resumable upload machinery ──────────────────────────────────────────────

type Bytes = Uint8Array<ArrayBuffer>;

interface Source {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  /** Total size of the whole file when the server told us. */
  totalBytes?: number;
}

const VIDEO_LIKE_TYPES = new Set([
  'application/octet-stream',
  'binary/octet-stream',
  'application/mp4',
  'application/x-matroska',
]);

function mediaType(res: Response, fallback: string): string {
  const raw = res.headers.get('content-type') ?? fallback;
  return (raw.split(';')[0] ?? raw).trim().toLowerCase();
}

/** Drop the first `count` bytes of a stream (used when a source ignores Range on resume). */
function skipBytes(stream: ReadableStream<Uint8Array>, count: number): ReadableStream<Uint8Array> {
  let remaining = count;
  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (remaining === 0) {
          controller.enqueue(chunk);
          return;
        }
        if (chunk.length <= remaining) {
          remaining -= chunk.length;
          return;
        }
        controller.enqueue(chunk.subarray(remaining));
        remaining = 0;
      },
    })
  );
}

/** Work out the file's total size and how many bytes of this response to discard. */
function sourceLayout(res: Response, offset: number): { totalBytes?: number; skip: number } {
  if (offset > 0 && res.status === 206) {
    const match = /bytes \d+-\d+\/(\d+|\*)/.exec(res.headers.get('content-range') ?? '');
    const total = match?.[1];
    return { totalBytes: total && total !== '*' ? Number(total) : undefined, skip: 0 };
  }
  const length = res.headers.get('content-length');
  return { totalBytes: length ? Number(length) : undefined, skip: offset };
}

async function openSource(url: string, offset: number): Promise<Source> {
  const headers: Record<string, string> = offset > 0 ? { Range: `bytes=${offset}-` } : {};
  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Could not fetch the video from ${url}: ${res.status} ${res.statusText}`);
  }
  if (!res.body) throw new Error(`The video URL ${url} returned no body.`);
  const contentType = mediaType(res, 'application/octet-stream');
  if (!contentType.startsWith('video/') && !VIDEO_LIKE_TYPES.has(contentType)) {
    throw new Error(
      `The URL does not look like a video file (content-type ${contentType}). Point videoUrl at the media file itself, not a page about it.`
    );
  }
  const { totalBytes, skip } = sourceLayout(res, offset);
  const stream: ReadableStream<Uint8Array> = skip > 0 ? skipBytes(res.body, skip) : res.body;
  return { stream, contentType, totalBytes };
}

interface Chunk {
  bytes: Bytes;
  last: boolean;
}

function concat(parts: Uint8Array[], total: number): Bytes {
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** Copy exactly `size` bytes out of `parts`; return the remainder untouched. */
function takeExact(parts: Uint8Array[], size: number): { out: Bytes; rest: Uint8Array[] } {
  const out = new Uint8Array(size);
  const rest: Uint8Array[] = [];
  let filled = 0;
  for (const p of parts) {
    if (filled === size) {
      rest.push(p);
      continue;
    }
    const take = Math.min(p.length, size - filled);
    out.set(p.subarray(0, take), filled);
    filled += take;
    if (take < p.length) rest.push(p.subarray(take));
  }
  return { out, rest };
}

/** Read until more than `size` bytes are buffered (so a final chunk is never empty) or the stream ends. */
async function fillBuffer(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  parts: Uint8Array[],
  have: number,
  size: number
): Promise<{ have: number; ended: boolean }> {
  let buffered = have;
  while (buffered <= size) {
    const { value, done } = await reader.read();
    if (done) return { have: buffered, ended: true };
    if (value?.length) {
      parts.push(value);
      buffered += value.length;
    }
  }
  return { have: buffered, ended: false };
}

/**
 * Yield fixed-size chunks; the final chunk is always flagged `last` and, for any non-empty
 * source, non-empty — so the upload can close the session with an exact total even when the
 * source size was unknown. Leaving the loop early cancels the source.
 */
export async function* chunkStream(
  stream: ReadableStream<Uint8Array>,
  size: number
): AsyncGenerator<Chunk> {
  const reader = stream.getReader();
  let parts: Uint8Array[] = [];
  let have = 0;
  let ended = false;
  try {
    while (true) {
      if (!ended) {
        const filled = await fillBuffer(reader, parts, have, size);
        have = filled.have;
        ended = filled.ended;
      }
      if (have > size) {
        const { out, rest } = takeExact(parts, size);
        parts = rest;
        have -= size;
        yield { bytes: out, last: false };
      } else {
        yield { bytes: concat(parts, have), last: true };
        return;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

class RetryableUploadError extends Error {}

type PutResult = { kind: 'continue'; uploaded: number } | { kind: 'done'; video: VideoResource };

function uploadedFromRange(res: Response, fallback: number): number {
  const range = res.headers.get('range') ?? res.headers.get('Range');
  const match = /bytes=\d+-(\d+)/.exec(range ?? '');
  return match?.[1] ? Number(match[1]) + 1 : fallback;
}

async function putChunk(
  sessionUri: string,
  token: string,
  bytes: Bytes,
  start: number,
  total: number | undefined,
  last: boolean
): Promise<PutResult> {
  const end = start + bytes.length - 1;
  const totalLabel = last ? String(end + 1) : total !== undefined ? String(total) : '*';
  if (last && total !== undefined && end + 1 !== total) {
    throw new Error(
      `Video source changed size mid-upload (expected ${total} bytes, got ${end + 1}). Start a new upload.`
    );
  }
  const res = await fetch(sessionUri, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${totalLabel}`,
    },
    body: bytes,
  });
  if (res.status === 308) return { kind: 'continue', uploaded: uploadedFromRange(res, end + 1) };
  const text = await res.text();
  if (res.ok) return { kind: 'done', video: JSON.parse(text) as VideoResource };
  if (res.status >= 500 || res.status === 429 || res.status === 408) {
    throw new RetryableUploadError(
      `YouTube upload chunk failed: ${res.status} ${text.slice(0, 200)}`
    );
  }
  throw describeFailure('PUT', `${UPLOAD}/videos`, res.status, text);
}

/** Ask the session how much it has; 308 = partial (Range header), 2xx = already finished. */
async function sessionStatus(
  sessionUri: string,
  token: string,
  total: number | undefined
): Promise<PutResult> {
  const res = await fetch(sessionUri, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Range': `bytes */${total ?? '*'}` },
  });
  if (res.status === 308) return { kind: 'continue', uploaded: uploadedFromRange(res, 0) };
  const text = await res.text();
  if (res.ok) return { kind: 'done', video: JSON.parse(text) as VideoResource };
  if (res.status === 404 || res.status === 410) {
    throw new Error(
      'The upload session expired or was not found — start a new upload without sessionUri.'
    );
  }
  throw describeFailure('PUT', `${UPLOAD}/videos`, res.status, text);
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** After a transient failure, work out what is still owed from the offset YouTube confirms. */
function remainderAfter(
  status: PutResult,
  pending: Bytes,
  at: number
): { pending: Bytes; at: number } {
  if (status.kind === 'done')
    return { pending: pending.subarray(pending.length), at: at + pending.length };
  const already = status.uploaded - at;
  if (already < 0 || already > pending.length) {
    throw new Error(
      `Upload session offset ${status.uploaded} is outside the chunk being sent (${at}-${at + pending.length - 1}); start a new upload.`
    );
  }
  return { pending: pending.subarray(already), at: status.uploaded };
}

/** Send one chunk, retrying transient failures from the offset YouTube confirms it kept. */
async function sendChunk(
  sessionUri: string,
  token: string,
  chunk: Chunk,
  start: number,
  total: number | undefined
): Promise<PutResult> {
  let pending: Bytes = chunk.bytes;
  let at = start;
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await putChunk(sessionUri, token, pending, at, total, chunk.last);
    } catch (error) {
      if (!(error instanceof RetryableUploadError) || attempt > 3) throw error;
      await sleep(500 * 2 ** attempt);
      const status = await sessionStatus(sessionUri, token, total);
      if (status.kind === 'done') return status;
      ({ pending, at } = remainderAfter(status, pending, at));
      if (pending.length === 0) return { kind: 'continue', uploaded: at };
    }
  }
}

interface PumpOutcome {
  done: boolean;
  uploaded: number;
  total?: number;
  video?: VideoResource;
  chunksSent: number;
}

/** Send chunks until the stream ends or the time budget is spent (always sends at least one). */
async function pumpChunks(
  sessionUri: string,
  token: string,
  source: Source,
  startOffset: number,
  deadline: number
): Promise<PumpOutcome> {
  let uploaded = startOffset;
  let chunksSent = 0;
  let lastChunkMs = 0;
  for await (const chunk of chunkStream(source.stream, CHUNK_BYTES)) {
    if (chunk.bytes.length === 0) throw new Error('The video file is empty (0 bytes).');
    if (chunksSent > 0 && Date.now() + lastChunkMs > deadline) {
      return { done: false, uploaded, total: source.totalBytes, chunksSent };
    }
    const began = Date.now();
    const result = await sendChunk(sessionUri, token, chunk, uploaded, source.totalBytes);
    chunksSent += 1;
    if (result.kind === 'done') {
      return {
        done: true,
        uploaded: uploaded + chunk.bytes.length,
        total: source.totalBytes,
        video: result.video,
        chunksSent,
      };
    }
    uploaded = result.uploaded;
    lastChunkMs = Date.now() - began;
  }
  throw new Error(
    'Upload stream ended before YouTube acknowledged completion; call again with the same sessionUri to resume.'
  );
}

interface UploadMeta {
  title: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  language?: string;
  privacy: 'private' | 'unlisted' | 'public';
  publishAt?: string;
  madeForKids: boolean;
  notifySubscribers: boolean;
}

async function startSession(meta: UploadMeta, source: Source, token: string): Promise<string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Upload-Content-Type': source.contentType,
  };
  if (source.totalBytes !== undefined)
    headers['X-Upload-Content-Length'] = String(source.totalBytes);
  const body = {
    snippet: {
      title: meta.title,
      description: meta.description ?? '',
      tags: meta.tags,
      categoryId: meta.categoryId,
      defaultLanguage: meta.language,
    },
    status: {
      privacyStatus: meta.privacy,
      publishAt: meta.publishAt,
      selfDeclaredMadeForKids: meta.madeForKids,
    },
  };
  const url = withQuery(`${UPLOAD}/videos`, {
    uploadType: 'resumable',
    part: 'snippet,status',
    notifySubscribers: meta.notifySubscribers,
  });
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw describeFailure('POST', `${UPLOAD}/videos`, res.status, await res.text());
  const location = res.headers.get('location') ?? res.headers.get('Location');
  if (!location) throw new Error('YouTube did not return an upload session (no Location header).');
  return location;
}

// ─── tools ───────────────────────────────────────────────────────────────────

export const youtubeAuthUrl = tool({
  description:
    'One-time setup, step 1: build the Google consent URL that authorises this OAuth client to manage your YouTube channel. Open it in a browser as the channel owner, approve, then pass the `code` from the redirect URL to youtubeExchangeCode.',
  inputSchema: jsonSchema<{ redirectUri?: string; scopes?: string[] }>({
    type: 'object',
    properties: {
      redirectUri: {
        type: 'string',
        description: `Redirect URI — a "Desktop app" OAuth client accepts any http://localhost URI (default ${DEFAULT_REDIRECT})`,
      },
      scopes: {
        type: 'array',
        items: { type: 'string' },
        description:
          'OAuth scopes to request (default: youtube.upload + youtube.force-ssl, which cover every tool here)',
      },
    },
  }),
  execute: async ({ redirectUri, scopes }) => {
    const { clientId } = clientCreds();
    const redirect = redirectUri ?? DEFAULT_REDIRECT;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirect,
      response_type: 'code',
      scope: (scopes?.length ? scopes : DEFAULT_SCOPES).join(' '),
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
    });
    return {
      url: `${AUTH_URL}?${params.toString()}`,
      redirectUri: redirect,
      instructions: `Open the URL signed in as the Google account that owns the channel and approve. The browser is then sent to ${redirect} — the page may say it cannot be reached; that is fine. Copy the "code" query parameter from the address bar and call youtubeExchangeCode with it (within a few minutes).`,
    };
  },
});

export const youtubeExchangeCode = tool({
  description:
    'One-time setup, step 2: exchange the consent code from youtubeAuthUrl for a long-lived refresh token. Store the returned refreshToken as the YOUTUBE_REFRESH_TOKEN environment variable (collection env var on tpmjs) — treat it like a password and do not save it into memory or notes.',
  inputSchema: jsonSchema<{ code: string; redirectUri?: string }>({
    type: 'object',
    properties: {
      code: { type: 'string', description: 'The "code" parameter from the redirect URL' },
      redirectUri: {
        type: 'string',
        description: `Must match the redirectUri used for youtubeAuthUrl (default ${DEFAULT_REDIRECT})`,
      },
    },
    required: ['code'],
  }),
  execute: async ({ code, redirectUri }) => {
    const { clientId, clientSecret } = clientCreds();
    const data = await postToken({
      client_id: clientId,
      client_secret: clientSecret,
      code: code.trim(),
      redirect_uri: redirectUri ?? DEFAULT_REDIRECT,
      grant_type: 'authorization_code',
    });
    if (!data.refresh_token) {
      throw new Error(
        'Google returned no refresh_token. Revoke the app at https://myaccount.google.com/permissions and run youtubeAuthUrl again (it must be requested with access_type=offline and prompt=consent).'
      );
    }
    return {
      refreshToken: data.refresh_token,
      scope: data.scope,
      accessTokenExpiresIn: data.expires_in,
      instructions:
        'Set YOUTUBE_REFRESH_TOKEN to refreshToken (plus YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET) wherever these tools run. If the OAuth consent screen is in "Testing" the token expires after 7 days — publish the app to make it permanent.',
    };
  },
});

export const myChannel = tool({
  description:
    'Show the YouTube channel these credentials control: id, title, handle, subscriber/video/view counts and the uploads playlist.',
  inputSchema: jsonSchema<Record<string, never>>({ type: 'object', properties: {} }),
  execute: async () => {
    const c = await myChannelResource();
    return {
      channelId: c.id,
      title: c.snippet?.title,
      handle: c.snippet?.customUrl,
      url: c.snippet?.customUrl
        ? `https://www.youtube.com/${c.snippet.customUrl}`
        : `https://www.youtube.com/channel/${c.id}`,
      description: c.snippet?.description,
      createdAt: c.snippet?.publishedAt,
      subscribers: num(c.statistics?.subscriberCount),
      videos: num(c.statistics?.videoCount),
      views: num(c.statistics?.viewCount),
      uploadsPlaylistId: c.contentDetails?.relatedPlaylists?.uploads,
      thumbnail: c.snippet?.thumbnails?.high?.url ?? c.snippet?.thumbnails?.default?.url,
    };
  },
});

interface UploadInput {
  videoUrl: string;
  title?: string;
  description?: string;
  tags?: string[];
  privacy?: 'private' | 'unlisted' | 'public';
  categoryId?: string;
  madeForKids?: boolean;
  publishAt?: string;
  language?: string;
  notifySubscribers?: boolean;
  playlistId?: string;
  thumbnailUrl?: string;
  sessionUri?: string;
  maxSeconds?: number;
}

async function finishUpload(
  video: VideoResource,
  input: UploadInput,
  requestedPrivacy: string
): Promise<Record<string, unknown>> {
  const extras: Record<string, unknown> = {};
  if (input.playlistId) {
    try {
      await addVideoToPlaylist(input.playlistId, video.id);
      extras.addedToPlaylist = input.playlistId;
    } catch (error) {
      extras.playlistError = (error as Error).message;
    }
  }
  if (input.thumbnailUrl) {
    try {
      await uploadThumbnail(video.id, input.thumbnailUrl);
      extras.thumbnailSet = true;
    } catch (error) {
      extras.thumbnailError = (error as Error).message;
    }
  }
  const privacy = video.status?.privacyStatus;
  const notes: string[] = [
    'YouTube processes the file after upload — poll videoStatus until processingStatus is "succeeded".',
  ];
  if (privacy && privacy !== requestedPrivacy) {
    notes.push(
      `Requested privacy "${requestedPrivacy}" but YouTube set "${privacy}": uploads from an API project that has not passed the YouTube API Services compliance audit are locked to private. Flip it in YouTube Studio, or complete the audit for the project.`
    );
  }
  return { status: 'uploaded', ...summarizeVideo(video), ...extras, notes };
}

export const uploadVideo = tool({
  description:
    'Upload a video to your channel from a URL (the media file itself). Streams it to YouTube in resumable 8 MiB chunks. Long files are continued across calls: if the result says status "in_progress", call again with the same videoUrl plus the returned sessionUri until it says "uploaded". Optionally adds the video to a playlist and sets a custom thumbnail.',
  inputSchema: jsonSchema<UploadInput>({
    type: 'object',
    properties: {
      videoUrl: {
        type: 'string',
        description: 'Direct http(s) URL of the video file (mp4, mov, webm, mkv…)',
      },
      title: {
        type: 'string',
        maxLength: 100,
        description: 'Video title (required for a new upload; ignored on resume)',
      },
      description: { type: 'string', maxLength: 5000 },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Keywords; total length under ~500 characters',
      },
      privacy: {
        type: 'string',
        enum: ['private', 'unlisted', 'public'],
        default: 'private',
        description:
          'Visibility (default private — note that un-audited API projects are forced to private anyway)',
      },
      categoryId: {
        type: 'string',
        description:
          'YouTube category id (see videoCategories; e.g. 22 People & Blogs, 28 Science & Technology, 27 Education, 10 Music)',
      },
      madeForKids: { type: 'boolean', default: false, description: 'COPPA self-declaration' },
      publishAt: {
        type: 'string',
        description: 'ISO 8601 time to schedule publishing; the video stays private until then',
      },
      language: {
        type: 'string',
        description: 'BCP-47 language of the title/description, e.g. "en"',
      },
      notifySubscribers: { type: 'boolean', default: true },
      playlistId: { type: 'string', description: 'Add the uploaded video to this playlist' },
      thumbnailUrl: {
        type: 'string',
        description: 'Image URL (JPEG/PNG, ≤ 2 MB) to set as the custom thumbnail',
      },
      sessionUri: {
        type: 'string',
        description:
          'Upload session returned by a previous in_progress result — continues that upload',
      },
      maxSeconds: {
        type: 'number',
        minimum: 5,
        maximum: MAX_BUDGET_SECONDS,
        default: DEFAULT_BUDGET_SECONDS,
        description:
          'Time budget for this call; when exceeded the upload pauses and returns sessionUri so it can be resumed',
      },
    },
    required: ['videoUrl'],
  }),
  execute: async (input) => {
    const startedAt = Date.now();
    const budget = Math.min(
      Math.max(input.maxSeconds ?? DEFAULT_BUDGET_SECONDS, 5),
      MAX_BUDGET_SECONDS
    );
    const deadline = startedAt + budget * 1000;
    const requestedPrivacy = input.publishAt ? 'private' : (input.privacy ?? 'private');
    const token = await accessToken();

    let sessionUri = input.sessionUri;
    let offset = 0;
    let source: Source;
    if (sessionUri) {
      const status = await sessionStatus(sessionUri, token, undefined);
      if (status.kind === 'done') return finishUpload(status.video, input, requestedPrivacy);
      offset = status.uploaded;
      source = await openSource(input.videoUrl, offset);
    } else {
      if (!input.title?.trim()) throw new Error('title is required for a new upload.');
      source = await openSource(input.videoUrl, 0);
      sessionUri = await startSession(
        {
          title: input.title.trim(),
          description: input.description,
          tags: input.tags,
          categoryId: input.categoryId,
          language: input.language,
          privacy: requestedPrivacy,
          publishAt: input.publishAt,
          madeForKids: input.madeForKids ?? false,
          notifySubscribers: input.notifySubscribers ?? true,
        },
        source,
        token
      );
    }

    const outcome = await pumpChunks(sessionUri, token, source, offset, deadline);
    if (outcome.done && outcome.video) return finishUpload(outcome.video, input, requestedPrivacy);
    const total = outcome.total;
    return {
      status: 'in_progress',
      sessionUri,
      uploadedBytes: outcome.uploaded,
      totalBytes: total,
      percent: total ? Math.round((outcome.uploaded / total) * 1000) / 10 : undefined,
      chunksSentThisCall: outcome.chunksSent,
      elapsedSeconds: Math.round((Date.now() - startedAt) / 10) / 100,
      next: 'Call uploadVideo again with the same videoUrl and this sessionUri to continue (the session stays valid for about a day).',
    };
  },
});

export const videoStatus = tool({
  description:
    'Check one of your videos: upload/processing status, privacy, schedule, failure reasons and basic stats. Use after uploadVideo until processing succeeds.',
  inputSchema: jsonSchema<{ videoId: string }>({
    type: 'object',
    properties: {
      videoId: { type: 'string', description: 'Video id (the v= parameter) or full watch URL' },
    },
    required: ['videoId'],
  }),
  execute: async ({ videoId }) => {
    const id = extractVideoId(videoId);
    const data = await ytFetch<ListResponse<VideoResource>>('GET', `${API}/videos`, {
      query: { part: 'snippet,status,processingDetails,statistics,contentDetails', id },
    });
    const video = data.items?.[0];
    if (!video) throw new Error(`Video ${id} was not found (or is not visible to this account).`);
    const progress = video.processingDetails?.processingProgress;
    return {
      ...summarizeVideo(video),
      processingProgress: progress
        ? {
            partsProcessed: num(progress.partsProcessed),
            partsTotal: num(progress.partsTotal),
            timeLeftMs: num(progress.timeLeftMs),
          }
        : undefined,
      description: video.snippet?.description,
    };
  },
});

export const myVideos = tool({
  description:
    "List your channel's most recent uploads (newest first) with privacy, processing state and view/like/comment counts.",
  inputSchema: jsonSchema<{ limit?: number; pageToken?: string }>({
    type: 'object',
    properties: {
      limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
      pageToken: { type: 'string', description: 'nextPageToken from a previous call' },
    },
  }),
  execute: async ({ limit, pageToken }) => {
    const channel = await myChannelResource();
    const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
    if (!uploads)
      return {
        channelId: channel.id,
        videos: [],
        note: 'This channel has no uploads playlist yet.',
      };
    const items = await ytFetch<ListResponse<{ contentDetails?: { videoId?: string } }>>(
      'GET',
      `${API}/playlistItems`,
      {
        query: {
          part: 'contentDetails',
          playlistId: uploads,
          maxResults: Math.min(Math.max(limit ?? 10, 1), 50),
          pageToken,
        },
      }
    );
    const ids = (items.items ?? [])
      .map((i) => i.contentDetails?.videoId)
      .filter((v): v is string => !!v);
    if (!ids.length)
      return { channelId: channel.id, videos: [], nextPageToken: items.nextPageToken };
    const videos = await ytFetch<ListResponse<VideoResource>>('GET', `${API}/videos`, {
      query: {
        part: 'snippet,status,processingDetails,statistics,contentDetails',
        id: ids.join(','),
        maxResults: 50,
      },
    });
    return {
      channelId: channel.id,
      videos: (videos.items ?? []).map(summarizeVideo),
      nextPageToken: items.nextPageToken,
      totalUploads: items.pageInfo?.totalResults,
    };
  },
});

export const updateVideo = tool({
  description:
    "Change a video's title, description, tags, category, privacy, schedule or made-for-kids flag. Only the fields you pass change; everything else is preserved.",
  inputSchema: jsonSchema<{
    videoId: string;
    title?: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
    privacy?: 'private' | 'unlisted' | 'public';
    publishAt?: string;
    madeForKids?: boolean;
    language?: string;
  }>({
    type: 'object',
    properties: {
      videoId: { type: 'string', description: 'Video id or watch URL' },
      title: { type: 'string', maxLength: 100 },
      description: { type: 'string', maxLength: 5000 },
      tags: { type: 'array', items: { type: 'string' }, description: 'Replaces the tag list' },
      categoryId: { type: 'string' },
      privacy: { type: 'string', enum: ['private', 'unlisted', 'public'] },
      publishAt: {
        type: 'string',
        description: 'ISO 8601 scheduled publish time (video must be private)',
      },
      madeForKids: { type: 'boolean' },
      language: { type: 'string', description: 'BCP-47 default language' },
    },
    required: ['videoId'],
  }),
  execute: async (input) => {
    const id = extractVideoId(input.videoId);
    const current = await ytFetch<ListResponse<VideoResource>>('GET', `${API}/videos`, {
      query: { part: 'snippet,status', id },
    });
    const video = current.items?.[0];
    if (!video?.snippet || !video.status)
      throw new Error(`Video ${id} was not found (or is not yours).`);
    const snippet = { ...video.snippet };
    delete snippet.thumbnails;
    delete snippet.publishedAt;
    if (input.title !== undefined) snippet.title = input.title;
    if (input.description !== undefined) snippet.description = input.description;
    if (input.tags !== undefined) snippet.tags = input.tags;
    if (input.categoryId !== undefined) snippet.categoryId = input.categoryId;
    if (input.language !== undefined) snippet.defaultLanguage = input.language;
    const status = { ...video.status };
    delete status.uploadStatus;
    delete status.failureReason;
    delete status.rejectionReason;
    if (input.privacy !== undefined) status.privacyStatus = input.privacy;
    if (input.publishAt !== undefined) {
      status.publishAt = input.publishAt;
      status.privacyStatus = 'private';
    }
    if (input.madeForKids !== undefined) status.selfDeclaredMadeForKids = input.madeForKids;
    const updated = await ytFetch<VideoResource>('PUT', `${API}/videos`, {
      query: { part: 'snippet,status' },
      json: { id, snippet, status },
    });
    return { updated: true, ...summarizeVideo(updated), description: updated.snippet?.description };
  },
});

async function uploadThumbnail(videoId: string, imageUrl: string): Promise<void> {
  const res = await fetch(imageUrl, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Could not fetch the thumbnail from ${imageUrl}: ${res.status}`);
  const contentType = mediaType(res, 'image/jpeg');
  if (!contentType.startsWith('image/'))
    throw new Error(`Thumbnail URL is not an image (content-type ${contentType}).`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length > MAX_THUMBNAIL_BYTES) {
    throw new Error(
      `Thumbnail is ${(bytes.length / 1024 / 1024).toFixed(1)} MB; YouTube allows at most 2 MB.`
    );
  }
  await ytFetch('POST', `${UPLOAD}/thumbnails/set`, {
    query: { videoId },
    headers: { 'Content-Type': contentType },
    body: bytes,
  });
}

export const setThumbnail = tool({
  description:
    'Set a custom thumbnail (JPEG/PNG, ≤ 2 MB) on one of your videos from an image URL. Requires a phone-verified channel.',
  inputSchema: jsonSchema<{ videoId: string; imageUrl: string }>({
    type: 'object',
    properties: {
      videoId: { type: 'string', description: 'Video id or watch URL' },
      imageUrl: { type: 'string', description: 'Direct URL of the image' },
    },
    required: ['videoId', 'imageUrl'],
  }),
  execute: async ({ videoId, imageUrl }) => {
    const id = extractVideoId(videoId);
    await uploadThumbnail(id, imageUrl);
    return { videoId: id, url: videoUrl(id), thumbnailSet: true };
  },
});

interface PlaylistResource {
  id: string;
  snippet?: { title?: string; description?: string; publishedAt?: string };
  status?: { privacyStatus?: string };
  contentDetails?: { itemCount?: number };
}

export const myPlaylists = tool({
  description:
    "List your channel's playlists with ids, titles, privacy and item counts (ids feed addToPlaylist / uploadVideo.playlistId).",
  inputSchema: jsonSchema<{ limit?: number; pageToken?: string }>({
    type: 'object',
    properties: {
      limit: { type: 'integer', minimum: 1, maximum: 50, default: 25 },
      pageToken: { type: 'string' },
    },
  }),
  execute: async ({ limit, pageToken }) => {
    const data = await ytFetch<ListResponse<PlaylistResource>>('GET', `${API}/playlists`, {
      query: {
        part: 'snippet,status,contentDetails',
        mine: true,
        maxResults: Math.min(Math.max(limit ?? 25, 1), 50),
        pageToken,
      },
    });
    return {
      playlists: (data.items ?? []).map((p) => ({
        playlistId: p.id,
        title: p.snippet?.title,
        description: p.snippet?.description,
        privacy: p.status?.privacyStatus,
        items: p.contentDetails?.itemCount,
        url: `https://www.youtube.com/playlist?list=${p.id}`,
      })),
      nextPageToken: data.nextPageToken,
    };
  },
});

async function addVideoToPlaylist(
  playlistId: string,
  videoId: string,
  position?: number
): Promise<{ playlistItemId: string }> {
  const item = await ytFetch<{ id: string }>('POST', `${API}/playlistItems`, {
    query: { part: 'snippet' },
    json: { snippet: { playlistId, position, resourceId: { kind: 'youtube#video', videoId } } },
  });
  return { playlistItemId: item.id };
}

export const addToPlaylist = tool({
  description: 'Add a video to one of your playlists (optionally at a position).',
  inputSchema: jsonSchema<{ playlistId: string; videoId: string; position?: number }>({
    type: 'object',
    properties: {
      playlistId: { type: 'string' },
      videoId: { type: 'string', description: 'Video id or watch URL' },
      position: { type: 'integer', minimum: 0, description: '0-based position; omitted = append' },
    },
    required: ['playlistId', 'videoId'],
  }),
  execute: async ({ playlistId, videoId, position }) => {
    const id = extractVideoId(videoId);
    const result = await addVideoToPlaylist(playlistId, id, position);
    return {
      added: true,
      playlistId,
      videoId: id,
      ...result,
      url: `https://www.youtube.com/playlist?list=${playlistId}`,
    };
  },
});

export const deleteVideo = tool({
  description:
    'Permanently delete one of your videos. Irreversible — confirm with the person first.',
  inputSchema: jsonSchema<{ videoId: string }>({
    type: 'object',
    properties: { videoId: { type: 'string', description: 'Video id or watch URL' } },
    required: ['videoId'],
  }),
  execute: async ({ videoId }) => {
    const id = extractVideoId(videoId);
    await ytFetch('DELETE', `${API}/videos`, { query: { id } });
    return { deleted: true, videoId: id };
  },
});

export const videoCategories = tool({
  description:
    'List the YouTube category ids a video can be assigned to in a region (for uploadVideo / updateVideo categoryId).',
  inputSchema: jsonSchema<{ region?: string }>({
    type: 'object',
    properties: {
      region: { type: 'string', default: 'US', description: 'ISO 3166-1 alpha-2 region code' },
    },
  }),
  execute: async ({ region }) => {
    const data = await ytFetch<
      ListResponse<{ id: string; snippet?: { title?: string; assignable?: boolean } }>
    >('GET', `${API}/videoCategories`, {
      query: { part: 'snippet', regionCode: (region ?? 'US').toUpperCase() },
    });
    return {
      region: (region ?? 'US').toUpperCase(),
      categories: (data.items ?? [])
        .filter((c) => c.snippet?.assignable !== false)
        .map((c) => ({ id: c.id, title: c.snippet?.title })),
    };
  },
});

/** Accepts a bare id, a watch URL, a youtu.be link or a /shorts/ link. */
export function extractVideoId(value: string): string {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    const v = url.searchParams.get('v');
    if (v) return v;
    const parts = url.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  } catch {
    // not a URL
  }
  return trimmed;
}

export default {
  youtubeAuthUrl,
  youtubeExchangeCode,
  myChannel,
  uploadVideo,
  videoStatus,
  myVideos,
  updateVideo,
  setThumbnail,
  myPlaylists,
  addToPlaylist,
  deleteVideo,
  videoCategories,
};
