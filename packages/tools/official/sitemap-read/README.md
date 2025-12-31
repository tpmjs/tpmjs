# @tpmjs/tools-sitemap-read

Parse XML sitemaps and extract URLs from sitemap.xml files.

## Installation

```bash
npm install @tpmjs/tools-sitemap-read
```

## Usage

```typescript
import { sitemapReadTool } from '@tpmjs/tools-sitemap-read';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: { sitemapReadTool },
  prompt: 'Get all URLs from https://example.com/sitemap.xml',
});
```

## Tool Parameters

- `url` (string, required): The sitemap.xml URL to parse

## Returns

```typescript
{
  urls: Array<{
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: string;
  }>;
  isSitemapIndex: boolean;
  urlCount: number;
  sitemapIndexUrls?: Array<{
    loc: string;
    lastmod?: string;
  }>;
  metadata: {
    fetchedAt: string;
    sourceUrl: string;
    type: 'urlset' | 'sitemapindex';
  };
}
```

## Features

- Supports both regular sitemaps (urlset) and sitemap indexes (sitemapindex)
- Extracts URL locations with optional metadata (lastmod, changefreq, priority)
- Handles sitemap index files that reference other sitemaps
- Comprehensive error handling
- 30-second timeout protection
- Validates XML structure

## Sitemap Types

### Regular Sitemap (urlset)
Contains direct page URLs with optional metadata:
```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### Sitemap Index (sitemapindex)
Contains references to other sitemap files:
```xml
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap1.xml</loc>
    <lastmod>2024-01-01</lastmod>
  </sitemap>
</sitemapindex>
```

## Requirements

- Node.js 18+ (uses native fetch API)

## License

MIT
