import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mod, {
  CHUNK_BYTES,
  chunkStream,
  extractVideoId,
  myChannel,
  uploadVideo,
  videoStatus,
} from './index.js';

const ctx = { toolCallId: 'test', messages: [] };
const SOURCE = 'https://files.test/clip.mp4';
const SESSION = 'https://upload.test/session/abc';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const UPLOAD_VIDEOS = 'https://www.googleapis.com/upload/youtube/v3/videos';
const API_VIDEOS = 'https://www.googleapis.com/youtube/v3/videos';

interface Call {
  method: string;
  url: string;
  headers: Record<string, string>;
  bodyLength?: number;
  bodyText?: string;
}

interface SessionState {
  uploaded: number;
  done: boolean;
  /** Fail the Nth data PUT (1-based) once with 503. */
  failPut?: number;
  /** Pretend the server only kept this many bytes of the failed chunk. */
  keepOnFail?: number;
}

interface MockOptions {
  sourceBytes: number;
  announceLength?: boolean;
  contentType?: string;
  session?: Partial<SessionState>;
  finalPrivacy?: string;
  advanceClockPerPutMs?: number;
}

function bytesOf(n: number): ReadableStream<Uint8Array> {
  let sent = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= n) {
        controller.close();
        return;
      }
      const size = Math.min(1_000_003, n - sent); // odd piece size so chunks never align
      controller.enqueue(new Uint8Array(size));
      sent += size;
    },
  });
}

function headerMap(init?: RequestInit): Record<string, string> {
  const out: Record<string, string> = {};
  const h = init?.headers;
  if (!h) return out;
  if (h instanceof Headers) for (const [k, v] of h) out[k.toLowerCase()] = v;
  else if (Array.isArray(h)) for (const [k, v] of h) out[k.toLowerCase()] = v;
  else for (const [k, v] of Object.entries(h)) out[k.toLowerCase()] = v as string;
  return out;
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function recordCall(calls: Call[], input: string | URL | Request, init?: RequestInit): Call {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const method = (init?.method ?? 'GET').toUpperCase();
  const call: Call = { method, url, headers: headerMap(init) };
  const body = init?.body;
  if (body instanceof Uint8Array) call.bodyLength = body.length;
  else if (typeof body === 'string') call.bodyText = body;
  else if (body instanceof URLSearchParams) call.bodyText = body.toString();
  calls.push(call);
  return call;
}

function sourceResponse(opts: MockOptions, headers: Record<string, string>): Response {
  const h: Record<string, string> = { 'content-type': opts.contentType ?? 'video/mp4' };
  const range = headers.range;
  const start = range ? Number(/bytes=(\d+)-/.exec(range)?.[1] ?? 0) : 0;
  if (range) h['content-range'] = `bytes ${start}-${opts.sourceBytes - 1}/${opts.sourceBytes}`;
  if (opts.announceLength !== false) h['content-length'] = String(opts.sourceBytes - start);
  return new Response(bytesOf(opts.sourceBytes - start), { status: range ? 206 : 200, headers: h });
}

interface SessionMock {
  state: SessionState;
  dataPuts: number;
  videoJson: () => unknown;
}

function sessionStatusResponse(mock: SessionMock): Response {
  if (mock.state.done) return json(mock.videoJson());
  const h: Record<string, string> = {};
  if (mock.state.uploaded > 0) h.range = `bytes=0-${mock.state.uploaded - 1}`;
  return new Response(null, { status: 308, headers: h });
}

function sessionDataResponse(
  mock: SessionMock,
  contentRange: string,
  bodyLength: number
): Response {
  const m = /bytes (\d+)-(\d+)\/(\d+|\*)/.exec(contentRange);
  if (!m) return new Response('bad content-range', { status: 400 });
  const start = Number(m[1]);
  const end = Number(m[2]);
  const total = m[3];
  if (end - start + 1 !== bodyLength) {
    return new Response(`length mismatch ${bodyLength}`, { status: 400 });
  }
  if (start !== mock.state.uploaded) {
    return new Response(`offset ${start} != ${mock.state.uploaded}`, { status: 400 });
  }
  mock.dataPuts += 1;
  if (mock.state.failPut === mock.dataPuts) {
    mock.state.failPut = undefined;
    mock.state.uploaded = start + (mock.state.keepOnFail ?? 0);
    return new Response('backend error', { status: 503 });
  }
  mock.state.uploaded = end + 1;
  if (total !== '*' && end + 1 === Number(total)) {
    mock.state.done = true;
    return json(mock.videoJson());
  }
  return new Response(null, {
    status: 308,
    headers: { range: `bytes=0-${mock.state.uploaded - 1}` },
  });
}

function videosGetResponse(): Response {
  return json({
    items: [
      {
        id: 'vid123',
        snippet: {
          title: 'My clip',
          description: 'd',
          publishedAt: '2026-08-22T00:00:00Z',
          tags: ['a'],
        },
        status: { uploadStatus: 'processed', privacyStatus: 'unlisted' },
        processingDetails: { processingStatus: 'succeeded' },
        statistics: { viewCount: '12', likeCount: '3', commentCount: '1' },
        contentDetails: { duration: 'PT1M2S' },
      },
    ],
  });
}

function installMock(opts: MockOptions): { calls: Call[]; session: SessionState } {
  const calls: Call[] = [];
  const mock: SessionMock = {
    state: { uploaded: 0, done: false, ...opts.session },
    dataPuts: 0,
    videoJson: () => ({
      id: 'vid123',
      snippet: { title: 'My clip', publishedAt: '2026-08-22T00:00:00Z' },
      status: { uploadStatus: 'uploaded', privacyStatus: opts.finalPrivacy ?? 'private' },
    }),
  };

  const sessionResponse = (call: Call): Response => {
    if (opts.advanceClockPerPutMs) vi.setSystemTime(Date.now() + opts.advanceClockPerPutMs);
    const contentRange = call.headers['content-range'] ?? '';
    if (contentRange.startsWith('bytes */')) return sessionStatusResponse(mock);
    return sessionDataResponse(mock, contentRange, call.bodyLength ?? 0);
  };

  const routes: Array<[(call: Call) => boolean, (call: Call) => Response]> = [
    [(c) => c.url === TOKEN_URL, () => json({ access_token: 'tok', expires_in: 3600 })],
    [(c) => c.url === SOURCE, (c) => sourceResponse(opts, c.headers)],
    [
      (c) => c.method === 'POST' && c.url.startsWith(`${UPLOAD_VIDEOS}?`),
      () => new Response(null, { status: 200, headers: { location: SESSION } }),
    ],
    [(c) => c.method === 'PUT' && c.url === SESSION, sessionResponse],
    [(c) => c.method === 'GET' && c.url.startsWith(`${API_VIDEOS}?`), () => videosGetResponse()],
  ];

  const handler = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const call = recordCall(calls, input, init);
    const route = routes.find(([matches]) => matches(call));
    return route
      ? route[1](call)
      : new Response(`unmocked ${call.method} ${call.url}`, { status: 599 });
  };

  vi.stubGlobal('fetch', vi.fn(handler));
  return { calls, session: mock.state };
}

const dataPutsOf = (calls: Call[]) =>
  calls.filter(
    (c) =>
      c.url === SESSION && c.method === 'PUT' && !c.headers['content-range']?.startsWith('bytes */')
  );

describe('@tpmjs/tools-youtube', () => {
  beforeEach(() => {
    process.env.YOUTUBE_CLIENT_ID = 'cid';
    process.env.YOUTUBE_CLIENT_SECRET = 'csecret';
    process.env.YOUTUBE_REFRESH_TOKEN = 'rtoken';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete process.env.YOUTUBE_CLIENT_ID;
    delete process.env.YOUTUBE_CLIENT_SECRET;
    delete process.env.YOUTUBE_REFRESH_TOKEN;
  });

  it('exports 12 well-formed tools', () => {
    const names = Object.keys(mod);
    expect(names).toHaveLength(12);
    for (const name of names) {
      const t = (
        mod as Record<string, { execute?: unknown; description?: unknown; inputSchema?: unknown }>
      )[name];
      expect(typeof t?.execute, name).toBe('function');
      expect(typeof t?.description, name).toBe('string');
      expect(t?.inputSchema, name).toBeTruthy();
    }
  });

  it('fails with a readable message when credentials are missing', async () => {
    delete process.env.YOUTUBE_REFRESH_TOKEN;
    installMock({ sourceBytes: 10 });
    await expect(myChannel.execute!({}, ctx)).rejects.toThrow(/YOUTUBE_REFRESH_TOKEN/);
  });

  it('extracts video ids from the usual URL shapes', () => {
    expect(extractVideoId('abc123')).toBe('abc123');
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  describe('chunkStream', () => {
    const pieces = (...sizes: number[]) =>
      new ReadableStream<Uint8Array>({
        start(c) {
          for (const s of sizes) c.enqueue(new Uint8Array(s));
          c.close();
        },
      });
    const collect = async (stream: ReadableStream<Uint8Array>, size: number) => {
      const out: Array<[number, boolean]> = [];
      for await (const c of chunkStream(stream, size)) out.push([c.bytes.length, c.last]);
      return out;
    };

    it('emits fixed chunks and a non-empty final chunk', async () => {
      expect(await collect(pieces(4, 4, 4, 4, 1), 10)).toEqual([
        [10, false],
        [7, true],
      ]);
    });
    it('never sends the last bytes as a non-final chunk when the size divides evenly', async () => {
      expect(await collect(pieces(20), 10)).toEqual([
        [10, false],
        [10, true],
      ]);
      expect(await collect(pieces(10), 10)).toEqual([[10, true]]);
    });
  });

  describe('uploadVideo', () => {
    const SIZE = 2 * CHUNK_BYTES + 12_345;

    it('uploads a known-length file in 8 MiB chunks with exact Content-Range headers', async () => {
      const { calls } = installMock({ sourceBytes: SIZE });
      const result = (await uploadVideo.execute!(
        { videoUrl: SOURCE, title: 'My clip', tags: ['t'], privacy: 'private' },
        ctx
      )) as Record<string, unknown>;
      expect(result.status).toBe('uploaded');
      expect(result.videoId).toBe('vid123');
      expect(result.url).toBe('https://www.youtube.com/watch?v=vid123');

      const init = calls.find(
        (c) => c.method === 'POST' && c.url.includes('/upload/youtube/v3/videos')
      );
      expect(init?.url).toContain('uploadType=resumable');
      expect(init?.url).toContain('notifySubscribers=true');
      expect(init?.headers['x-upload-content-length']).toBe(String(SIZE));
      expect(init?.headers['x-upload-content-type']).toBe('video/mp4');
      expect(JSON.parse(init?.bodyText ?? '{}')).toMatchObject({
        snippet: { title: 'My clip', tags: ['t'] },
        status: { privacyStatus: 'private', selfDeclaredMadeForKids: false },
      });

      const puts = dataPutsOf(calls);
      expect(puts.map((p) => p.headers['content-range'])).toEqual([
        `bytes 0-${CHUNK_BYTES - 1}/${SIZE}`,
        `bytes ${CHUNK_BYTES}-${2 * CHUNK_BYTES - 1}/${SIZE}`,
        `bytes ${2 * CHUNK_BYTES}-${SIZE - 1}/${SIZE}`,
      ]);
      expect(puts.map((p) => p.bodyLength)).toEqual([CHUNK_BYTES, CHUNK_BYTES, 12_345]);
    });

    it('handles an unknown-length source by closing with the exact total on the last chunk', async () => {
      const { calls } = installMock({ sourceBytes: SIZE, announceLength: false });
      const result = (await uploadVideo.execute!({ videoUrl: SOURCE, title: 'x' }, ctx)) as Record<
        string,
        unknown
      >;
      expect(result.status).toBe('uploaded');
      const ranges = dataPutsOf(calls).map((p) => p.headers['content-range']);
      expect(ranges[0]).toBe(`bytes 0-${CHUNK_BYTES - 1}/*`);
      expect(ranges[2]).toBe(`bytes ${2 * CHUNK_BYTES}-${SIZE - 1}/${SIZE}`);
    });

    it('pauses when the time budget is spent and resumes from the session offset', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      const first = installMock({ sourceBytes: SIZE, advanceClockPerPutMs: 10_000 });
      const paused = (await uploadVideo.execute!(
        { videoUrl: SOURCE, title: 'x', maxSeconds: 5 },
        ctx
      )) as Record<string, unknown>;
      expect(paused.status).toBe('in_progress');
      expect(paused.sessionUri).toBe(SESSION);
      expect(paused.uploadedBytes).toBe(CHUNK_BYTES);
      expect(paused.totalBytes).toBe(SIZE);
      expect(dataPutsOf(first.calls)).toHaveLength(1);
      vi.useRealTimers();

      const second = installMock({ sourceBytes: SIZE, session: { uploaded: CHUNK_BYTES } });
      const done = (await uploadVideo.execute!(
        { videoUrl: SOURCE, sessionUri: SESSION },
        ctx
      )) as Record<string, unknown>;
      expect(done.status).toBe('uploaded');
      const sourceFetch = second.calls.find((c) => c.url === SOURCE);
      expect(sourceFetch?.headers.range).toBe(`bytes=${CHUNK_BYTES}-`);
      expect(dataPutsOf(second.calls).map((p) => p.headers['content-range'])).toEqual([
        `bytes ${CHUNK_BYTES}-${2 * CHUNK_BYTES - 1}/${SIZE}`,
        `bytes ${2 * CHUNK_BYTES}-${SIZE - 1}/${SIZE}`,
      ]);
    });

    it('retries a failed chunk from the offset the server actually kept', async () => {
      const { calls } = installMock({
        sourceBytes: SIZE,
        session: { failPut: 2, keepOnFail: 1_048_576 },
      });
      const result = (await uploadVideo.execute!({ videoUrl: SOURCE, title: 'x' }, ctx)) as Record<
        string,
        unknown
      >;
      expect(result.status).toBe('uploaded');
      const ranges = dataPutsOf(calls).map((p) => p.headers['content-range']);
      expect(ranges).toEqual([
        `bytes 0-${CHUNK_BYTES - 1}/${SIZE}`,
        `bytes ${CHUNK_BYTES}-${2 * CHUNK_BYTES - 1}/${SIZE}`, // fails with 503
        `bytes ${CHUNK_BYTES + 1_048_576}-${2 * CHUNK_BYTES - 1}/${SIZE}`, // resent remainder
        `bytes ${2 * CHUNK_BYTES}-${SIZE - 1}/${SIZE}`,
      ]);
    }, 15_000);

    it('explains when YouTube downgrades the requested privacy', async () => {
      installMock({ sourceBytes: 1000, finalPrivacy: 'private' });
      const result = (await uploadVideo.execute!(
        { videoUrl: SOURCE, title: 'x', privacy: 'public' },
        ctx
      )) as {
        notes: string[];
      };
      expect(result.notes.join(' ')).toMatch(/compliance audit/);
    });

    it('rejects URLs that are not media files', async () => {
      installMock({ sourceBytes: 1000, contentType: 'text/html' });
      await expect(uploadVideo.execute!({ videoUrl: SOURCE, title: 'x' }, ctx)).rejects.toThrow(
        /does not look like a video/
      );
    });

    it('requires a title for a new upload', async () => {
      installMock({ sourceBytes: 1000 });
      await expect(uploadVideo.execute!({ videoUrl: SOURCE }, ctx)).rejects.toThrow(
        /title is required/
      );
    });
  });

  it('videoStatus summarises processing and stats', async () => {
    installMock({ sourceBytes: 1 });
    const result = (await videoStatus.execute!(
      { videoId: 'https://youtu.be/vid123' },
      ctx
    )) as Record<string, unknown>;
    expect(result).toMatchObject({
      videoId: 'vid123',
      privacy: 'unlisted',
      uploadStatus: 'processed',
      processingStatus: 'succeeded',
      views: 12,
      likes: 3,
      duration: 'PT1M2S',
    });
  });
});
