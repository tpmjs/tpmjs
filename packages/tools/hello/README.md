# @tpmjs/hello

Simple example TPMJS tools for AI SDK v6 - demonstrates how to create tools that work with AI agents.

## Tools

### helloWorldTool
Returns a simple "Hello, World!" greeting with a timestamp.

**Parameters:** None

**Returns:**
```json
{
  "message": "Hello, World!",
  "timestamp": "2024-12-04T..."
}
```

### helloNameTool
Returns a personalized greeting with the provided name.

**Parameters:**
- `name` (string, required): The name of the person to greet

**Returns:**
```json
{
  "message": "Hello, John!",
  "timestamp": "2024-12-04T..."
}
```

## Usage

### With AI SDK v6

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { helloWorldTool, helloNameTool } from '@tpmjs/hello';

const result = streamText({
  model: openai('gpt-4o-mini'),
  messages: [{ role: 'user', content: 'Say hello to Alice' }],
  tools: {
    helloWorld: helloWorldTool,
    helloName: helloNameTool,
  },
});
```

## Template for Creating TPMJS Tools

This package serves as a template for creating your own TPMJS tools. Key requirements:

1. **Use AI SDK v6 Beta** (`ai@6.0.0-beta.124`)
2. **Use Zod 4** for parameter validation
3. **Export tool objects** with `description`, `parameters`, and `execute`
4. **Add TPMJS metadata** to package.json:
   ```json
   "tpmjs": {
     "category": "text-analysis",
     "description": "Your tool description"
   }
   ```
5. **Include the `tpmjs` keyword** in package.json

## Development

```bash
# Build
pnpm build

# Type check
pnpm type-check

# Watch mode
pnpm dev
```
