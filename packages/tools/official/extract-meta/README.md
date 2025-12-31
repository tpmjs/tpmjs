# @tpmjs/tools-extract-meta

Extract meta tags from HTML pages including title, description, Open Graph, and Twitter Cards.

## Installation

```bash
npm install @tpmjs/tools-extract-meta
```

## Usage

```typescript
import { extractMetaTool } from '@tpmjs/tools-extract-meta';

// Use with AI SDK
const result = await extractMetaTool.execute({
  url: 'https://example.com',
});

console.log(result.title); // 'Example Domain'
console.log(result.description); // 'This domain is for use in illustrative examples...'
console.log(result.ogTags); // { title: '...', image: '...', ... }
console.log(result.twitterTags); // { card: 'summary', ... }
```

## Features

- Extracts standard meta tags (title, description, canonical)
- Extracts all Open Graph tags (og:title, og:image, og:description, etc.)
- Extracts all Twitter Card tags (twitter:card, twitter:image, etc.)
- Uses OG tags as fallbacks when standard tags are missing
- Fast HTML parsing with cheerio
- 30 second timeout for requests
- Comprehensive error handling

## Input

- `url` (string, required): The URL to extract meta tags from (must be http or https)

## Output

Returns an `ExtractMetaResult` object:

```typescript
{
  title: string | null;           // Page title (from <title> or og:title)
  description: string | null;     // Meta description
  canonical: string | null;       // Canonical URL
  ogTags: Record<string, string>; // All Open Graph tags (without 'og:' prefix)
  twitterTags: Record<string, string>; // All Twitter Card tags (without 'twitter:' prefix)
  metadata: {
    url: string;                  // Original URL
    fetchedAt: string;            // ISO timestamp
    contentType: string;          // Content-Type header
    hasOpenGraph: boolean;        // Whether page has OG tags
    hasTwitterCard: boolean;      // Whether page has Twitter Card tags
  };
}
```

## Open Graph Tags

Common OG tags extracted (keys without `og:` prefix):

- `title` - Open Graph title
- `description` - Open Graph description
- `image` - Open Graph image URL
- `url` - Open Graph canonical URL
- `type` - Content type (article, website, etc.)
- `site_name` - Website name
- `locale` - Content locale

## Twitter Card Tags

Common Twitter tags extracted (keys without `twitter:` prefix):

- `card` - Card type (summary, summary_large_image, etc.)
- `title` - Twitter card title
- `description` - Twitter card description
- `image` - Twitter card image URL
- `site` - Twitter username for website
- `creator` - Twitter username for content creator

## Use Cases

- SEO analysis and auditing
- Social media preview generation
- Content metadata extraction
- Website scraping and indexing
- Link preview generation
- Meta tag validation

## Requirements

- Node.js 18+ (uses native fetch API)

## License

MIT
