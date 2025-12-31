# @tpmjs/tools-markdown-to-html

Convert markdown to HTML using [marked](https://github.com/markedjs/marked).

## Installation

```bash
npm install @tpmjs/tools-markdown-to-html
# or
pnpm add @tpmjs/tools-markdown-to-html
# or
yarn add @tpmjs/tools-markdown-to-html
```

## Usage

### With Vercel AI SDK

```typescript
import { markdownToHtmlTool } from '@tpmjs/tools-markdown-to-html';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    markdownToHtml: markdownToHtmlTool,
  },
  prompt: 'Convert this markdown to HTML',
});
```

### Direct Usage

```typescript
import { markdownToHtmlTool } from '@tpmjs/tools-markdown-to-html';

const result = await markdownToHtmlTool.execute({
  markdown: '# Hello World\n\nThis is **bold** text.',
});

console.log(result.html);
// <h1>Hello World</h1>
// <p>This is <strong>bold</strong> text.</p>

console.log(result.headings);
// [{ level: 1, text: 'Hello World' }]
```

## Features

- **GitHub Flavored Markdown** - Support for tables, task lists, strikethrough
- **Heading Extraction** - Automatically extracts all headings for TOC generation
- **Optional Sanitization** - Remove potentially dangerous HTML
- **Standards Compliant** - Follows CommonMark specification
- **Fast** - Built on the performant marked library

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `markdown` | `string` | Yes | The markdown string to convert |
| `options` | `ConversionOptions` | No | Configuration options |

### ConversionOptions

```typescript
{
  gfm?: boolean;       // Enable GitHub Flavored Markdown (default: true)
  sanitize?: boolean;  // Sanitize HTML output (default: false)
}
```

## Returns

```typescript
{
  html: string;                          // The generated HTML
  headings: HeadingInfo[];              // Extracted headings
}

interface HeadingInfo {
  level: number;   // Heading level (1-6)
  text: string;    // Heading text content
}
```

## Examples

### Basic Conversion

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: '# Title\n\nParagraph with **bold** and *italic*.',
});

console.log(result.html);
// <h1>Title</h1>
// <p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>
```

### Convert Links

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: '[Click here](https://example.com) for more info.',
});

console.log(result.html);
// <p><a href="https://example.com">Click here</a> for more info.</p>
```

### Convert Lists

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: `
- First item
- Second item
- Third item
  `,
});

console.log(result.html);
// <ul>
// <li>First item</li>
// <li>Second item</li>
// <li>Third item</li>
// </ul>
```

### Convert Code Blocks

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: '```javascript\nconst x = 42;\n```',
});

console.log(result.html);
// <pre><code class="language-javascript">const x = 42;
// </code></pre>
```

### Convert Tables (GFM)

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: `
| Name  | Age |
| ----- | --- |
| Alice | 25  |
| Bob   | 30  |
  `,
  options: { gfm: true },
});

console.log(result.html);
// <table>
// <thead>
// <tr><th>Name</th><th>Age</th></tr>
// </thead>
// <tbody>
// <tr><td>Alice</td><td>25</td></tr>
// <tr><td>Bob</td><td>30</td></tr>
// </tbody>
// </table>
```

### Task Lists (GFM)

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: `
- [x] Completed task
- [ ] Pending task
  `,
  options: { gfm: true },
});

console.log(result.html);
// <ul>
// <li><input checked="" disabled="" type="checkbox"> Completed task</li>
// <li><input disabled="" type="checkbox"> Pending task</li>
// </ul>
```

### Strikethrough (GFM)

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: '~~This text is crossed out~~',
  options: { gfm: true },
});

console.log(result.html);
// <p><del>This text is crossed out</del></p>
```

### Extract Headings

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: `
# Main Title
## Section 1
### Subsection 1.1
## Section 2
  `,
});

console.log(result.headings);
// [
//   { level: 1, text: 'Main Title' },
//   { level: 2, text: 'Section 1' },
//   { level: 3, text: 'Subsection 1.1' },
//   { level: 2, text: 'Section 2' }
// ]
```

### Generate Table of Contents

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: '# Title\n## Section 1\n## Section 2',
});

const toc = result.headings
  .map(h => `${'  '.repeat(h.level - 1)}- ${h.text}`)
  .join('\n');

console.log(toc);
// - Title
//   - Section 1
//   - Section 2
```

### With Sanitization

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: 'Click [here](javascript:alert(1)) for info.',
  options: { sanitize: true },
});

console.log(result.html);
// <p>Click <a href=":alert(1)">here</a> for info.</p>
// (javascript: protocol removed)
```

### Blockquotes

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: '> This is a quote\n> spanning multiple lines',
});

console.log(result.html);
// <blockquote>
// <p>This is a quote
// spanning multiple lines</p>
// </blockquote>
```

### Images

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: '![Alt text](image.jpg "Image title")',
});

console.log(result.html);
// <p><img src="image.jpg" alt="Alt text" title="Image title"></p>
```

### Horizontal Rules

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: 'Above\n\n---\n\nBelow',
});

console.log(result.html);
// <p>Above</p>
// <hr>
// <p>Below</p>
```

### Nested Lists

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: `
- Item 1
  - Nested 1.1
  - Nested 1.2
- Item 2
  `,
});

console.log(result.html);
// <ul>
// <li>Item 1
// <ul>
// <li>Nested 1.1</li>
// <li>Nested 1.2</li>
// </ul>
// </li>
// <li>Item 2</li>
// </ul>
```

### Inline HTML

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: 'Text with <span style="color: red">colored text</span>.',
});

console.log(result.html);
// <p>Text with <span style="color: red">colored text</span>.</p>
```

## Supported Markdown Features

| Feature | Syntax | Output |
|---------|--------|--------|
| Headings | `# H1` to `###### H6` | `<h1>` to `<h6>` |
| Bold | `**bold**` | `<strong>bold</strong>` |
| Italic | `*italic*` | `<em>italic</em>` |
| Links | `[text](url)` | `<a href="url">text</a>` |
| Images | `![alt](src)` | `<img src="src" alt="alt">` |
| Code | `` `code` `` | `<code>code</code>` |
| Code Block | ` ```lang\ncode\n``` ` | `<pre><code>` |
| Lists | `- item` or `1. item` | `<ul>/<ol>` |
| Blockquotes | `> quote` | `<blockquote>` |
| HR | `---` | `<hr>` |
| Tables | `\| cell \|` | `<table>` (GFM) |
| Strikethrough | `~~text~~` | `<del>text</del>` (GFM) |
| Task Lists | `- [ ] task` | Checkboxes (GFM) |

## GitHub Flavored Markdown (GFM)

When `gfm: true` (default), these features are enabled:

- **Tables** - Pipe-separated tables with alignment
- **Task Lists** - Checkboxes with `- [ ]` and `- [x]`
- **Strikethrough** - Text with `~~strikethrough~~`
- **Autolinks** - URLs become clickable automatically
- **Line Breaks** - Single newlines create `<br>` tags

To disable GFM:

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: '~~strikethrough~~',
  options: { gfm: false },
});
// GFM features won't work
```

## Sanitization

The `sanitize` option provides basic XSS protection:

- Removes `<script>` tags
- Removes inline event handlers (`onclick`, etc.)
- Removes `javascript:` protocol

```typescript
const result = await markdownToHtmlTool.execute({
  markdown: '[Link](javascript:alert(1))',
  options: { sanitize: true },
});
// javascript: removed from href
```

**Note:** For comprehensive sanitization, use `@tpmjs/tools-html-sanitize` after conversion.

## Error Handling

```typescript
try {
  const result = await markdownToHtmlTool.execute({
    markdown: null,  // Invalid input
  });
} catch (error) {
  console.error(error.message);
  // "Markdown input must be a string"
}
```

## Common Use Cases

### Blog Post Rendering

```typescript
const blogMarkdown = await fetchBlogPost();
const result = await markdownToHtmlTool.execute({
  markdown: blogMarkdown,
  options: { gfm: true },
});
// Render result.html in your template
```

### Documentation Site

```typescript
const docMarkdown = fs.readFileSync('README.md', 'utf-8');
const result = await markdownToHtmlTool.execute({ markdown: docMarkdown });

// Use headings for navigation
const nav = result.headings.map(h => ({
  level: h.level,
  text: h.text,
  id: h.text.toLowerCase().replace(/\s+/g, '-'),
}));
```

### Email Templates

```typescript
const emailMarkdown = '# Welcome!\n\nThanks for signing up, **{{name}}**.';
const result = await markdownToHtmlTool.execute({
  markdown: emailMarkdown,
  options: { sanitize: true },
});
// Use result.html in email template
```

### Static Site Generation

```typescript
const pages = await glob('content/**/*.md');
for (const page of pages) {
  const markdown = await fs.readFile(page, 'utf-8');
  const result = await markdownToHtmlTool.execute({ markdown });
  // Generate HTML page from result
}
```

## Best Practices

1. **Enable GFM** - Keep `gfm: true` for modern markdown features
2. **Extract Headings** - Use for navigation, TOC, or SEO
3. **Sanitize Untrusted Content** - Use `sanitize: true` or dedicated sanitizer
4. **Handle Errors** - Wrap in try-catch for production
5. **Cache Results** - Markdown conversion is fast but cache for performance

## Limitations

- Sanitization is basic - use dedicated tool for comprehensive XSS protection
- Does not validate markdown syntax errors (converts as-is)
- Custom markdown extensions not supported
- Math/LaTeX rendering requires additional plugins

## License

MIT
