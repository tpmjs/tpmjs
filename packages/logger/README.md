# @tpmjs/logger

Structured JSON logger for TPMJS packages.

## Features

- Structured JSON output in production
- Pretty-printed logs in development
- Log levels: debug, info, warn, error
- Service name and request ID tracking
- Context chaining with `withContext()`
- Auto-generated request IDs using crypto.randomUUID()
- No dependencies

## Usage

```typescript
import { createLogger } from '@tpmjs/logger';

const logger = createLogger('my-service');

// Basic logging
logger.info('Server started', { port: 3000 });
logger.warn('High memory usage', { memoryMB: 512 });
logger.error('Database connection failed', { error: 'ECONNREFUSED' });
logger.debug('Request received', { method: 'GET', path: '/api/users' });

// Create a child logger with persistent context
const requestLogger = logger.withContext({
  requestId: '123-456-789',
  userId: 'user_abc',
});

requestLogger.info('Processing request');
// Output: { timestamp: "...", level: "info", message: "Processing request", service: "my-service", requestId: "123-456-789", userId: "user_abc" }

// Auto-generate requestId if not provided
const autoLogger = logger.withContext({});
autoLogger.info('Request processed');
// Output includes auto-generated requestId from crypto.randomUUID()
```

## Output Format

### Production (NODE_ENV=production)

```json
{"timestamp":"2025-01-07T12:00:00.000Z","level":"info","message":"Server started","service":"my-service","port":3000}
```

### Development

```
[12:00:00] INFO  Server started { service: "my-service", port: 3000 }
```

## API

### createLogger(name: string): Logger

Create a logger instance with the given service name.

```typescript
const logger = createLogger('api-server');
```

### logger.debug(message, context?)

Log a debug message with optional context.

### logger.info(message, context?)

Log an info message with optional context.

### logger.warn(message, context?)

Log a warning message with optional context.

### logger.error(message, context?)

Log an error message with optional context. Uses `console.error` instead of `console.log`.

### logger.withContext(context): Logger

Create a child logger with persistent context fields. If `requestId` is not in the context, one is auto-generated.

```typescript
const childLogger = logger.withContext({
  requestId: 'req_123',
  userId: 'user_456',
});

childLogger.info('User action');
// All logs from childLogger will include requestId and userId
```

## Types

```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  withContext(context: Record<string, unknown>): Logger;
}
```

## License

MIT
