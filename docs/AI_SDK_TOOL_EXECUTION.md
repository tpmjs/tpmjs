# AI SDK 6 Tool Execution: Override & Extend Patterns

> Comprehensive guide for customizing tool execution in TPMJS with Vercel AI SDK 6

## Table of Contents

1. [Overview](#overview)
2. [AI SDK 6 Tool Architecture](#ai-sdk-6-tool-architecture)
3. [How TPMJS Tool Execution Works](#how-tpmjs-tool-execution-works)
4. [Override Patterns](#override-patterns)
5. [Extension Patterns](#extension-patterns)
6. [Middleware Approach](#middleware-approach)
7. [Factory Pattern Implementation](#factory-pattern-implementation)
8. [Complete Examples](#complete-examples)
9. [Best Practices](#best-practices)
10. [API Reference](#api-reference)

---

## Overview

When using tools from the TPMJS registry, developers have different needs:

| Use Case | Approach |
|----------|----------|
| **Use default execution** | Import and use `registryExecuteTool` directly |
| **Modify parameters** | Wrap the tool with custom logic |
| **Add logging/telemetry** | Use middleware pattern |
| **Replace execution entirely** | Create custom tool with same schema |
| **Extend with pre/post processing** | Use factory functions |
| **Add approval workflows** | Use AI SDK 6's `needsApproval` feature |

This document covers all patterns with practical examples.

---

## AI SDK 6 Tool Architecture

### The `tool()` Function

The AI SDK's `tool()` helper creates typed tool definitions:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const myTool = tool({
  description: 'What the tool does',
  inputSchema: z.object({
    param1: z.string().describe('Parameter description'),
  }),
  execute: async ({ param1 }, options) => {
    // options includes:
    // - toolCallId: unique identifier for this call
    // - messages: conversation history
    // - abortSignal: for cancellation
    // - experimental_context: custom data from generateText/streamText
    return { result: 'value' };
  },
});
```

### Execute Function Signature

```typescript
type ExecuteFunction<INPUT, OUTPUT> = (
  input: INPUT,
  options: {
    toolCallId: string;
    messages: CoreMessage[];
    abortSignal: AbortSignal;
    experimental_context?: unknown;
  }
) => Promise<OUTPUT>;
```

### AI SDK 6 New Features

**Tool Approval System:**
```typescript
const sensitiveOperation = tool({
  description: 'Performs a sensitive operation',
  inputSchema: z.object({ action: z.string() }),
  needsApproval: true, // Requires user confirmation
  execute: async ({ action }) => {
    // Only runs after approval
  },
});
```

**Dynamic Approval Based on Input:**
```typescript
const transferTool = tool({
  description: 'Transfer funds',
  inputSchema: z.object({ amount: z.number() }),
  needsApproval: ({ amount }) => amount > 1000, // Approve if > $1000
  execute: async ({ amount }) => { /* ... */ },
});
```

**Lifecycle Hooks:**
```typescript
const toolWithHooks = tool({
  description: 'Tool with lifecycle hooks',
  inputSchema: z.object({ data: z.string() }),
  onInputStart: () => console.log('Argument generation started'),
  onInputDelta: (delta) => console.log('Streaming:', delta),
  onInputAvailable: (input) => console.log('Ready to execute:', input),
  execute: async ({ data }) => { /* ... */ },
});
```

---

## How TPMJS Tool Execution Works

### Current Architecture

TPMJS provides two main tools:

**1. `registrySearchTool`** - Searches the registry for tools
```typescript
import { registrySearchTool } from '@tpmjs/registry-search';

// Returns tools with toolIds in format: "package::exportName"
const result = await registrySearchTool.execute({
  query: 'web scraping',
  category: 'web-scraping',
  limit: 5,
});
```

**2. `registryExecuteTool`** - Executes tools in sandbox
```typescript
import { registryExecuteTool } from '@tpmjs/registry-execute';

// Executes in secure sandbox - no local installation needed
const result = await registryExecuteTool.execute({
  toolId: '@anthropic/tavily-search::search',
  params: { query: 'AI news' },
  env: { TAVILY_API_KEY: 'your-key' },
});
```

### Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        AI Agent                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  registrySearchTool                          │
│  Query: "scrape website"                                     │
│  Returns: [{ toolId: "@example/scraper::scrape", ... }]     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 registryExecuteTool                          │
│  toolId: "@example/scraper::scrape"                         │
│  params: { url: "https://..." }                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              TPMJS Sandbox Executor                          │
│  - Fetches package from npm                                  │
│  - Runs in isolated environment                              │
│  - Returns results                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Override Patterns

### Pattern 1: Complete Execute Override

Replace the entire execute function while keeping the same schema:

```typescript
import { tool, jsonSchema } from 'ai';

// Define your own execute function
const myRegistryExecuteTool = tool({
  description: 'Execute a tool from the TPMJS registry with custom handling',
  inputSchema: jsonSchema<{
    toolId: string;
    params: Record<string, unknown>;
    env?: Record<string, string>;
  }>({
    type: 'object',
    properties: {
      toolId: { type: 'string' },
      params: { type: 'object', additionalProperties: true },
      env: { type: 'object', additionalProperties: { type: 'string' } },
    },
    required: ['toolId', 'params'],
  }),

  // YOUR CUSTOM EXECUTE FUNCTION
  async execute({ toolId, params, env }) {
    // Option 1: Execute locally instead of sandbox
    const [packageName, exportName] = toolId.split('::');
    const pkg = await import(packageName);
    const toolFn = pkg[exportName];
    return toolFn.execute(params);

    // Option 2: Route to your own executor
    // return fetch('https://your-executor.com/run', { ... });

    // Option 3: Add custom logic before/after
    // const result = await defaultExecute(toolId, params, env);
    // return transform(result);
  },
});
```

### Pattern 2: Conditional Override

Override execution based on conditions:

```typescript
import { registryExecuteTool } from '@tpmjs/registry-execute';
import { tool } from 'ai';

const conditionalExecuteTool = tool({
  ...registryExecuteTool,
  async execute({ toolId, params, env }, options) {
    // Route internal tools differently
    if (toolId.startsWith('@internal/')) {
      return executeInternally(toolId, params);
    }

    // Use sandbox for external tools
    return registryExecuteTool.execute({ toolId, params, env });
  },
});
```

### Pattern 3: Schema-Only Override

Keep the schema but provide completely custom execution:

```typescript
import { registryExecuteTool } from '@tpmjs/registry-execute';
import { tool } from 'ai';

// Extract just the schema
const { description, inputSchema } = registryExecuteTool;

// Create new tool with same schema, different execution
const localExecuteTool = tool({
  description,
  inputSchema,
  async execute({ toolId, params, env }) {
    // Your custom execution logic
    const [pkg, fn] = toolId.split('::');
    const module = await import(pkg);
    return module[fn](params);
  },
});
```

---

## Extension Patterns

### Pattern 1: Pre/Post Processing Wrapper

Add logic before and after the default execution:

```typescript
import { registryExecuteTool } from '@tpmjs/registry-execute';
import { tool } from 'ai';

const extendedExecuteTool = tool({
  description: registryExecuteTool.description,
  inputSchema: registryExecuteTool.inputSchema,

  async execute(input, options) {
    // PRE-PROCESSING
    console.log(`[${new Date().toISOString()}] Executing: ${input.toolId}`);
    const startTime = Date.now();

    // Validate or transform input
    const sanitizedParams = sanitizeInput(input.params);

    try {
      // ORIGINAL EXECUTION
      const result = await registryExecuteTool.execute({
        ...input,
        params: sanitizedParams,
      });

      // POST-PROCESSING
      const duration = Date.now() - startTime;
      console.log(`[SUCCESS] ${input.toolId} completed in ${duration}ms`);

      // Transform output if needed
      return {
        ...result,
        _metadata: {
          executedAt: new Date().toISOString(),
          duration,
        },
      };
    } catch (error) {
      // ERROR HANDLING
      console.error(`[ERROR] ${input.toolId} failed:`, error);
      throw error;
    }
  },
});
```

### Pattern 2: Retry Wrapper

Add automatic retry logic:

```typescript
import { registryExecuteTool } from '@tpmjs/registry-execute';
import { tool } from 'ai';

const retryableExecuteTool = tool({
  ...registryExecuteTool,

  async execute(input, options) {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await registryExecuteTool.execute(input);
      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    throw new Error(`Failed after ${maxRetries} attempts: ${lastError!.message}`);
  },
});
```

### Pattern 3: Caching Wrapper

Cache results for expensive operations:

```typescript
import { registryExecuteTool } from '@tpmjs/registry-execute';
import { tool } from 'ai';

const cache = new Map<string, { result: unknown; timestamp: number }>();
const CACHE_TTL = 60_000; // 1 minute

const cachedExecuteTool = tool({
  ...registryExecuteTool,

  async execute(input, options) {
    // Create cache key from input
    const cacheKey = JSON.stringify(input);
    const cached = cache.get(cacheKey);

    // Return cached if fresh
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Cache hit for ${input.toolId}`);
      return cached.result;
    }

    // Execute and cache
    const result = await registryExecuteTool.execute(input);
    cache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  },
});
```

### Pattern 4: Validation Wrapper

Add input/output validation:

```typescript
import { registryExecuteTool } from '@tpmjs/registry-execute';
import { tool } from 'ai';
import { z } from 'zod';

// Define expected output schemas for specific tools
const outputSchemas: Record<string, z.ZodType> = {
  '@example/weather::getWeather': z.object({
    temperature: z.number(),
    conditions: z.string(),
  }),
};

const validatedExecuteTool = tool({
  ...registryExecuteTool,

  async execute(input, options) {
    // Input validation
    if (!input.toolId.includes('::')) {
      throw new Error('Invalid toolId format. Expected "package::export"');
    }

    // Execute
    const result = await registryExecuteTool.execute(input);

    // Output validation (if schema exists)
    const schema = outputSchemas[input.toolId];
    if (schema) {
      const parsed = schema.safeParse(result.output);
      if (!parsed.success) {
        console.warn(`Output validation failed for ${input.toolId}:`, parsed.error);
      }
    }

    return result;
  },
});
```

---

## Middleware Approach

AI SDK provides language model middleware, but for tool-level middleware, we can implement our own pattern.

### Tool Middleware Interface

```typescript
type ToolMiddleware<TInput, TOutput> = {
  // Transform input before execution
  transformInput?: (input: TInput) => TInput | Promise<TInput>;

  // Wrap the execute function
  wrapExecute?: (
    execute: (input: TInput) => Promise<TOutput>,
    input: TInput
  ) => Promise<TOutput>;

  // Transform output after execution
  transformOutput?: (output: TOutput) => TOutput | Promise<TOutput>;

  // Handle errors
  onError?: (error: Error, input: TInput) => void | Promise<void>;
};
```

### Middleware Implementation

```typescript
import { tool, Tool } from 'ai';

function applyMiddleware<TInput, TOutput>(
  baseTool: Tool<TInput, TOutput>,
  middleware: ToolMiddleware<TInput, TOutput>
): Tool<TInput, TOutput> {
  return tool({
    description: baseTool.description,
    inputSchema: baseTool.inputSchema,

    async execute(input: TInput, options) {
      // Transform input
      let processedInput = input;
      if (middleware.transformInput) {
        processedInput = await middleware.transformInput(input);
      }

      try {
        // Execute with optional wrapper
        let result: TOutput;
        if (middleware.wrapExecute) {
          result = await middleware.wrapExecute(
            (i) => baseTool.execute(i, options),
            processedInput
          );
        } else {
          result = await baseTool.execute(processedInput, options);
        }

        // Transform output
        if (middleware.transformOutput) {
          result = await middleware.transformOutput(result);
        }

        return result;
      } catch (error) {
        if (middleware.onError) {
          await middleware.onError(error as Error, processedInput);
        }
        throw error;
      }
    },
  });
}
```

### Using Middleware

```typescript
import { registryExecuteTool } from '@tpmjs/registry-execute';

// Logging middleware
const loggingMiddleware: ToolMiddleware<any, any> = {
  transformInput: (input) => {
    console.log('Input:', JSON.stringify(input, null, 2));
    return input;
  },
  transformOutput: (output) => {
    console.log('Output:', JSON.stringify(output, null, 2));
    return output;
  },
  onError: (error, input) => {
    console.error('Error executing', input.toolId, error);
  },
};

// Telemetry middleware
const telemetryMiddleware: ToolMiddleware<any, any> = {
  wrapExecute: async (execute, input) => {
    const start = performance.now();
    const result = await execute(input);
    const duration = performance.now() - start;

    // Send to telemetry service
    trackToolExecution({
      toolId: input.toolId,
      duration,
      success: true,
    });

    return result;
  },
};

// Apply multiple middlewares
const enhancedTool = applyMiddleware(
  applyMiddleware(registryExecuteTool, loggingMiddleware),
  telemetryMiddleware
);
```

---

## Factory Pattern Implementation

For maximum flexibility, use a factory pattern that allows configuration at creation time.

### Factory Function

```typescript
import { tool, jsonSchema } from 'ai';

type ExecutorConfig = {
  // Execution mode
  mode: 'sandbox' | 'local' | 'custom';

  // For 'sandbox' mode
  executorUrl?: string;

  // For 'local' mode
  localPackagePath?: string;

  // For 'custom' mode
  customExecutor?: (toolId: string, params: any, env?: any) => Promise<any>;

  // Common options
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;

  // Hooks
  onBeforeExecute?: (toolId: string, params: any) => void | Promise<void>;
  onAfterExecute?: (toolId: string, result: any) => void | Promise<void>;
  onError?: (toolId: string, error: Error) => void | Promise<void>;

  // Approval
  needsApproval?: boolean | ((input: any) => boolean);
};

function createRegistryExecuteTool(config: ExecutorConfig) {
  const {
    mode,
    executorUrl = 'https://executor.tpmjs.com',
    timeout = 30000,
    retries = 0,
    cache = false,
    cacheTTL = 60000,
    onBeforeExecute,
    onAfterExecute,
    onError,
    needsApproval,
  } = config;

  const resultCache = new Map<string, { data: any; timestamp: number }>();

  return tool({
    description: 'Execute a tool from the TPMJS registry',
    inputSchema: jsonSchema<{
      toolId: string;
      params: Record<string, unknown>;
      env?: Record<string, string>;
    }>({
      type: 'object',
      properties: {
        toolId: { type: 'string' },
        params: { type: 'object', additionalProperties: true },
        env: { type: 'object', additionalProperties: { type: 'string' } },
      },
      required: ['toolId', 'params'],
    }),

    needsApproval,

    async execute({ toolId, params, env }, options) {
      // Check cache
      if (cache) {
        const cacheKey = JSON.stringify({ toolId, params });
        const cached = resultCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cacheTTL) {
          return cached.data;
        }
      }

      // Before hook
      if (onBeforeExecute) {
        await onBeforeExecute(toolId, params);
      }

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          let result: any;

          // Execute based on mode
          switch (mode) {
            case 'sandbox':
              result = await executeSandbox(toolId, params, env, executorUrl, timeout, options.abortSignal);
              break;

            case 'local':
              result = await executeLocal(toolId, params, config.localPackagePath);
              break;

            case 'custom':
              if (!config.customExecutor) {
                throw new Error('customExecutor required for custom mode');
              }
              result = await config.customExecutor(toolId, params, env);
              break;
          }

          // After hook
          if (onAfterExecute) {
            await onAfterExecute(toolId, result);
          }

          // Cache result
          if (cache) {
            const cacheKey = JSON.stringify({ toolId, params });
            resultCache.set(cacheKey, { data: result, timestamp: Date.now() });
          }

          return result;

        } catch (error) {
          lastError = error as Error;

          if (onError) {
            await onError(toolId, lastError);
          }

          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          }
        }
      }

      throw lastError;
    },
  });
}

// Helper functions
async function executeSandbox(
  toolId: string,
  params: any,
  env: any,
  executorUrl: string,
  timeout: number,
  abortSignal?: AbortSignal
) {
  const [packageName, exportName] = toolId.split('::');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Combine abort signals
  const combinedSignal = abortSignal
    ? anySignal([abortSignal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch(`${executorUrl}/execute-tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageName, exportName, params, env }),
      signal: combinedSignal,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Execution failed');
    }

    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function executeLocal(
  toolId: string,
  params: any,
  basePath?: string
) {
  const [packageName, exportName] = toolId.split('::');
  const modulePath = basePath ? `${basePath}/${packageName}` : packageName;

  const module = await import(modulePath);
  const toolFn = module[exportName] || module.default;

  if (!toolFn?.execute) {
    throw new Error(`Tool ${exportName} not found or missing execute function`);
  }

  return toolFn.execute(params);
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}
```

### Using the Factory

```typescript
// Default sandbox execution
const defaultTool = createRegistryExecuteTool({
  mode: 'sandbox',
});

// Local execution with caching
const localTool = createRegistryExecuteTool({
  mode: 'local',
  localPackagePath: './node_modules',
  cache: true,
  cacheTTL: 300000, // 5 minutes
});

// Custom execution with telemetry
const customTool = createRegistryExecuteTool({
  mode: 'custom',
  customExecutor: async (toolId, params, env) => {
    // Your custom execution logic
    return myCustomExecutor.run(toolId, params, env);
  },
  retries: 2,
  onBeforeExecute: (toolId) => {
    metrics.increment(`tool.${toolId}.invocations`);
  },
  onAfterExecute: (toolId, result) => {
    metrics.histogram(`tool.${toolId}.duration`, result.executionTimeMs);
  },
  onError: (toolId, error) => {
    errorTracker.capture(error, { toolId });
  },
});

// With approval for sensitive tools
const approvedTool = createRegistryExecuteTool({
  mode: 'sandbox',
  needsApproval: (input) => {
    // Require approval for tools that modify data
    const sensitiveTools = ['database', 'file-operations', 'communication'];
    return sensitiveTools.some(cat => input.toolId.includes(cat));
  },
});
```

---

## Complete Examples

### Example 1: Full Agent with Custom Execution

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { registrySearchTool } from '@tpmjs/registry-search';

// Custom execute tool with logging and metrics
const myExecuteTool = createRegistryExecuteTool({
  mode: 'sandbox',
  retries: 2,
  cache: true,
  onBeforeExecute: async (toolId, params) => {
    console.log(`Executing ${toolId}...`);
    await analytics.track('tool_execution_start', { toolId });
  },
  onAfterExecute: async (toolId, result) => {
    console.log(`${toolId} completed in ${result.executionTimeMs}ms`);
    await analytics.track('tool_execution_complete', {
      toolId,
      duration: result.executionTimeMs,
    });
  },
  onError: async (toolId, error) => {
    await errorReporting.capture(error, { toolId });
  },
});

// Use in agent
const result = await generateText({
  model: openai('gpt-4o'),
  tools: {
    searchRegistry: registrySearchTool,
    executeTool: myExecuteTool,
  },
  maxSteps: 10,
  prompt: 'Find a tool to scrape https://example.com and extract all links',
});

console.log(result.text);
```

### Example 2: Local Development Override

```typescript
import { tool } from 'ai';
import { registryExecuteTool } from '@tpmjs/registry-execute';

// In development, use local packages instead of sandbox
const isDev = process.env.NODE_ENV === 'development';

const executeTool = isDev
  ? tool({
      ...registryExecuteTool,
      async execute({ toolId, params, env }) {
        console.log('[DEV] Executing locally:', toolId);

        const [pkg, fn] = toolId.split('::');

        // Load from local node_modules
        const module = await import(pkg);
        const toolFn = module[fn] || module.default;

        // Set env vars for local execution
        Object.entries(env || {}).forEach(([key, value]) => {
          process.env[key] = value;
        });

        return toolFn.execute(params);
      },
    })
  : registryExecuteTool;

export { executeTool };
```

### Example 3: Multi-Provider Execution

```typescript
import { tool, jsonSchema } from 'ai';

type ExecutionProvider = 'tpmjs-sandbox' | 'aws-lambda' | 'local';

const providers: Record<ExecutionProvider, (toolId: string, params: any, env?: any) => Promise<any>> = {
  'tpmjs-sandbox': async (toolId, params, env) => {
    const response = await fetch('https://executor.tpmjs.com/execute-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId, params, env }),
    });
    return response.json();
  },

  'aws-lambda': async (toolId, params, env) => {
    const lambda = new AWS.Lambda();
    const result = await lambda.invoke({
      FunctionName: `tpmjs-${toolId.replace('::', '-')}`,
      Payload: JSON.stringify({ params, env }),
    }).promise();
    return JSON.parse(result.Payload as string);
  },

  'local': async (toolId, params, env) => {
    const [pkg, fn] = toolId.split('::');
    const module = await import(pkg);
    return module[fn].execute(params);
  },
};

// Provider selection based on tool or configuration
function selectProvider(toolId: string): ExecutionProvider {
  // Route specific tools to specific providers
  if (toolId.startsWith('@internal/')) return 'local';
  if (toolId.startsWith('@aws/')) return 'aws-lambda';
  return 'tpmjs-sandbox';
}

const multiProviderExecuteTool = tool({
  description: 'Execute a tool using the optimal provider',
  inputSchema: jsonSchema<{
    toolId: string;
    params: Record<string, unknown>;
    env?: Record<string, string>;
    provider?: ExecutionProvider;
  }>({
    type: 'object',
    properties: {
      toolId: { type: 'string' },
      params: { type: 'object' },
      env: { type: 'object' },
      provider: {
        type: 'string',
        enum: ['tpmjs-sandbox', 'aws-lambda', 'local']
      },
    },
    required: ['toolId', 'params'],
  }),

  async execute({ toolId, params, env, provider }) {
    const selectedProvider = provider || selectProvider(toolId);
    console.log(`Executing ${toolId} via ${selectedProvider}`);

    return providers[selectedProvider](toolId, params, env);
  },
});
```

### Example 4: Combining with Your Own Tools

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';
import { tool } from 'ai';
import { z } from 'zod';

// Your own custom tools
const myDatabaseTool = tool({
  description: 'Query your internal database',
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    // Your database logic
    return db.query(query);
  },
});

const myNotificationTool = tool({
  description: 'Send a notification',
  inputSchema: z.object({
    message: z.string(),
    channel: z.enum(['slack', 'email', 'sms']),
  }),
  execute: async ({ message, channel }) => {
    // Your notification logic
    return notificationService.send(channel, message);
  },
});

// Combine everything
const result = await generateText({
  model: openai('gpt-4o'),
  tools: {
    // TPMJS registry tools
    searchRegistry: registrySearchTool,
    executeTool: registryExecuteTool,

    // Your own tools
    queryDatabase: myDatabaseTool,
    sendNotification: myNotificationTool,
  },
  maxSteps: 15,
  prompt: `
    1. Search for a web scraping tool
    2. Use it to scrape https://news.ycombinator.com
    3. Query our database for relevant past articles
    4. Send me a Slack notification with the summary
  `,
});
```

---

## Best Practices

### 1. Error Handling

Always wrap tool execution in proper error handling:

```typescript
const robustExecuteTool = tool({
  ...registryExecuteTool,
  async execute(input, options) {
    try {
      return await registryExecuteTool.execute(input);
    } catch (error) {
      // Log for debugging
      console.error(`Tool ${input.toolId} failed:`, error);

      // Return structured error instead of throwing
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        toolId: input.toolId,
      };
    }
  },
});
```

### 2. Timeout Handling

Implement timeouts to prevent hanging:

```typescript
async function executeWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Execution timed out')), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

const timeoutExecuteTool = tool({
  ...registryExecuteTool,
  async execute(input, options) {
    return executeWithTimeout(
      registryExecuteTool.execute(input),
      30000 // 30 second timeout
    );
  },
});
```

### 3. Rate Limiting

Prevent overwhelming the executor:

```typescript
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({ tokensPerInterval: 10, interval: 'second' });

const rateLimitedTool = tool({
  ...registryExecuteTool,
  async execute(input, options) {
    await limiter.removeTokens(1);
    return registryExecuteTool.execute(input);
  },
});
```

### 4. Security Considerations

- **Validate toolIds**: Ensure they match expected patterns
- **Sanitize params**: Remove potentially dangerous values
- **Limit env vars**: Only pass necessary environment variables
- **Use approval**: For sensitive operations, require human approval

```typescript
const secureTool = tool({
  ...registryExecuteTool,
  needsApproval: (input) => {
    // Require approval for tools that access sensitive resources
    const sensitivePatterns = [
      /database/i,
      /file/i,
      /email/i,
      /payment/i,
    ];
    return sensitivePatterns.some(p => p.test(input.toolId));
  },
  async execute(input, options) {
    // Validate toolId format
    if (!/^@[\w-]+\/[\w-]+::\w+$/.test(input.toolId)) {
      throw new Error('Invalid toolId format');
    }

    // Whitelist allowed env vars
    const allowedEnvVars = ['API_KEY', 'ACCESS_TOKEN', 'SECRET'];
    const filteredEnv = Object.fromEntries(
      Object.entries(input.env || {}).filter(([key]) =>
        allowedEnvVars.some(allowed => key.includes(allowed))
      )
    );

    return registryExecuteTool.execute({
      ...input,
      env: filteredEnv,
    });
  },
});
```

---

## API Reference

### `registrySearchTool`

```typescript
import { registrySearchTool } from '@tpmjs/registry-search';

// Input
type SearchInput = {
  query: string;           // Search keywords
  category?: string;       // Filter by category
  limit?: number;          // Max results (1-20, default 5)
};

// Output
type SearchOutput = {
  query: string;
  matchCount: number;
  tools: Array<{
    toolId: string;        // "package::exportName"
    name: string;
    package: string;
    description: string;
    category: string;
    requiredEnvVars: string[];
    healthStatus: string;
    qualityScore: number;
  }>;
};
```

### `registryExecuteTool`

```typescript
import { registryExecuteTool } from '@tpmjs/registry-execute';

// Input
type ExecuteInput = {
  toolId: string;                     // "package::exportName"
  params: Record<string, unknown>;    // Tool parameters
  env?: Record<string, string>;       // Environment variables
};

// Output
type ExecuteOutput = {
  toolId: string;
  executionTimeMs: number;
  output: unknown;                    // Tool-specific output
};
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TPMJS_API_URL` | Registry API URL | `https://tpmjs.com` |
| `TPMJS_EXECUTOR_URL` | Sandbox executor URL | `https://executor.tpmjs.com` |

---

## Sources

- [AI SDK Tool Reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool)
- [AI SDK Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [AI SDK Middleware](https://ai-sdk.dev/docs/ai-sdk-core/middleware)
- [AI SDK 6 Beta Announcement](https://v6.ai-sdk.dev/docs/announcing-ai-sdk-6-beta)
- [Dynamic Tools](https://ai-sdk.dev/docs/reference/ai-sdk-core/dynamic-tool)
- [MCP Tools Integration](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools)
- [AI SDK Workflow Patterns](https://ai-sdk.dev/docs/agents/workflows)
