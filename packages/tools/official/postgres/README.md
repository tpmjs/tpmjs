# @tpmjs/tools-postgres

Postgres tools for AI agents.

## Installation

```bash
npm install @tpmjs/tools-postgres
```

## Usage

```typescript
import { examplePostgres } from '@tpmjs/tools-postgres';

// Use with Vercel AI SDK
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    examplePostgres,
  },
  prompt: 'Your prompt here',
});
```

## Tools

### examplePostgres

Example postgres tool that demonstrates the basic structure.

**Parameters:**
- `message` (string, required): A message to process

## Environment Variables

None required for the example tool.

## License

MIT
