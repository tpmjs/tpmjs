# @tpmjs/tools-web-research

The everyday research kit: read any page as markdown, search the web through your preferred provider, ask Perplexity with citations, find Wayback snapshots and search archive.org.

Part of the **ajax weapons** set: task-level, provider-agnostic tools that an agent can pick up without learning a vendor API. Credentials come from the environment; on tpmjs add them as collection env vars (the collection owner's calls get them injected, everyone else supplies their own).

## Installation

```bash
npm install @tpmjs/tools-web-research
```

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `FIRECRAWL_API_KEY` | no | Firecrawl key for webSearch (one of the search keys is required for webSearch) |
| `BRAVE_SEARCH_API_KEY` | no | Brave Search API key for webSearch |
| `SERPER_API_KEY` | no | Serper (Google) key for webSearch |
| `TAVILY_API_KEY` | no | Tavily key for webSearch |
| `PERPLEXITY_API_KEY` | no | Perplexity key for askPerplexity |
| `JINA_API_KEY` | no | Optional Jina key for higher readPage rate limits |

## Tools

| Export | What it does |
| --- | --- |
| `readPage` | Fetch a web page and return its readable content as markdown (title, text, links), with length control. |
| `webSearch` | Search the web through the first configured provider (Firecrawl, Brave, Serper or Tavily) and return normalised results. |
| `askPerplexity` | Ask Perplexity (sonar) a research question and get a sourced answer with citations. |
| `waybackSnapshot` | Find the closest Wayback Machine snapshot of a URL, optionally near a date. |
| `archiveSearch` | Search the Internet Archive catalog (books, texts, audio, video) and return items with identifiers and links. |

## Usage

```typescript
import { readPage, webSearch, askPerplexity, waybackSnapshot, archiveSearch } from '@tpmjs/tools-web-research';

const ctx = { toolCallId: 'c1', messages: [] };
const page = await readPage.execute({ url: 'https://tpmjs.com' }, ctx);
const hits = await webSearch.execute({ query: 'pgvector HNSW tuning' }, ctx);
const snap = await waybackSnapshot.execute({ url: 'https://example.com', timestamp: '2016' }, ctx);
```

Every tool throws a readable error on provider failures (status code + provider message), so agents can react instead of guessing.

## License

MIT
