# @tpmjs/tools-links-catalog

Extract and categorize all links from web pages into internal, external, and anchor links.

## Installation

```bash
npm install @tpmjs/tools-links-catalog
```

## Usage

```typescript
import { linksCatalogTool } from '@tpmjs/tools-links-catalog';

const result = await linksCatalogTool.execute({
  url: 'https://example.com'
});

console.log(result);
// {
//   url: 'https://example.com',
//   internal: [
//     { href: 'https://example.com/about', text: 'About Us' },
//     { href: 'https://example.com/contact', text: 'Contact' }
//   ],
//   external: [
//     { href: 'https://twitter.com/example', text: 'Follow us' }
//   ],
//   anchors: [
//     { href: '#top', text: 'Back to top' }
//   ],
//   total: 4,
//   metadata: {
//     fetchedAt: '2025-12-31T12:00:00.000Z',
//     domain: 'example.com'
//   }
// }
```

## Features

- **Automatic Categorization**: Links are grouped into three categories
  - **Internal**: Links to the same domain
  - **External**: Links to different domains
  - **Anchors**: Same-page navigation links (fragments)

- **Link Deduplication**: Automatically removes duplicate links
- **URL Normalization**: Resolves relative URLs to absolute URLs
- **Metadata Extraction**: Captures link text and title attributes
- **Smart Filtering**: Excludes mailto:, tel:, javascript:, and data: URIs
- **Comprehensive Error Handling**: Detailed error messages for network issues

## API

### Input

```typescript
{
  url: string; // The URL to fetch and extract links from
}
```

### Output

```typescript
{
  url: string;               // The fetched URL
  internal: Link[];          // Links to the same domain
  external: Link[];          // Links to different domains
  anchors: Link[];           // Same-page anchor links
  total: number;             // Total number of links
  metadata: {
    fetchedAt: string;       // ISO timestamp of fetch
    domain: string;          // Domain name extracted from URL
  };
}

interface Link {
  href: string;              // Absolute URL
  text: string;              // Visible link text
  title?: string;            // Optional title attribute
}
```

## Use Cases

1. **SEO Auditing**: Analyze internal linking structure
2. **Broken Link Detection**: Identify all links for validation
3. **Competitor Analysis**: See what external sites are linked to
4. **Site Mapping**: Build a map of internal pages
5. **Link Equity Analysis**: Understand how link juice flows
6. **External Dependencies**: Track third-party integrations
7. **Navigation Analysis**: Study site navigation patterns

## Example: SEO Link Analysis

```typescript
const result = await linksCatalogTool.execute({
  url: 'https://blog.example.com/post'
});

console.log(`Total links: ${result.total}`);
console.log(`Internal links: ${result.internal.length}`);
console.log(`External links: ${result.external.length}`);
console.log(`Anchor links: ${result.anchors.length}`);

// Find all links to a specific domain
const twitterLinks = result.external.filter(link =>
  link.href.includes('twitter.com')
);

// Find all internal blog posts
const blogPosts = result.internal.filter(link =>
  link.href.includes('/blog/')
);

// Check for navigation links
const hasNavigation = result.internal.some(link =>
  link.text.toLowerCase().includes('home') ||
  link.text.toLowerCase().includes('about')
);
```

## Link Categories Explained

### Internal Links
Links that point to the same domain as the source page:
- `https://example.com/about` (from https://example.com)
- `/products` (relative URL on same domain)
- `./services` (relative URL on same domain)

### External Links
Links that point to a different domain:
- `https://twitter.com/example` (social media)
- `https://partner-site.com` (partner website)
- `https://cdn.example.com` (different subdomain)

### Anchor Links
Links that navigate within the same page:
- `#top` (jump to top)
- `#section-2` (jump to section)
- `#footer` (jump to footer)

Note: Subdomains are treated as different domains (e.g., `blog.example.com` vs `example.com`).

## Filtering Behavior

The tool automatically filters out non-navigational links:
- `mailto:` links (email addresses)
- `tel:` links (phone numbers)
- `javascript:` links (JavaScript actions)
- `data:` links (data URIs)
- Empty or invalid hrefs

## Error Handling

The tool provides detailed error messages for common issues:

- **Invalid URL**: URL format is incorrect
- **Network Errors**: DNS failures, connection refused, timeouts
- **SSL Errors**: Invalid certificates
- **Content Type Errors**: Non-HTML responses
- **Empty Responses**: Server returns empty content

All errors include specific details to help diagnose the problem.

## Performance Considerations

- Large pages with thousands of links may take a few seconds to process
- Links are deduplicated to reduce output size
- Link text is truncated to 200 characters to prevent excessive data
- The tool uses a 30-second timeout for fetching pages

## Requirements

- Node.js 18+ (uses native `fetch` API)
- Works with both ESM and CommonJS projects

## Related Tools

- `@tpmjs/tools-page-brief` - Extract main content and create summaries
- `@tpmjs/tools-extract-json-ld` - Extract JSON-LD structured data
- `@tpmjs/tools-table-extract` - Extract HTML tables as structured data

## License

MIT
