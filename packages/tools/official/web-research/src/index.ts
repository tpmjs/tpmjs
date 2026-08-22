/**
 * @tpmjs/tools-web-research — the everyday research kit.
 *
 * readPage (any URL → markdown via Jina Reader, no key needed), webSearch (Firecrawl,
 * Brave, Serper or Tavily — first configured key wins), askPerplexity (sourced answers),
 * waybackSnapshot (Internet Archive availability API) and archiveSearch (archive.org
 * catalog). All plain HTTPS.
 *
 * @env FIRECRAWL_API_KEY | BRAVE_SEARCH_API_KEY | SERPER_API_KEY | TAVILY_API_KEY (webSearch), PERPLEXITY_API_KEY, JINA_API_KEY (optional)
 */

import { jsonSchema, tool } from 'ai';

function envValue(name: string): string | undefined {
  const value = globalThis.process?.env?.[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

async function fail(res: Response, what: string): Promise<never> {
  const text = await res.text().catch(() => '');
  throw new Error(`${what} failed: ${res.status}${text ? ` — ${text.slice(0, 300)}` : ''}`);
}

// ─── readPage ────────────────────────────────────────────────────────────────

interface JinaReaderResponse {
  data?: { title?: string; content?: string; url?: string; links?: Record<string, string> };
}

export const readPage = tool({
  description:
    'Fetch a web page and return its readable content as markdown (title, text, links), with length control. Works on most sites including JS-rendered ones.',
  inputSchema: jsonSchema<{ url: string; maxChars?: number; withLinks?: boolean }>({
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Page URL' },
      maxChars: {
        type: 'integer',
        description: 'Truncate content to this many characters (default 20000)',
        default: 20000,
      },
      withLinks: {
        type: 'boolean',
        description: 'Include a list of links found on the page',
        default: false,
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url, maxChars = 20000, withLinks = false }) {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Return-Format': 'markdown',
    };
    if (withLinks) headers['X-With-Links-Summary'] = 'true';
    const jina = envValue('JINA_API_KEY');
    if (jina) headers.Authorization = `Bearer ${jina}`;
    const res = await fetch(`https://r.jina.ai/${url}`, { headers });
    if (!res.ok) await fail(res, `readPage(${url})`);
    const data = (await res.json()) as JinaReaderResponse;
    const content = data.data?.content ?? '';
    const links =
      withLinks && data.data?.links
        ? Object.entries(data.data.links)
            .slice(0, 200)
            .map(([text, href]) => ({ text, href }))
        : undefined;
    return {
      url: data.data?.url ?? url,
      title: data.data?.title ?? null,
      truncated: content.length > maxChars,
      content: content.slice(0, maxChars),
      ...(links ? { links } : {}),
    };
  },
});

// ─── webSearch ───────────────────────────────────────────────────────────────

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
}

type SearchProvider = 'firecrawl' | 'brave' | 'serper' | 'tavily';

async function searchFirecrawl(query: string, limit: number): Promise<SearchHit[]> {
  const res = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${envValue('FIRECRAWL_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) await fail(res, 'Firecrawl search');
  const data = (await res.json()) as {
    data?: Array<{ title?: string; url: string; description?: string }>;
  };
  return (data.data ?? []).map((r) => ({
    title: r.title ?? r.url,
    url: r.url,
    snippet: r.description ?? '',
  }));
}

async function searchBrave(query: string, limit: number): Promise<SearchHit[]> {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`,
    {
      headers: {
        'X-Subscription-Token': envValue('BRAVE_SEARCH_API_KEY') as string,
        Accept: 'application/json',
      },
    }
  );
  if (!res.ok) await fail(res, 'Brave search');
  const data = (await res.json()) as {
    web?: { results?: Array<{ title: string; url: string; description?: string }> };
  };
  return (data.web?.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.description ?? '',
  }));
}

async function searchSerper(query: string, limit: number): Promise<SearchHit[]> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': envValue('SERPER_API_KEY') as string,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: limit }),
  });
  if (!res.ok) await fail(res, 'Serper search');
  const data = (await res.json()) as {
    organic?: Array<{ title: string; link: string; snippet?: string }>;
  };
  return (data.organic ?? []).map((r) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet ?? '',
  }));
}

async function searchTavily(query: string, limit: number): Promise<SearchHit[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${envValue('TAVILY_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, max_results: limit }),
  });
  if (!res.ok) await fail(res, 'Tavily search');
  const data = (await res.json()) as {
    results?: Array<{ title: string; url: string; content?: string }>;
  };
  return (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content ?? '',
  }));
}

const SEARCH_PROVIDERS: Array<
  [SearchProvider, string, (q: string, l: number) => Promise<SearchHit[]>]
> = [
  ['firecrawl', 'FIRECRAWL_API_KEY', searchFirecrawl],
  ['brave', 'BRAVE_SEARCH_API_KEY', searchBrave],
  ['serper', 'SERPER_API_KEY', searchSerper],
  ['tavily', 'TAVILY_API_KEY', searchTavily],
];

export const webSearch = tool({
  description:
    'Search the web through the first configured provider (Firecrawl, Brave, Serper or Tavily) and return normalised results (title, url, snippet).',
  inputSchema: jsonSchema<{ query: string; limit?: number; provider?: SearchProvider }>({
    type: 'object',
    properties: {
      query: { type: 'string' },
      limit: { type: 'integer', description: '1–20 results (default 8)', default: 8 },
      provider: {
        type: 'string',
        enum: ['firecrawl', 'brave', 'serper', 'tavily'],
        description: 'Force a provider',
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute({ query, limit = 8, provider }) {
    const chosen = provider
      ? SEARCH_PROVIDERS.find(([p]) => p === provider)
      : SEARCH_PROVIDERS.find(([, key]) => envValue(key));
    if (!chosen || !envValue(chosen[1])) {
      throw new Error(
        'No search provider configured. Set FIRECRAWL_API_KEY, BRAVE_SEARCH_API_KEY, SERPER_API_KEY or TAVILY_API_KEY.'
      );
    }
    const results = await chosen[2](query, Math.min(20, Math.max(1, limit)));
    return { provider: chosen[0], query, results };
  },
});

// ─── askPerplexity ───────────────────────────────────────────────────────────

export const askPerplexity = tool({
  description:
    'Ask Perplexity (sonar) a research question and get a sourced answer with citations.',
  inputSchema: jsonSchema<{
    question: string;
    model?: string;
    recency?: 'day' | 'week' | 'month' | 'year';
  }>({
    type: 'object',
    properties: {
      question: { type: 'string' },
      model: {
        type: 'string',
        description: 'sonar (default), sonar-pro, sonar-reasoning',
        default: 'sonar',
      },
      recency: {
        type: 'string',
        enum: ['day', 'week', 'month', 'year'],
        description: 'Restrict sources to recent content',
      },
    },
    required: ['question'],
    additionalProperties: false,
  }),
  async execute({ question, model = 'sonar', recency }) {
    const key = envValue('PERPLEXITY_API_KEY');
    if (!key) throw new Error('PERPLEXITY_API_KEY is required.');
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: question }],
        ...(recency ? { search_recency_filter: recency } : {}),
      }),
    });
    if (!res.ok) await fail(res, 'Perplexity');
    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      citations?: string[];
    };
    return {
      model,
      answer: data.choices[0]?.message.content ?? '',
      citations: data.citations ?? [],
    };
  },
});

// ─── Internet Archive ────────────────────────────────────────────────────────

interface WaybackClosest {
  url: string;
  timestamp: string;
  status: string;
}

async function waybackAvailability(
  url: string,
  timestamp?: string
): Promise<WaybackClosest | null | 'retry'> {
  const q = new URLSearchParams({ url });
  if (timestamp) q.set('timestamp', timestamp);
  const res = await fetch(`https://archive.org/wayback/available?${q.toString()}`, {
    headers: { 'User-Agent': 'tpmjs-web-research/0.1 (+https://tpmjs.com)' },
  });
  if (res.status === 429 || res.status >= 500) return 'retry';
  if (!res.ok) await fail(res, 'Wayback availability');
  const data = (await res.json()) as {
    archived_snapshots?: { closest?: { url: string; timestamp: string; status: string } };
  };
  const c = data.archived_snapshots?.closest;
  return c ? { url: c.url, timestamp: c.timestamp, status: c.status } : null;
}

/** CDX index fallback — slower but not subject to the availability API's tight rate limit. */
async function waybackCdx(url: string, timestamp?: string): Promise<WaybackClosest | null> {
  const q = new URLSearchParams({
    url,
    output: 'json',
    limit: '1',
    fl: 'timestamp,original,statuscode',
    filter: 'statuscode:200',
  });
  if (timestamp) {
    q.set('from', timestamp.slice(0, 8));
    q.set('sort', 'closest');
    q.set('closest', timestamp);
  } else {
    q.set('sort', 'closest');
    q.set('closest', '99991231');
  }
  const res = await fetch(`https://web.archive.org/cdx/search/cdx?${q.toString()}`, {
    headers: { 'User-Agent': 'tpmjs-web-research/0.1 (+https://tpmjs.com)' },
  });
  if (!res.ok) await fail(res, 'Wayback CDX');
  const rows = (await res.json()) as string[][];
  const hit = rows[1];
  if (!hit) return null;
  const [ts, original, status] = hit;
  return {
    url: `https://web.archive.org/web/${ts}/${original}`,
    timestamp: ts ?? '',
    status: status ?? '200',
  };
}

export const waybackSnapshot = tool({
  description:
    'Find the closest Wayback Machine snapshot of a URL, optionally near a date (YYYYMMDD). Use it to read pages that are gone or paywalled.',
  inputSchema: jsonSchema<{ url: string; timestamp?: string }>({
    type: 'object',
    properties: {
      url: { type: 'string' },
      timestamp: { type: 'string', description: 'Preferred time as YYYYMMDD or YYYYMMDDhhmmss' },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url, timestamp }) {
    let closest = await waybackAvailability(url, timestamp);
    if (closest === 'retry') {
      await new Promise((r) => setTimeout(r, 1500));
      closest = await waybackAvailability(url, timestamp);
    }
    const resolved = closest === 'retry' ? await waybackCdx(url, timestamp) : closest;
    return resolved
      ? {
          found: true,
          snapshotUrl: resolved.url,
          timestamp: resolved.timestamp,
          status: resolved.status,
          readableUrl: `https://r.jina.ai/${resolved.url}`,
        }
      : {
          found: false,
          snapshotUrl: null,
          hint: `No snapshot; try https://web.archive.org/save/${url} to capture one.`,
        };
  },
});

const first = (v: unknown): string | null =>
  v === undefined || v === null ? null : Array.isArray(v) ? String(v[0] ?? '') : String(v);

function toArchiveItem(d: Record<string, unknown>) {
  const id = String(d.identifier);
  return {
    identifier: id,
    title: String(d.title ?? ''),
    creator: Array.isArray(d.creator) ? d.creator.join('; ') : first(d.creator),
    date: first(d.date),
    mediatype: String(d.mediatype ?? ''),
    description: first(d.description)?.slice(0, 300) ?? null,
    url: `https://archive.org/details/${id}`,
    fullTextUrl: d.mediatype === 'texts' ? `https://archive.org/stream/${id}/${id}_djvu.txt` : null,
  };
}

export const archiveSearch = tool({
  description:
    'Search the Internet Archive catalog (books, texts, audio, video, web collections) and return items with identifiers, dates and links.',
  inputSchema: jsonSchema<{ query: string; limit?: number; mediatype?: string }>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Lucene-style query, e.g. "Mossman 1890 subject:Queensland"',
      },
      limit: { type: 'integer', description: '1–50 (default 15)', default: 15 },
      mediatype: {
        type: 'string',
        description: 'texts | audio | movies | image | software | data',
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute({ query, limit = 15, mediatype }) {
    const q = mediatype ? `(${query}) AND mediatype:${mediatype}` : query;
    const params = new URLSearchParams({
      q,
      rows: String(Math.min(50, Math.max(1, limit))),
      output: 'json',
    });
    for (const f of ['identifier', 'title', 'creator', 'date', 'mediatype', 'description'])
      params.append('fl[]', f);
    params.append('sort[]', 'downloads desc');
    const res = await fetch(`https://archive.org/advancedsearch.php?${params.toString()}`);
    if (!res.ok) await fail(res, 'archive.org search');
    const data = (await res.json()) as {
      response?: { numFound: number; docs: Array<Record<string, unknown>> };
    };
    return {
      totalFound: data.response?.numFound ?? 0,
      items: (data.response?.docs ?? []).map(toArchiveItem),
    };
  },
});
