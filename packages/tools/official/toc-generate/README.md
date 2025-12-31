# @tpmjs/tools-toc-generate

Generate table of contents from markdown headings.

## Features

- Parses ATX-style markdown headings (`#`, `##`, `###`, etc.)
- Generates formatted TOC with anchor links
- Configurable maximum depth (default: 3)
- Handles duplicate headings with unique slugs
- Returns structured heading data with line numbers

## Installation

```bash
npm install @tpmjs/tools-toc-generate
```

## Usage

```typescript
import { tocGenerateTool } from '@tpmjs/tools-toc-generate';

const result = await tocGenerateTool.execute({
  markdown: `
# Introduction
## Overview
## Getting Started
### Installation
### Configuration
# Advanced Topics
## API Reference
`,
  maxDepth: 3, // Optional, default is 3
});

console.log(result.toc);
// Output:
// - [Introduction](#introduction)
//   - [Overview](#overview)
//   - [Getting Started](#getting-started)
//     - [Installation](#installation)
//     - [Configuration](#configuration)
// - [Advanced Topics](#advanced-topics)
//   - [API Reference](#api-reference)

console.log(result.headings);
// [
//   { level: 1, text: 'Introduction', slug: 'introduction', line: 2 },
//   { level: 2, text: 'Overview', slug: 'overview', line: 3 },
//   ...
// ]

console.log(result.depth);
// { min: 1, max: 3, included: 7 }
```

## API

### `tocGenerateTool.execute(input)`

#### Input

- `markdown` (string, required): The markdown content to parse
- `maxDepth` (number, optional): Maximum heading depth to include (1-6, default: 3)

#### Output

Returns a `TocResult` object:

```typescript
interface TocResult {
  toc: string;              // Formatted TOC markdown
  headings: Heading[];      // Array of parsed headings
  depth: {
    min: number;            // Minimum heading level found
    max: number;            // Maximum heading level found
    included: number;       // Number of headings included in TOC
  };
}

interface Heading {
  level: number;            // Heading level (1-6)
  text: string;             // Heading text
  slug: string;             // URL-safe slug
  line: number;             // Line number in source
}
```

## Examples

### Basic TOC

```typescript
const result = await tocGenerateTool.execute({
  markdown: '# Title\n## Section 1\n## Section 2',
});

console.log(result.toc);
// - [Title](#title)
//   - [Section 1](#section-1)
//   - [Section 2](#section-2)
```

### Limit Depth

```typescript
const result = await tocGenerateTool.execute({
  markdown: '# Title\n## Section\n### Subsection\n#### Details',
  maxDepth: 2, // Only include h1 and h2
});

console.log(result.toc);
// - [Title](#title)
//   - [Section](#section)
```

### Custom Anchor IDs

```typescript
const result = await tocGenerateTool.execute({
  markdown: '# Introduction {#intro}\n## Overview {#overview}',
});

console.log(result.toc);
// - [Introduction](#intro)
//   - [Overview](#overview)
```

## Use Cases

- Generate navigation for long markdown documents
- Create automatic table of contents for READMEs
- Extract document structure for analysis
- Build documentation site navigation

## License

MIT
