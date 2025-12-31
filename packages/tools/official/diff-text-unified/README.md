# @tpmjs/tools-diff-text-unified

Creates unified diff between two text strings with context lines.

## Installation

```bash
npm install @tpmjs/tools-diff-text-unified
```

## Usage

```typescript
import { diffTextUnified } from '@tpmjs/tools-diff-text-unified';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    diffTextUnified,
  },
  prompt: 'Compare these two versions and show me what changed',
});
```

## Tool Details

### diffTextUnified

Creates a unified diff between two text strings, showing additions, deletions, and context lines.

**Parameters:**

- `original` (string, required) - The original text to compare from
- `modified` (string, required) - The modified text to compare to
- `contextLines` (number, optional) - Number of context lines to show around changes (default: 3)

**Returns:**

```typescript
{
  diff: string;          // The unified diff string
  additions: number;     // Number of lines added
  deletions: number;     // Number of lines deleted
  changes: number;       // Total changes (additions + deletions)
  hasChanges: boolean;   // Whether any changes were detected
  summary: string;       // Human-readable summary
}
```

## Example Output

```typescript
{
  diff: `--- original
+++ modified
@@ -1,3 +1,3 @@
 function hello() {
-  console.log('Hello');
+  console.log('Hello, World!');
 }`,
  additions: 1,
  deletions: 1,
  changes: 2,
  hasChanges: true,
  summary: "1 addition, 1 deletion"
}
```

## Features

- Creates standard unified diff format
- Configurable context lines
- Counts additions and deletions
- Provides human-readable summary
- Works with any text content (code, documents, etc.)

## License

MIT
