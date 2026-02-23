# @tpmjs/tools-redis

Redis tools for AI agents.

## Installation

```bash
npm install @tpmjs/tools-redis
```

## Usage

```typescript
import { exampleRedis } from '@tpmjs/tools-redis';

// Use with Vercel AI SDK
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    exampleRedis,
  },
  prompt: 'Your prompt here',
});
```

## Tools

### exampleRedis

Example redis tool that demonstrates the basic structure.

**Parameters:**
- `message` (string, required): A message to process

## Environment Variables

None required for the example tool.

## License

MIT
