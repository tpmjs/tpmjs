# @tpmjs/tools-stacktrace-parse

Parses stack traces into structured frames, handling Node.js and browser formats.

## Installation

```bash
npm install @tpmjs/tools-stacktrace-parse
```

## Usage

```typescript
import { stacktraceParse } from '@tpmjs/tools-stacktrace-parse';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    stacktraceParse,
  },
  prompt: 'Parse this stack trace and tell me where the error occurred',
});
```

## Tool Details

### stacktraceParse

Parses a stack trace string into structured frames with file, method name, line number, and column information.

**Parameters:**

- `stacktrace` (string, required) - The stack trace string to parse (from Node.js or browser)

**Returns:**

```typescript
{
  frames: Array<{
    file: string | null;
    methodName: string | null;
    lineNumber: number | null;
    column: number | null;
    arguments: string[];
  }>;
  errorType: string | null;      // e.g., "TypeError", "ReferenceError"
  errorMessage: string | null;   // The error message
  language: 'node' | 'browser' | 'unknown';
  totalFrames: number;
  summary: string;
}
```

## Example Output

Given this stack trace:

```
TypeError: Cannot read property 'foo' of undefined
    at getUserData (/app/user.js:45:12)
    at processRequest (/app/server.js:123:5)
    at Server.handleRequest (/app/server.js:89:3)
```

Returns:

```typescript
{
  frames: [
    {
      file: "/app/user.js",
      methodName: "getUserData",
      lineNumber: 45,
      column: 12,
      arguments: []
    },
    {
      file: "/app/server.js",
      methodName: "processRequest",
      lineNumber: 123,
      column: 5,
      arguments: []
    },
    {
      file: "/app/server.js",
      methodName: "Server.handleRequest",
      lineNumber: 89,
      column: 3,
      arguments: []
    }
  ],
  errorType: "TypeError",
  errorMessage: "Cannot read property 'foo' of undefined",
  language: "node",
  totalFrames: 3,
  summary: "TypeError - Cannot read property 'foo' of undefined - 3 frames"
}
```

## Features

- Parses Node.js and browser stack traces
- Extracts error type and message
- Provides structured frame information
- Detects stack trace format (Node.js vs browser)
- Handles various stack trace formats

## Supported Formats

- **Node.js**: Standard V8 stack traces
- **Browser**: Chrome, Firefox, Safari formats
- **Webpack**: Bundled stack traces with source maps

## License

MIT
