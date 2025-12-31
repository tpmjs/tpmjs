# @tpmjs/tools-extract-json-ld

Extract JSON-LD structured data from web pages.

## Installation

```bash
npm install @tpmjs/tools-extract-json-ld
```

## Usage

```typescript
import { extractJsonLdTool } from '@tpmjs/tools-extract-json-ld';

const result = await extractJsonLdTool.execute({
  url: 'https://example.com'
});

console.log(result);
// {
//   url: 'https://example.com',
//   jsonLd: [{ @type: 'Organization', name: 'Example', ... }],
//   types: ['Organization'],
//   count: 1,
//   metadata: {
//     fetchedAt: '2025-12-31T12:00:00.000Z',
//     domain: 'example.com'
//   }
// }
```

## What is JSON-LD?

JSON-LD (JavaScript Object Notation for Linked Data) is a structured data format used by websites to provide machine-readable metadata about their content. It's commonly used for:

- **SEO**: Helping search engines understand page content
- **Rich Results**: Enabling special search result features (reviews, recipes, events, etc.)
- **Knowledge Graphs**: Building connections between entities
- **Schema.org**: Implementing standardized vocabularies

## Features

- Extracts all `<script type="application/ld+json">` tags from a web page
- Parses and validates JSON-LD data
- Extracts all `@type` schema types found in the data
- Returns structured, type-safe output
- Handles both single objects and arrays of JSON-LD data
- Comprehensive error handling with detailed messages

## API

### Input

```typescript
{
  url: string; // The URL to fetch and extract JSON-LD from
}
```

### Output

```typescript
{
  url: string;                        // The fetched URL
  jsonLd: Array<Record<string, unknown>>; // Array of JSON-LD objects
  types: string[];                    // Array of detected @type values
  count: number;                      // Number of JSON-LD objects found
  metadata: {
    fetchedAt: string;                // ISO timestamp of fetch
    domain: string;                   // Domain name extracted from URL
  };
}
```

## Common Schema Types

The tool automatically extracts `@type` values, which typically include:

- **Article** - News articles, blog posts
- **Organization** - Companies, brands
- **Person** - Individuals
- **Product** - E-commerce products
- **Recipe** - Cooking recipes
- **Event** - Events and happenings
- **Review** - User reviews
- **BreadcrumbList** - Navigation breadcrumbs
- **WebSite** - Website metadata
- **VideoObject** - Videos

## Use Cases

1. **SEO Auditing**: Check if a page has proper structured data
2. **Competitor Analysis**: See what schema types competitors are using
3. **Content Migration**: Extract structured data when moving content
4. **Rich Results Testing**: Validate JSON-LD before submitting to search engines
5. **Metadata Extraction**: Get product info, recipes, events, etc. from pages

## Example: Product Page Analysis

```typescript
const result = await extractJsonLdTool.execute({
  url: 'https://store.example.com/product/widget'
});

console.log(result.types);
// ['Product', 'BreadcrumbList', 'Organization']

const productData = result.jsonLd.find(item => item['@type'] === 'Product');
console.log(productData);
// {
//   @type: 'Product',
//   name: 'Amazing Widget',
//   price: '29.99',
//   availability: 'InStock',
//   ...
// }
```

## Error Handling

The tool provides detailed error messages for common issues:

- **Invalid URL**: URL format is incorrect
- **Network Errors**: DNS failures, connection refused, timeouts
- **SSL Errors**: Invalid certificates
- **Content Type Errors**: Non-HTML responses
- **Empty Responses**: Server returns empty content

All errors include specific details to help diagnose the problem.

## Requirements

- Node.js 18+ (uses native `fetch` API)
- Works with both ESM and CommonJS projects

## Related Tools

- `@tpmjs/tools-page-brief` - Extract main content and create summaries
- `@tpmjs/tools-links-catalog` - Extract and categorize all links
- `@tpmjs/tools-table-extract` - Extract HTML tables as structured data

## License

MIT
