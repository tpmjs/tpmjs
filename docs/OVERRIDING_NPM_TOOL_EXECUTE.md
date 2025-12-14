# Overriding Execute Functions for npm Tools

When you import an AI SDK tool from npm, it comes with a built-in `execute` function. This guide shows how to override or extend that execution before passing the tool to `generateText` or `streamText`.

## The Problem

You install a tool from npm:

```bash
npm install @tpmjs/some-tool
```

And import it:

```typescript
import { someTool } from '@tpmjs/some-tool';
import { generateText } from 'ai';

const result = await generateText({
  model: openai('gpt-4o'),
  tools: { someTool },  // Uses the package's built-in execute
  prompt: 'Do something',
});
```

But what if you want to:
- Add logging before/after execution
- Add authentication or API keys
- Cache results
- Transform inputs or outputs
- Replace the execution entirely
- Add rate limiting or retries

## Understanding Tool Structure

An AI SDK tool is an object with this shape:

```typescript
type Tool = {
  description: string;
  parameters: ZodSchema;
  execute: (args: T, options: ToolExecuteOptions) => Promise<Result>;
};
```

The key insight: **tools are just objects**. You can spread them, override properties, and create new tools from existing ones.

---

## Pattern 1: Simple Override with Spread

The most straightforward approach - spread the original tool and override `execute`:

```typescript
import { someTool } from '@tpmjs/some-tool';
import { generateText } from 'ai';

const myTool = {
  ...someTool,
  execute: async (args, options) => {
    console.log('Custom execution with args:', args);
    // Your completely custom implementation
    return { result: 'my custom result' };
  },
};

const result = await generateText({
  model: openai('gpt-4o'),
  tools: { myTool },
  prompt: 'Do something',
});
```

**Use when:** You want to completely replace the execution logic.

---

## Pattern 2: Wrap with Pre/Post Processing

Call the original execute but add behavior before and after:

```typescript
import { someTool } from '@tpmjs/some-tool';

const wrappedTool = {
  ...someTool,
  execute: async (args, options) => {
    // PRE-PROCESSING
    console.log(`[${new Date().toISOString()}] Calling tool with:`, args);
    const startTime = Date.now();

    try {
      // CALL ORIGINAL
      const result = await someTool.execute(args, options);

      // POST-PROCESSING
      const duration = Date.now() - startTime;
      console.log(`[${duration}ms] Tool returned:`, result);

      return result;
    } catch (error) {
      console.error('Tool execution failed:', error);
      throw error;
    }
  },
};
```

**Use when:** You want to keep the original behavior but add logging, metrics, or transformations.

---

## Pattern 3: Transform Inputs

Modify arguments before they reach the original execute:

```typescript
import { searchTool } from '@tpmjs/search-tool';

const enhancedSearchTool = {
  ...searchTool,
  execute: async (args, options) => {
    // Transform inputs
    const enhancedArgs = {
      ...args,
      query: `${args.query} site:example.com`,  // Add search filter
      limit: Math.min(args.limit || 10, 50),     // Cap results
    };

    return searchTool.execute(enhancedArgs, options);
  },
};
```

---

## Pattern 4: Transform Outputs

Modify the result before returning:

```typescript
import { dataTool } from '@tpmjs/data-tool';

const formattedDataTool = {
  ...dataTool,
  execute: async (args, options) => {
    const result = await dataTool.execute(args, options);

    // Transform output
    return {
      ...result,
      data: result.data.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp).toLocaleString(),
      })),
      _meta: {
        fetchedAt: new Date().toISOString(),
        source: 'dataTool',
      },
    };
  },
};
```

---

## Pattern 5: Add Authentication/API Keys

Inject credentials that the original tool needs:

```typescript
import { apiTool } from '@tpmjs/api-tool';

const authenticatedTool = {
  ...apiTool,
  execute: async (args, options) => {
    // Inject API key into args
    const argsWithAuth = {
      ...args,
      apiKey: process.env.EXTERNAL_API_KEY,
      headers: {
        ...args.headers,
        'Authorization': `Bearer ${process.env.AUTH_TOKEN}`,
      },
    };

    return apiTool.execute(argsWithAuth, options);
  },
};
```

---

## Pattern 6: Conditional Execution

Route to different implementations based on conditions:

```typescript
import { defaultTool } from '@tpmjs/default-tool';

const conditionalTool = {
  ...defaultTool,
  execute: async (args, options) => {
    // Use mock in development
    if (process.env.NODE_ENV === 'development') {
      return { result: 'mock data', mocked: true };
    }

    // Use cached result if available
    const cacheKey = JSON.stringify(args);
    const cached = await cache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // Otherwise use original
    const result = await defaultTool.execute(args, options);
    await cache.set(cacheKey, result, { ttl: 3600 });
    return result;
  },
};
```

---

## Pattern 7: Add Retry Logic

Wrap execution with automatic retries:

```typescript
import { unreliableTool } from '@tpmjs/unreliable-tool';

const reliableTool = {
  ...unreliableTool,
  execute: async (args, options) => {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await unreliableTool.execute(args, options);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
        }
      }
    }

    throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
  },
};
```

---

## Pattern 8: Add Timeout

Prevent tools from hanging:

```typescript
import { slowTool } from '@tpmjs/slow-tool';

const timedTool = {
  ...slowTool,
  execute: async (args, options) => {
    const timeoutMs = 10000; // 10 seconds

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Tool execution timed out')), timeoutMs);
    });

    return Promise.race([
      slowTool.execute(args, options),
      timeoutPromise,
    ]);
  },
};
```

---

## Pattern 9: Rate Limiting

Control how often a tool can be called:

```typescript
import { expensiveTool } from '@tpmjs/expensive-tool';

// Simple rate limiter
const rateLimiter = {
  calls: [] as number[],
  maxCalls: 10,
  windowMs: 60000, // 1 minute

  async acquire() {
    const now = Date.now();
    this.calls = this.calls.filter(t => now - t < this.windowMs);

    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0];
      const waitTime = this.windowMs - (now - oldestCall);
      await new Promise(r => setTimeout(r, waitTime));
      return this.acquire();
    }

    this.calls.push(now);
  },
};

const rateLimitedTool = {
  ...expensiveTool,
  execute: async (args, options) => {
    await rateLimiter.acquire();
    return expensiveTool.execute(args, options);
  },
};
```

---

## Pattern 10: Validation Layer

Add input validation before execution:

```typescript
import { unsafeTool } from '@tpmjs/unsafe-tool';
import { z } from 'zod';

// Additional validation schema
const strictSchema = z.object({
  query: z.string().min(1).max(1000),
  options: z.object({
    limit: z.number().int().min(1).max(100),
  }).optional(),
});

const validatedTool = {
  ...unsafeTool,
  execute: async (args, options) => {
    // Validate before execution
    const validated = strictSchema.parse(args);

    // Sanitize
    const sanitized = {
      ...validated,
      query: validated.query.replace(/<[^>]*>/g, ''), // Strip HTML
    };

    return unsafeTool.execute(sanitized, options);
  },
};
```

---

## Creating a Wrapper Factory

For reusable patterns, create a factory function:

```typescript
type WrapperOptions<T, R> = {
  before?: (args: T) => T | Promise<T>;
  after?: (result: R, args: T) => R | Promise<R>;
  onError?: (error: Error, args: T) => R | Promise<R>;
  timeout?: number;
  retries?: number;
};

function wrapTool<T, R>(
  tool: { description: string; parameters: any; execute: (args: T, opts: any) => Promise<R> },
  options: WrapperOptions<T, R> = {}
) {
  return {
    ...tool,
    execute: async (args: T, execOptions: any): Promise<R> => {
      // Transform inputs
      let processedArgs = args;
      if (options.before) {
        processedArgs = await options.before(args);
      }

      // Execute with timeout
      const executeWithTimeout = async () => {
        if (options.timeout) {
          return Promise.race([
            tool.execute(processedArgs, execOptions),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), options.timeout)
            ),
          ]);
        }
        return tool.execute(processedArgs, execOptions);
      };

      // Execute with retries
      let lastError: Error | undefined;
      const maxAttempts = (options.retries ?? 0) + 1;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          let result = await executeWithTimeout();

          // Transform outputs
          if (options.after) {
            result = await options.after(result, processedArgs);
          }

          return result;
        } catch (error) {
          lastError = error as Error;
          if (attempt < maxAttempts) {
            await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
          }
        }
      }

      // Handle error
      if (options.onError) {
        return options.onError(lastError!, processedArgs);
      }
      throw lastError;
    },
  };
}

// Usage
import { someTool } from '@tpmjs/some-tool';

const enhancedTool = wrapTool(someTool, {
  before: (args) => ({ ...args, enhanced: true }),
  after: (result) => ({ ...result, processedAt: new Date() }),
  timeout: 5000,
  retries: 2,
  onError: (error, args) => ({ error: error.message, args, fallback: true }),
});
```

---

## Using with generateText/streamText

All patterns work the same way with the AI SDK:

```typescript
import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { originalTool } from '@tpmjs/original-tool';

// Create your wrapped version
const myTool = {
  ...originalTool,
  execute: async (args, options) => {
    // Your custom logic
    return originalTool.execute(args, options);
  },
};

// Use with generateText
const result = await generateText({
  model: openai('gpt-4o'),
  tools: { myTool },
  maxSteps: 5,
  prompt: 'Use the tool to do something',
});

// Or with streamText
const stream = streamText({
  model: openai('gpt-4o'),
  tools: { myTool },
  maxSteps: 5,
  prompt: 'Use the tool to do something',
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

---

## Combining Multiple Tools

Override multiple tools at once:

```typescript
import { toolA } from '@tpmjs/tool-a';
import { toolB } from '@tpmjs/tool-b';
import { toolC } from '@tpmjs/tool-c';

// Logging wrapper for all tools
function withLogging<T extends Record<string, any>>(tools: T): T {
  const wrapped: any = {};

  for (const [name, tool] of Object.entries(tools)) {
    wrapped[name] = {
      ...tool,
      execute: async (args: any, options: any) => {
        console.log(`[${name}] called with:`, args);
        const result = await tool.execute(args, options);
        console.log(`[${name}] returned:`, result);
        return result;
      },
    };
  }

  return wrapped;
}

const tools = withLogging({ toolA, toolB, toolC });

const result = await generateText({
  model: openai('gpt-4o'),
  tools,
  prompt: 'Do something',
});
```

---

## TypeScript: Preserving Types

To maintain type safety when wrapping tools:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

// If the original tool is typed
type OriginalTool = typeof import('@tpmjs/some-tool').someTool;

// Your wrapper preserves the type
function wrapWithLogging<T extends { execute: (...args: any[]) => any }>(
  originalTool: T
): T {
  return {
    ...originalTool,
    execute: async (...args: Parameters<T['execute']>) => {
      console.log('Calling tool');
      return originalTool.execute(...args);
    },
  } as T;
}

// Usage - types are preserved
import { someTool } from '@tpmjs/some-tool';
const wrappedTool = wrapWithLogging(someTool);
// wrappedTool has the same type as someTool
```

---

## Real-World Example: Weather Tool with Caching

```typescript
import { weatherTool } from '@tpmjs/weather';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Simple in-memory cache
const cache = new Map<string, { data: any; expiry: number }>();

const cachedWeatherTool = {
  ...weatherTool,
  execute: async (args: { location: string }, options) => {
    const cacheKey = `weather:${args.location.toLowerCase()}`;
    const now = Date.now();

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > now) {
      console.log(`Cache hit for ${args.location}`);
      return { ...cached.data, cached: true };
    }

    // Fetch fresh data
    console.log(`Fetching weather for ${args.location}`);
    const result = await weatherTool.execute(args, options);

    // Cache for 5 minutes
    cache.set(cacheKey, {
      data: result,
      expiry: now + 5 * 60 * 1000,
    });

    return { ...result, cached: false };
  },
};

// Use it
const result = await generateText({
  model: openai('gpt-4o'),
  tools: { weather: cachedWeatherTool },
  prompt: 'What is the weather in San Francisco and New York?',
  maxSteps: 3,
});
```

---

## Summary

| Pattern | Use Case |
|---------|----------|
| Simple Override | Completely replace execution |
| Wrap Pre/Post | Add logging, metrics |
| Transform Inputs | Modify arguments |
| Transform Outputs | Format results |
| Authentication | Inject API keys |
| Conditional | Mock data, caching |
| Retry | Handle flaky services |
| Timeout | Prevent hanging |
| Rate Limiting | Control API usage |
| Validation | Sanitize inputs |

The key insight is that AI SDK tools are plain objects. You can spread them and override `execute` to customize behavior while keeping the original `description` and `parameters` schema intact.

```typescript
const customTool = {
  ...originalTool,           // Keep description & parameters
  execute: async (args) => { // Override execute
    // Your custom logic
  },
};
```
