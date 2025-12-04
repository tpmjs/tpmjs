# @tpmjs/markdown-formatter

AI SDK tools for formatting and manipulating markdown text. Perfect for cleaning up markdown documents and making tables more readable!

## Tools

### markdownToPlainText

Convert markdown to plain text by removing all formatting.

```typescript
import { markdownToPlainText } from '@tpmjs/markdown-formatter';

const result = await markdownToPlainText.execute({
  markdown: '# Hello **World**\n\nThis is *italic* text.',
  preserveLineBreaks: true,
});
// Result: "Hello World\n\nThis is italic text."
```

### formatMarkdownTable

Format and align markdown table columns for better readability.

```typescript
import { formatMarkdownTable } from '@tpmjs/markdown-formatter';

const result = await formatMarkdownTable.execute({
  table: `
| Name | Age | City |
|---|---|---|
| Alice | 30 | NYC |
| Bob | 25 | LA |
  `,
  alignment: 'left',
});
// Returns a beautifully formatted table with aligned columns
```

## Installation

```bash
npm install @tpmjs/markdown-formatter
```

## Features

- Strip markdown formatting to plain text
- Preserve or remove line breaks
- Format markdown tables with column alignment
- Support for left, center, and right alignment
- Defensive parameter validation

## License

MIT
