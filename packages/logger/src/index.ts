import { randomUUID } from 'node:crypto';

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

const isProduction = process.env.NODE_ENV === 'production';

function formatLog(entry: LogEntry): string {
  if (isProduction) {
    return JSON.stringify(entry);
  }

  // Pretty-printed for development
  const { timestamp, level, message, ...rest } = entry;
  const time = new Date(timestamp).toLocaleTimeString();
  const levelLabel = level.toUpperCase().padEnd(5);
  const contextStr = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest, null, 2)}` : '';
  return `[${time}] ${levelLabel} ${message}${contextStr}`;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  baseContext: Record<string, unknown>,
  additionalContext?: Record<string, unknown>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...baseContext,
    ...(additionalContext || {}),
  };
}

export function createLogger(name: string): Logger {
  const baseContext: Record<string, unknown> = {
    service: name,
  };

  function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry = createLogEntry(level, message, baseContext, context);
    const formatted = formatLog(entry);

    if (level === 'error') {
      console.error(formatted);
    } else {
      console.log(formatted);
    }
  }

  return {
    debug(message: string, context?: Record<string, unknown>): void {
      log('debug', message, context);
    },

    info(message: string, context?: Record<string, unknown>): void {
      log('info', message, context);
    },

    warn(message: string, context?: Record<string, unknown>): void {
      log('warn', message, context);
    },

    error(message: string, context?: Record<string, unknown>): void {
      log('error', message, context);
    },

    withContext(context: Record<string, unknown>): Logger {
      const newContext = { ...baseContext, ...context };

      // Add requestId if not present
      if (!newContext.requestId) {
        newContext.requestId = randomUUID();
      }

      return {
        debug(message: string, ctx?: Record<string, unknown>): void {
          log('debug', message, { ...context, ...ctx });
        },

        info(message: string, ctx?: Record<string, unknown>): void {
          log('info', message, { ...context, ...ctx });
        },

        warn(message: string, ctx?: Record<string, unknown>): void {
          log('warn', message, { ...context, ...ctx });
        },

        error(message: string, ctx?: Record<string, unknown>): void {
          log('error', message, { ...context, ...ctx });
        },

        withContext(ctx: Record<string, unknown>): Logger {
          return createLogger(name).withContext({ ...newContext, ...ctx });
        },
      };
    },
  };
}
