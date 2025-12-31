# @tpmjs/tools-text-chunk

Split text into chunks by size or sentence boundaries with optional overlap.

## Installation

```bash
npm install @tpmjs/tools-text-chunk
```

## Usage

```typescript
import { textChunkTool } from '@tpmjs/tools-text-chunk';

// Use with AI SDK
const result = await textChunkTool.execute({
  text: 'Your long text here...',
  maxChunkSize: 500,
  overlap: 50,
});

console.log(result.chunks);
// [
//   { text: '...', startIndex: 0, endIndex: 500, chunkIndex: 0 },
//   { text: '...', startIndex: 450, endIndex: 950, chunkIndex: 1 },
//   ...
// ]
```

## Features

- **Sentence-aware chunking**: Uses the `sbd` library for intelligent sentence detection
- **Configurable overlap**: Control how much text overlaps between chunks
- **Boundary preservation**: Tries to avoid breaking mid-sentence when possible
- **Detailed metadata**: Returns chunk indices, positions, and statistics

## Parameters

- `text` (string, required): The text to split into chunks
- `maxChunkSize` (number, required): Maximum size of each chunk in characters
- `overlap` (number, optional): Number of characters to overlap between chunks (default: 0)

## Returns

```typescript
{
  chunks: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
    chunkIndex: number;
  }>;
  chunkCount: number;
  totalLength: number;
  metadata: {
    averageChunkSize: number;
    maxChunkSize: number;
    overlap: number;
  };
}
```

## Use Cases

- Preparing text for embeddings (RAG systems)
- Processing large documents in smaller pieces
- Creating sliding window text analysis
- Breaking content for API rate limits
- Generating text previews

## Example with AI Agent

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { textChunkTool } from '@tpmjs/tools-text-chunk';

const result = await generateText({
  model: openai('gpt-4'),
  tools: {
    textChunk: textChunkTool,
  },
  prompt: 'Split this document into 500-character chunks with 50 character overlap: ...',
});
```

## License

MIT
