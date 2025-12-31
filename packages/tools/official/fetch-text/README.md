# @tpmjs/tools-fetch-text

Fetch a URL and return plain text content with metadata.

## Installation

```bash
npm install @tpmjs/tools-fetch-text
```

## Usage

```typescript
import { fetchTextTool } from '@tpmjs/tools-fetch-text';

// Use with AI SDK
const result = await fetchTextTool.execute({
  url: 'https://example.com',
});

console.log(result.text); // Plain text content
console.log(result.contentType); // 'text/html; charset=utf-8'
console.log(result.contentLength); // 12345
console.log(result.metadata); // { fetchedAt, statusCode, redirected, finalUrl }
```

## Features

- Fetches any URL and returns plain text
- Automatically strips HTML tags from HTML content
- Decodes common HTML entities
- 30 second timeout for requests
- Returns metadata including content type, length, status code
- Tracks redirects and provides final URL
- Comprehensive error handling

## Input

- `url` (string, required): The URL to fetch (must be http or https)

## Output

Returns a `FetchTextResult` object:

```typescript
{
  text: string;           // Plain text content (HTML stripped if applicable)
  url: string;            // Original URL
  contentLength: number;  // Length of raw content in bytes
  contentType: string;    // Content-Type header value
  metadata: {
    fetchedAt: string;    // ISO timestamp of when content was fetched
    statusCode: number;   // HTTP status code
    redirected: boolean;  // Whether the request was redirected
    finalUrl: string;     // Final URL after redirects
  };
}
```

## Requirements

- Node.js 18+ (uses native fetch API)

## License

MIT
