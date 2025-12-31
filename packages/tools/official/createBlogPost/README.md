# @tpmjs/createblogpost

A tool for creating structured blog posts with frontmatter and metadata. Part of the TPMJS registry.

## Installation

```bash
npm install @tpmjs/createblogpost
# or
pnpm add @tpmjs/createblogpost
# or
yarn add @tpmjs/createblogpost
```

## Usage

```typescript
import { createBlogPost } from '@tpmjs/createblogpost';

const post = await createBlogPost({
  title: 'Getting Started with TypeScript',
  author: 'John Doe',
  content: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript...',
  tags: ['typescript', 'javascript', 'programming'],
  excerpt: 'Learn the basics of TypeScript in this comprehensive guide',
  format: 'markdown',
});

console.log(post.formattedOutput);
```

## API

### `createBlogPost(options: BlogPostOptions): Promise<BlogPost>`

Creates a structured blog post with frontmatter and metadata.

#### Options

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | `string` | Yes | - | The title of the blog post |
| `author` | `string` | Yes | - | The author of the blog post |
| `content` | `string` | Yes | - | The main content of the blog post |
| `tags` | `string[]` | No | `[]` | Array of tags for categorization |
| `format` | `'markdown' \| 'mdx'` | No | `'markdown'` | Output format for the blog post |
| `excerpt` | `string` | No | - | Short excerpt or summary of the post |
| `publishDate` | `Date` | No | `new Date()` | Publication date |

#### Returns

Returns a `BlogPost` object with the following structure:

```typescript
{
  frontmatter: {
    title: string;
    author: string;
    date: string;        // ISO date format (YYYY-MM-DD)
    tags: string[];
    slug: string;        // Auto-generated from title
    wordCount: number;   // Calculated from content
    readingTime: number; // Estimated minutes to read
    excerpt?: string;
  };
  content: string;
  formattedOutput: string; // Complete post with frontmatter
}
```

## Example Output

```markdown
---
title: "Getting Started with TypeScript"
author: John Doe
date: 2025-11-28
slug: getting-started-with-typescript
tags: ["typescript", "javascript", "programming"]
excerpt: "Learn the basics of TypeScript in this comprehensive guide"
wordCount: 250
readingTime: 2
---

TypeScript is a typed superset of JavaScript that compiles to plain JavaScript...
```

## Features

- Automatic slug generation from title
- Word count calculation
- Reading time estimation (200 words/min)
- Support for both Markdown and MDX formats
- Customizable frontmatter
- SEO-friendly metadata

## Use Cases

- Static site generators (Next.js, Gatsby, Astro)
- Content management systems
- Blog platforms
- Documentation sites
- Automated content generation

## License

MIT
