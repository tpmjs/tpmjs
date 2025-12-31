# @tpmjs/tools-redirect-trace

Trace all HTTP redirects from a URL to its final destination.

## Installation

```bash
npm install @tpmjs/tools-redirect-trace
```

## Usage

```typescript
import { redirectTraceTool } from '@tpmjs/tools-redirect-trace';

// Use with AI SDK
const result = await redirectTraceTool.execute({
  url: 'https://bit.ly/example',
  maxRedirects: 10,
});

console.log(result.steps); // Array of redirect steps
console.log(result.finalUrl); // 'https://example.com/final-page'
console.log(result.redirectCount); // 2
console.log(result.statusCodes); // [301, 302, 200]
```

## Features

- Traces complete redirect chains from start to finish
- Captures status codes, headers, and location for each step
- Handles relative and absolute redirect URLs
- 10 second timeout per request
- Configurable max redirects (default: 10, max: 50)
- Detects redirect loops and max redirect limits
- Comprehensive error handling

## Input

- `url` (string, required): The URL to trace (must be http or https)
- `maxRedirects` (number, optional): Maximum number of redirects to follow (default: 10, max: 50)

## Output

Returns a `RedirectTraceResult` object:

```typescript
{
  steps: RedirectStep[];      // Array of redirect steps
  finalUrl: string;           // Final URL after all redirects
  statusCodes: number[];      // Array of status codes
  redirectCount: number;      // Number of redirects (steps - 1)
  totalTimeMs: number;        // Total time to trace all redirects
  metadata: {
    startUrl: string;         // Original URL
    tracedAt: string;         // ISO timestamp
    maxRedirectsReached: boolean; // Whether max redirects limit was hit
  };
}
```

Each `RedirectStep` contains:

```typescript
{
  url: string;                // The URL at this step
  statusCode: number;         // HTTP status code
  statusText: string;         // HTTP status text
  location: string | null;    // Location header (next URL)
  headers: Record<string, string>; // Important response headers
}
```

## Use Cases

- Debug redirect chains
- Analyze URL shorteners
- Verify redirect configurations
- Track redirect performance
- Detect redirect loops
- Understand redirect paths

## Requirements

- Node.js 18+ (uses native fetch API)

## License

MIT
