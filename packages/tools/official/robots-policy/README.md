# @tpmjs/tools-robots-policy

Parse robots.txt files and check if URLs are allowed for crawling.

## Installation

```bash
npm install @tpmjs/tools-robots-policy
```

## Usage

```typescript
import { robotsPolicyTool } from '@tpmjs/tools-robots-policy';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: { robotsPolicyTool },
  prompt: 'Check if https://example.com/admin is allowed to be crawled',
});
```

## Tool Parameters

- `robotsUrl` (string, required): The robots.txt URL to parse (e.g., `https://example.com/robots.txt`)
- `testUrl` (string, required): The full URL to test for crawl permission
- `userAgent` (string, optional): The user agent to check (default: `"*"` for all bots)

## Returns

```typescript
{
  allowed: boolean;
  userAgent: string;
  testUrl: string;
  matchedRule?: {
    directive: 'allow' | 'disallow';
    path: string;
  };
  rules: Array<{
    userAgent: string;
    rules: Array<{
      directive: 'allow' | 'disallow';
      path: string;
    }>;
    crawlDelay?: number;
    sitemaps?: string[];
  }>;
  crawlDelay?: number;
  sitemaps: string[];
  metadata: {
    fetchedAt: string;
    robotsUrl: string;
    hasRules: boolean;
  };
}
```

## Features

- Parses robots.txt files according to the robots exclusion standard
- Checks if specific URLs are allowed for crawling
- Supports user-agent specific rules
- Extracts crawl-delay directives
- Extracts sitemap URLs
- Handles wildcards (`*`) and end-of-URL markers (`$`)
- Returns the most specific matching rule
- 30-second timeout protection
- Handles missing robots.txt (treats as "allow all")

## Pattern Matching

The tool supports standard robots.txt patterns:

- `*` - Matches any sequence of characters
- `$` - Matches the end of the URL
- Patterns are case-sensitive for paths

### Examples

```
Disallow: /admin          # Blocks /admin and /admin/*
Disallow: /admin/         # Blocks /admin/* but not /admin
Disallow: /*.pdf$         # Blocks all PDF files
Disallow: /private*.html  # Blocks files starting with "private" and ending in .html
Allow: /public            # Explicitly allows /public and /public/*
```

## User Agents

Common user agent strings:
- `*` - All robots (default)
- `googlebot` - Google's crawler
- `bingbot` - Bing's crawler
- `slurp` - Yahoo's crawler
- Custom user agents for specific bots

The tool matches user agents case-insensitively and uses the most specific rule available (exact match > wildcard).

## Requirements

- Node.js 18+ (uses native fetch API)

## License

MIT
