# @tpmjs/tools-rss-read

Parse RSS/Atom feeds and extract feed metadata and items.

## Installation

```bash
npm install @tpmjs/tools-rss-read
```

## Usage

```typescript
import { rssReadTool } from '@tpmjs/tools-rss-read';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: { rssReadTool },
  prompt: 'Get the latest articles from https://example.com/feed.xml',
});
```

## Tool Parameters

- `url` (string, required): The RSS or Atom feed URL to parse
- `limit` (number, optional): Maximum number of items to return (default: 20, max: 100)

## Returns

```typescript
{
  feed: {
    title: string;
    link: string;
    description?: string;
    language?: string;
    lastBuildDate?: string;
    imageUrl?: string;
  };
  items: Array<{
    title: string;
    link: string;
    description?: string;
    pubDate?: string;
    author?: string;
    categories?: string[];
    guid?: string;
  }>;
  itemCount: number;
  metadata: {
    fetchedAt: string;
    feedType: string;
    totalItems: number;
    limitApplied: boolean;
  };
}
```

## Features

- Supports both RSS 2.0 and Atom feeds
- Extracts feed metadata (title, description, image)
- Extracts item details (title, link, description, date, author, categories)
- Configurable item limit
- Comprehensive error handling
- Sanitizes HTML content to plain text
- 30-second timeout protection

## Requirements

- Node.js 18+ (uses native fetch API)

## License

MIT
