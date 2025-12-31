# @tpmjs/tools-html-to-markdown

Convert HTML to markdown using [turndown](https://github.com/mixmark-io/turndown).

## Installation

```bash
npm install @tpmjs/tools-html-to-markdown
# or
pnpm add @tpmjs/tools-html-to-markdown
# or
yarn add @tpmjs/tools-html-to-markdown
```

## Usage

### With Vercel AI SDK

```typescript
import { htmlToMarkdownTool } from '@tpmjs/tools-html-to-markdown';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    htmlToMarkdown: htmlToMarkdownTool,
  },
  prompt: 'Convert this HTML to markdown',
});
```

### Direct Usage

```typescript
import { htmlToMarkdownTool } from '@tpmjs/tools-html-to-markdown';

const result = await htmlToMarkdownTool.execute({
  html: '<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>',
});

console.log(result.markdown);
// # Hello World
//
// This is a **test**.

console.log(result);
// {
//   markdown: '# Hello World\n\nThis is a **test**.',
//   wordCount: 6
// }
```

## Features

- **Comprehensive Conversion** - Supports headings, lists, links, images, code blocks, tables, and more
- **Customizable Output** - Configure heading style and list markers
- **Word Count** - Automatically counts words in the output
- **Smart Formatting** - Preserves semantic meaning while creating clean markdown
- **Error Handling** - Graceful error messages for invalid HTML

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `html` | `string` | Yes | The HTML string to convert |
| `options` | `ConversionOptions` | No | Formatting options |

### ConversionOptions

```typescript
{
  headingStyle?: 'setext' | 'atx';      // Default: 'atx'
  bulletListMarker?: '-' | '*' | '+';   // Default: '-'
}
```

**Heading Styles:**
- `atx`: Uses `#` prefix (e.g., `# Heading`)
- `setext`: Uses underlines (e.g., `Heading\n=======`)

## Returns

```typescript
{
  markdown: string;    // The converted markdown
  wordCount: number;   // Number of words in the markdown
}
```

## Examples

### Basic Conversion

```typescript
const result = await htmlToMarkdownTool.execute({
  html: '<h1>Title</h1><p>Paragraph text.</p>',
});

console.log(result.markdown);
// # Title
//
// Paragraph text.

console.log(result.wordCount);
// 3
```

### Convert Links

```typescript
const result = await htmlToMarkdownTool.execute({
  html: '<a href="https://example.com">Click here</a> for more info.',
});

console.log(result.markdown);
// [Click here](https://example.com) for more info.
```

### Convert Lists

```typescript
const result = await htmlToMarkdownTool.execute({
  html: `
    <ul>
      <li>First item</li>
      <li>Second item</li>
      <li>Third item</li>
    </ul>
  `,
});

console.log(result.markdown);
// - First item
// - Second item
// - Third item
```

### Custom List Marker

```typescript
const result = await htmlToMarkdownTool.execute({
  html: '<ul><li>Item 1</li><li>Item 2</li></ul>',
  options: {
    bulletListMarker: '*',
  },
});

console.log(result.markdown);
// * Item 1
// * Item 2
```

### Setext Heading Style

```typescript
const result = await htmlToMarkdownTool.execute({
  html: '<h1>Main Title</h1><h2>Subtitle</h2>',
  options: {
    headingStyle: 'setext',
  },
});

console.log(result.markdown);
// Main Title
// ==========
//
// Subtitle
// --------
```

### Convert Tables

```typescript
const result = await htmlToMarkdownTool.execute({
  html: `
    <table>
      <thead>
        <tr><th>Name</th><th>Age</th></tr>
      </thead>
      <tbody>
        <tr><td>Alice</td><td>25</td></tr>
        <tr><td>Bob</td><td>30</td></tr>
      </tbody>
    </table>
  `,
});

console.log(result.markdown);
// | Name | Age |
// | --- | --- |
// | Alice | 25 |
// | Bob | 30 |
```

### Convert Code Blocks

```typescript
const result = await htmlToMarkdownTool.execute({
  html: '<pre><code>function hello() {\n  console.log("Hello");\n}</code></pre>',
});

console.log(result.markdown);
// ```
// function hello() {
//   console.log("Hello");
// }
// ```
```

### Convert Inline Code

```typescript
const result = await htmlToMarkdownTool.execute({
  html: '<p>Use the <code>console.log()</code> function.</p>',
});

console.log(result.markdown);
// Use the `console.log()` function.
```

### Convert Images

```typescript
const result = await htmlToMarkdownTool.execute({
  html: '<img src="photo.jpg" alt="A beautiful sunset">',
});

console.log(result.markdown);
// ![A beautiful sunset](photo.jpg)
```

### Convert Text Formatting

```typescript
const result = await htmlToMarkdownTool.execute({
  html: '<p>This is <strong>bold</strong> and <em>italic</em> text.</p>',
});

console.log(result.markdown);
// This is **bold** and *italic* text.
```

### Convert Blockquotes

```typescript
const result = await htmlToMarkdownTool.execute({
  html: '<blockquote><p>This is a quote.</p></blockquote>',
});

console.log(result.markdown);
// > This is a quote.
```

### Complex HTML

```typescript
const result = await htmlToMarkdownTool.execute({
  html: `
    <article>
      <h1>Blog Post Title</h1>
      <p>Introduction paragraph with <a href="/link">a link</a>.</p>
      <h2>Section 1</h2>
      <ul>
        <li>Point one</li>
        <li>Point two</li>
      </ul>
      <h2>Section 2</h2>
      <p>More content with <strong>bold</strong> and <em>italic</em>.</p>
      <pre><code>const x = 42;</code></pre>
    </article>
  `,
});

console.log(result.markdown);
// # Blog Post Title
//
// Introduction paragraph with [a link](/link).
//
// ## Section 1
//
// - Point one
// - Point two
//
// ## Section 2
//
// More content with **bold** and *italic*.
//
// ```
// const x = 42;
// ```

console.log(result.wordCount);
// 20
```

### Strip HTML Tags

```typescript
const result = await htmlToMarkdownTool.execute({
  html: '<div><span>Just plain text</span></div>',
});

console.log(result.markdown);
// Just plain text
```

## Supported HTML Elements

| Element | Markdown Output |
|---------|-----------------|
| `<h1>` - `<h6>` | `#` to `######` (or underlined) |
| `<p>` | Paragraph with blank lines |
| `<strong>`, `<b>` | `**bold**` |
| `<em>`, `<i>` | `*italic*` |
| `<a>` | `[text](url)` |
| `<img>` | `![alt](src)` |
| `<ul>`, `<ol>` | Bullet or numbered lists |
| `<li>` | List items |
| `<code>` | `` `code` `` |
| `<pre>` | ` ``` code block ``` ` |
| `<blockquote>` | `> quote` |
| `<table>` | Markdown tables |
| `<hr>` | `---` |
| `<br>` | Line break |

## Word Count

The word count feature:
- Removes markdown formatting characters
- Counts only actual words
- Normalizes whitespace
- Filters empty strings

```typescript
const result = await htmlToMarkdownTool.execute({
  html: '<p>The **quick** brown fox.</p>',
});

console.log(result.wordCount);
// 4 (counts "The", "quick", "brown", "fox")
```

## Error Handling

```typescript
try {
  const result = await htmlToMarkdownTool.execute({
    html: null,  // Invalid input
  });
} catch (error) {
  console.error(error.message);
  // "HTML input must be a string"
}
```

## Common Use Cases

### Convert Web Scraping Results

```typescript
const scrapedHtml = await fetch('https://example.com').then(r => r.text());
const result = await htmlToMarkdownTool.execute({ html: scrapedHtml });
// Now you have clean markdown for processing
```

### Convert Rich Text Editor Output

```typescript
const editorHtml = richTextEditor.getHTML();
const result = await htmlToMarkdownTool.execute({ html: editorHtml });
// Store as markdown instead of HTML
```

### Email to Markdown

```typescript
const emailHtml = getEmailBodyHtml();
const result = await htmlToMarkdownTool.execute({ html: emailHtml });
// Clean markdown representation of email
```

### Documentation Generation

```typescript
const apiDocsHtml = generateApiDocs();
const result = await htmlToMarkdownTool.execute({ html: apiDocsHtml });
// Markdown docs for GitHub/GitLab
```

## Best Practices

1. **Sanitize First** - Use `@tpmjs/tools-html-sanitize` before converting untrusted HTML
2. **Choose Appropriate Style** - Use `atx` for GitHub, `setext` for readability
3. **Consistent Markers** - Stick to one bullet list marker in your project
4. **Handle Errors** - Wrap conversions in try-catch for production use
5. **Trim Output** - Call `.trim()` on markdown if needed

## Limitations

- Complex CSS styling is lost (only semantic HTML is preserved)
- Custom HTML elements are converted to their text content
- Nested tables may not render perfectly
- Some exotic HTML5 elements may not have markdown equivalents

## License

MIT
