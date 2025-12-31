# @tpmjs/tools-html-sanitize

Sanitize HTML to prevent XSS attacks using [isomorphic-dompurify](https://github.com/kkomelin/isomorphic-dompurify).

## Installation

```bash
npm install @tpmjs/tools-html-sanitize
# or
pnpm add @tpmjs/tools-html-sanitize
# or
yarn add @tpmjs/tools-html-sanitize
```

## Usage

### With Vercel AI SDK

```typescript
import { htmlSanitizeTool } from '@tpmjs/tools-html-sanitize';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    htmlSanitize: htmlSanitizeTool,
  },
  prompt: 'Sanitize this HTML to make it safe',
});
```

### Direct Usage

```typescript
import { htmlSanitizeTool } from '@tpmjs/tools-html-sanitize';

const result = await htmlSanitizeTool.execute({
  html: '<p>Safe content</p><script>alert("XSS")</script>',
});

console.log(result.sanitized);
// <p>Safe content</p>

console.log(result);
// {
//   sanitized: '<p>Safe content</p>',
//   removedCount: 1,
//   warnings: ['Removed script tags to prevent XSS']
// }
```

## Features

- **XSS Prevention** - Removes dangerous scripts and event handlers
- **Safe Defaults** - Pre-configured with common safe HTML tags
- **Customizable** - Configure allowed tags and attributes
- **Warnings** - Reports what dangerous content was removed
- **Isomorphic** - Works in Node.js and browser environments
- **Protocol Filtering** - Removes javascript: and unsafe data: URLs

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `html` | `string` | Yes | The HTML string to sanitize |
| `options` | `SanitizeOptions` | No | Configuration for allowed tags and attributes |

### SanitizeOptions

```typescript
{
  allowedTags?: string[];           // Array of allowed HTML tag names
  allowedAttributes?: Record<string, string[]>;  // Tag -> attributes mapping
}
```

## Returns

```typescript
{
  sanitized: string;      // The sanitized HTML
  removedCount: number;   // Number of elements removed
  warnings: string[];     // Descriptions of what was removed
}
```

## Examples

### Basic XSS Prevention

```typescript
const result = await htmlSanitizeTool.execute({
  html: '<p onclick="alert(1)">Click me</p><script>alert("XSS")</script>',
});

console.log(result.sanitized);
// <p>Click me</p>

console.log(result.warnings);
// ['Removed inline event handlers (onclick, onerror, etc.)', 'Removed script tags to prevent XSS']
```

### Custom Allowed Tags

```typescript
const result = await htmlSanitizeTool.execute({
  html: '<p>Paragraph</p><div>Div</div><script>alert(1)</script>',
  options: {
    allowedTags: ['p'],  // Only allow <p> tags
  },
});

console.log(result.sanitized);
// <p>Paragraph</p>Div
```

### Custom Allowed Attributes

```typescript
const result = await htmlSanitizeTool.execute({
  html: '<a href="https://example.com" onclick="alert(1)" data-custom="value">Link</a>',
  options: {
    allowedTags: ['a'],
    allowedAttributes: {
      'a': ['href'],  // Only allow href attribute on <a> tags
    },
  },
});

console.log(result.sanitized);
// <a href="https://example.com">Link</a>
```

### Remove Dangerous Protocols

```typescript
const result = await htmlSanitizeTool.execute({
  html: '<a href="javascript:alert(1)">Click</a>',
});

console.log(result.sanitized);
// <a>Click</a>

console.log(result.warnings);
// ['Removed javascript: protocol from links']
```

### Remove iframes and Embeds

```typescript
const result = await htmlSanitizeTool.execute({
  html: '<p>Safe</p><iframe src="evil.com"></iframe><embed src="malware.swf">',
});

console.log(result.sanitized);
// <p>Safe</p>

console.log(result.warnings);
// ['Removed iframe tags', 'Removed object or embed tags']
```

### Preserve Safe Images

```typescript
const result = await htmlSanitizeTool.execute({
  html: '<img src="photo.jpg" alt="Photo" onerror="alert(1)">',
});

console.log(result.sanitized);
// <img src="photo.jpg" alt="Photo">

console.log(result.warnings);
// ['Removed inline event handlers (onclick, onerror, etc.)']
```

### Complex HTML Sanitization

```typescript
const result = await htmlSanitizeTool.execute({
  html: `
    <div class="container">
      <h1>Title</h1>
      <p>Safe paragraph</p>
      <script>alert("XSS")</script>
      <style>body { display: none; }</style>
      <a href="javascript:void(0)">Bad link</a>
      <a href="https://safe.com">Good link</a>
    </div>
  `,
});

console.log(result.sanitized);
// <div class="container">
//   <h1>Title</h1>
//   <p>Safe paragraph</p>
//   <a>Bad link</a>
//   <a href="https://safe.com">Good link</a>
// </div>

console.log(result.removedCount);
// 2

console.log(result.warnings);
// ['Removed script tags to prevent XSS', 'Removed javascript: protocol from links', 'Removed style tags']
```

## Default Allowed Tags

```typescript
['p', 'br', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li',
 'a', 'img', 'blockquote', 'code', 'pre']
```

## Default Allowed Attributes

```typescript
{
  'a': ['href', 'title', 'target'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  '*': ['class', 'id']  // Allowed on all tags
}
```

## Security Features

| Feature | Description |
|---------|-------------|
| Script removal | Removes `<script>` tags |
| Event handler removal | Removes `onclick`, `onerror`, etc. |
| Protocol filtering | Blocks `javascript:`, unsafe `data:` |
| iframe removal | Removes `<iframe>` by default |
| Object/embed removal | Removes `<object>` and `<embed>` |
| Style removal | Removes `<style>` tags by default |

## Common Use Cases

### Sanitize User-Generated Content

```typescript
const userComment = '<p>Great post!</p><script>stealCookies()</script>';
const result = await htmlSanitizeTool.execute({ html: userComment });
// Safe to display: <p>Great post!</p>
```

### Allow Only Text Formatting

```typescript
const result = await htmlSanitizeTool.execute({
  html: richTextEditorContent,
  options: {
    allowedTags: ['p', 'br', 'strong', 'em', 'u'],
    allowedAttributes: {},
  },
});
```

### Preserve Links with Validation

```typescript
const result = await htmlSanitizeTool.execute({
  html: markdownConverted,
  options: {
    allowedTags: ['p', 'a', 'strong', 'em'],
    allowedAttributes: {
      'a': ['href', 'title'],
    },
  },
});
```

## Error Handling

```typescript
try {
  const result = await htmlSanitizeTool.execute({
    html: null,  // Invalid input
  });
} catch (error) {
  console.error(error.message);
  // "HTML input must be a string"
}
```

## Best Practices

1. **Use Default Settings** - The defaults are secure for most use cases
2. **Whitelist, Don't Blacklist** - Only allow known-safe tags and attributes
3. **Check Warnings** - Review warnings to understand what was removed
4. **Validate Context** - Different contexts may need different allowed tags
5. **Defense in Depth** - Combine with Content Security Policy (CSP)

## Limitations

- Does not validate HTML syntax errors
- Does not check link destinations (only protocols)
- Does not sanitize CSS within style attributes
- May remove legitimate content if too restrictive

## License

MIT
