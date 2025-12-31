# @tpmjs/tools-url-parse

Parse URLs into components using the [Web URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL).

## Installation

```bash
npm install @tpmjs/tools-url-parse
# or
pnpm add @tpmjs/tools-url-parse
# or
yarn add @tpmjs/tools-url-parse
```

## Usage

### With Vercel AI SDK

```typescript
import { urlParseTool } from '@tpmjs/tools-url-parse';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    urlParse: urlParseTool,
  },
  prompt: 'Parse this URL and tell me the domain',
});
```

### Direct Usage

```typescript
import { urlParseTool } from '@tpmjs/tools-url-parse';

const result = await urlParseTool.execute({
  url: 'https://example.com:8080/path/to/page?key=value&foo=bar#section',
});

console.log(result);
// {
//   protocol: 'https:',
//   hostname: 'example.com',
//   port: '8080',
//   pathname: '/path/to/page',
//   search: '?key=value&foo=bar',
//   hash: '#section',
//   origin: 'https://example.com:8080',
//   searchParams: { key: 'value', foo: 'bar' }
// }
```

## Features

- **Complete URL Parsing** - Extracts all URL components
- **Search Parameters** - Converts query string to key-value object
- **Standards Compliant** - Uses Web URL API (WHATWG URL Standard)
- **Error Handling** - Clear error messages for invalid URLs
- **Type Safe** - Full TypeScript type definitions

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | Yes | The URL string to parse |

## Returns

```typescript
{
  protocol: string;                    // e.g., 'https:'
  hostname: string;                    // e.g., 'example.com'
  port: string;                        // e.g., '8080' (empty if default)
  pathname: string;                    // e.g., '/path/to/page'
  search: string;                      // e.g., '?key=value&foo=bar'
  hash: string;                        // e.g., '#section'
  origin: string;                      // e.g., 'https://example.com:8080'
  searchParams: Record<string, string>; // e.g., { key: 'value', foo: 'bar' }
}
```

## Examples

### Parse HTTPS URL

```typescript
const result = await urlParseTool.execute({
  url: 'https://www.example.com/page',
});

console.log(result.protocol); // 'https:'
console.log(result.hostname); // 'www.example.com'
console.log(result.pathname); // '/page'
```

### Parse with Port

```typescript
const result = await urlParseTool.execute({
  url: 'http://localhost:3000/api/users',
});

console.log(result.hostname); // 'localhost'
console.log(result.port);     // '3000'
console.log(result.pathname); // '/api/users'
```

### Parse Query Parameters

```typescript
const result = await urlParseTool.execute({
  url: 'https://search.example.com/?q=hello&lang=en&limit=10',
});

console.log(result.search); // '?q=hello&lang=en&limit=10'
console.log(result.searchParams);
// { q: 'hello', lang: 'en', limit: '10' }
```

### Parse Hash Fragment

```typescript
const result = await urlParseTool.execute({
  url: 'https://docs.example.com/guide#installation',
});

console.log(result.hash); // '#installation'
```

### Parse Complete URL

```typescript
const result = await urlParseTool.execute({
  url: 'https://user:pass@api.example.com:8443/v1/users?active=true&limit=50#results',
});

console.log(result);
// {
//   protocol: 'https:',
//   hostname: 'api.example.com',
//   port: '8443',
//   pathname: '/v1/users',
//   search: '?active=true&limit=50',
//   hash: '#results',
//   origin: 'https://api.example.com:8443',
//   searchParams: { active: 'true', limit: '50' }
// }
```

### Parse Relative URL (with Base)

```typescript
// Note: Relative URLs need a base URL
const result = await urlParseTool.execute({
  url: new URL('/api/data', 'https://example.com').href,
});

console.log(result.pathname); // '/api/data'
console.log(result.hostname); // 'example.com'
```

### Extract Domain from URL

```typescript
const result = await urlParseTool.execute({
  url: 'https://subdomain.example.com/path',
});

console.log(result.hostname); // 'subdomain.example.com'
console.log(result.origin);   // 'https://subdomain.example.com'
```

### Check if HTTPS

```typescript
const result = await urlParseTool.execute({
  url: 'https://secure.example.com',
});

const isSecure = result.protocol === 'https:';
console.log(isSecure); // true
```

### Parse File URL

```typescript
const result = await urlParseTool.execute({
  url: 'file:///Users/name/document.pdf',
});

console.log(result.protocol); // 'file:'
console.log(result.pathname); // '/Users/name/document.pdf'
```

### Parse FTP URL

```typescript
const result = await urlParseTool.execute({
  url: 'ftp://ftp.example.com/files/archive.zip',
});

console.log(result.protocol); // 'ftp:'
console.log(result.hostname); // 'ftp.example.com'
console.log(result.pathname); // '/files/archive.zip'
```

### Extract Search Parameter

```typescript
const result = await urlParseTool.execute({
  url: 'https://shop.example.com/products?category=electronics&sort=price',
});

console.log(result.searchParams.category); // 'electronics'
console.log(result.searchParams.sort);     // 'price'
```

### Handle Empty Port (Default)

```typescript
const result = await urlParseTool.execute({
  url: 'https://example.com/page',
});

console.log(result.port); // '' (empty string, default HTTPS port 443)
```

### Parse URL with Special Characters

```typescript
const result = await urlParseTool.execute({
  url: 'https://example.com/search?q=hello%20world&tags=foo%2Cbar',
});

console.log(result.searchParams.q);    // 'hello world' (decoded)
console.log(result.searchParams.tags); // 'foo,bar' (decoded)
```

### Parse Data URL

```typescript
const result = await urlParseTool.execute({
  url: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
});

console.log(result.protocol); // 'data:'
console.log(result.pathname); // 'text/plain;base64,SGVsbG8gV29ybGQ='
```

### Parse WebSocket URL

```typescript
const result = await urlParseTool.execute({
  url: 'wss://api.example.com/socket',
});

console.log(result.protocol); // 'wss:'
console.log(result.hostname); // 'api.example.com'
```

## URL Components Explained

| Component | Description | Example |
|-----------|-------------|---------|
| `protocol` | URL scheme with colon | `https:`, `http:`, `ftp:` |
| `hostname` | Domain name or IP address | `example.com`, `192.168.1.1` |
| `port` | Port number (empty if default) | `8080`, `3000`, `''` |
| `pathname` | Path part of URL | `/path/to/page`, `/` |
| `search` | Query string with `?` | `?key=value&foo=bar` |
| `hash` | Fragment identifier with `#` | `#section`, `#top` |
| `origin` | Protocol + hostname + port | `https://example.com:8080` |
| `searchParams` | Query params as object | `{ key: 'value' }` |

## Common Use Cases

### Validate URL Protocol

```typescript
const result = await urlParseTool.execute({ url: userInputUrl });

if (result.protocol !== 'https:') {
  console.warn('URL is not using HTTPS');
}
```

### Extract API Endpoint

```typescript
const result = await urlParseTool.execute({
  url: 'https://api.example.com/v2/users/123',
});

const apiBase = result.origin; // 'https://api.example.com'
const endpoint = result.pathname; // '/v2/users/123'
```

### Parse Pagination Parameters

```typescript
const result = await urlParseTool.execute({
  url: 'https://example.com/items?page=2&limit=20',
});

const page = parseInt(result.searchParams.page);   // 2
const limit = parseInt(result.searchParams.limit); // 20
```

### Build URL from Components

```typescript
const result = await urlParseTool.execute({ url: originalUrl });

// Modify components
const newUrl = `${result.protocol}//${result.hostname}/new-path${result.search}`;
```

### Check Same Origin

```typescript
const url1 = await urlParseTool.execute({ url: 'https://example.com/page1' });
const url2 = await urlParseTool.execute({ url: 'https://example.com/page2' });

const sameOrigin = url1.origin === url2.origin; // true
```

## Error Handling

### Invalid URL

```typescript
try {
  const result = await urlParseTool.execute({
    url: 'not a valid url',
  });
} catch (error) {
  console.error(error.message);
  // "Invalid URL: Invalid URL"
}
```

### Empty URL

```typescript
try {
  const result = await urlParseTool.execute({
    url: '',
  });
} catch (error) {
  console.error(error.message);
  // "URL input cannot be empty"
}
```

### Invalid Type

```typescript
try {
  const result = await urlParseTool.execute({
    url: null,
  });
} catch (error) {
  console.error(error.message);
  // "URL input must be a string"
}
```

## Best Practices

1. **Validate Input** - Always wrap in try-catch for user input
2. **Check Protocol** - Verify `https:` for security-sensitive operations
3. **Handle Missing Components** - Check if `port`, `search`, or `hash` are empty
4. **Decode Parameters** - `searchParams` are automatically URL-decoded
5. **Use Origin** - For CORS and same-origin checks

## Limitations

- Relative URLs must be converted to absolute first (using `new URL(relative, base)`)
- Search parameters with duplicate keys only return the last value
- Does not validate if the URL is reachable or exists
- Username and password in URLs are not exposed (security feature)

## Security Notes

- User credentials (`username:password`) in URLs are not returned
- Always validate URLs from untrusted sources
- Be cautious with `javascript:` and `data:` protocols
- Use `@tpmjs/tools-url-risk-heuristic` for URL safety checks

## License

MIT
