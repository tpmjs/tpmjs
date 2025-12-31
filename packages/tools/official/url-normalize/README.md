# @tpmjs/tools-url-normalize

Normalize URLs with configurable options for consistent URL handling.

## Installation

```bash
npm install @tpmjs/tools-url-normalize
```

## Usage

```typescript
import { urlNormalizeTool } from '@tpmjs/tools-url-normalize';

// Use with AI SDK
const result = await urlNormalizeTool.execute({
  url: 'HTTPS://WWW.Example.COM:443/path/?z=1&a=2#section',
  options: {
    sortParams: true,
    removeHash: true,
    lowercase: true,
    removeTrailingSlash: true,
    removeDefaultPort: true,
    removeWWW: true,
  },
});

console.log(result.normalized);
// 'https://example.com/path?a=2&z=1'

console.log(result.changes);
// [
//   { type: 'lowercase', description: '...', before: 'HTTPS:', after: 'https:' },
//   { type: 'lowercase', description: '...', before: 'WWW.Example.COM', after: 'www.example.com' },
//   { type: 'removeWWW', description: '...', before: 'www.example.com', after: 'example.com' },
//   { type: 'removeDefaultPort', description: '...', before: '443', after: '' },
//   { type: 'sortParams', description: '...', before: '?z=1&a=2', after: '?a=2&z=1' },
//   { type: 'removeHash', description: '...', before: '#section', after: '' },
// ]
```

## Features

- **Lowercase conversion**: Converts protocol and hostname to lowercase
- **Trailing slash removal**: Removes trailing slashes from pathnames
- **Query parameter sorting**: Sorts query parameters alphabetically
- **Hash removal**: Optionally removes URL fragments
- **Default port removal**: Removes standard ports (80, 443, 21)
- **WWW removal**: Optionally removes www subdomain
- **Change tracking**: Reports all transformations applied

## Parameters

- `url` (string, required): The URL to normalize
- `options` (object, optional): Normalization options
  - `sortParams` (boolean, default: true): Sort query parameters alphabetically
  - `removeHash` (boolean, default: false): Remove URL fragment/hash
  - `lowercase` (boolean, default: true): Convert protocol and hostname to lowercase
  - `removeTrailingSlash` (boolean, default: true): Remove trailing slash from pathname
  - `removeDefaultPort` (boolean, default: true): Remove default ports
  - `removeWWW` (boolean, default: false): Remove www subdomain

## Returns

```typescript
{
  normalized: string;
  original: string;
  changes: Array<{
    type: string;
    description: string;
    before: string;
    after: string;
  }>;
  metadata: {
    protocol: string;
    hostname: string;
    pathname: string;
    hasQueryParams: boolean;
    hasHash: boolean;
  };
}
```

## Use Cases

- URL deduplication in web crawlers
- Canonical URL generation for SEO
- Link comparison and matching
- Database indexing of URLs
- Analytics tracking consistency

## Example with AI Agent

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { urlNormalizeTool } from '@tpmjs/tools-url-normalize';

const result = await generateText({
  model: openai('gpt-4'),
  tools: {
    urlNormalize: urlNormalizeTool,
  },
  prompt: 'Normalize this URL and remove the hash: https://Example.com/PATH/?b=2&a=1#top',
});
```

## License

MIT
