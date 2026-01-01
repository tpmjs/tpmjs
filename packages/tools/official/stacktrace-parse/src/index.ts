/**
 * Stacktrace Parse Tool for TPMJS
 * Parses stack traces into structured frames, handling Node.js and browser formats
 */

import { jsonSchema, tool } from 'ai';
import { parse as parseStacktrace } from 'stacktrace-parser';

/**
 * Represents a single frame in the stack trace
 */
export interface StackFrame {
  file: string | null;
  methodName: string | null;
  lineNumber: number | null;
  column: number | null;
  arguments: string[];
}

/**
 * Output interface for the parsed stack trace
 */
export interface StackTraceResult {
  frames: StackFrame[];
  errorType: string | null;
  errorMessage: string | null;
  language: 'node' | 'browser' | 'unknown';
  totalFrames: number;
  summary: string;
}

type StackTraceParseInput = {
  stacktrace: string;
};

/**
 * Detects the error type and message from the stack trace
 * Domain rule: parsing - Extracts error type and message using regex patterns
 */
function extractErrorInfo(stacktrace: string): {
  errorType: string | null;
  errorMessage: string | null;
} {
  const lines = stacktrace.trim().split('\n');
  if (lines.length === 0) {
    return { errorType: null, errorMessage: null };
  }

  const firstLine = lines[0]?.trim();
  if (!firstLine) {
    return { errorType: null, errorMessage: null };
  }

  // Domain rule: parsing - Common error format pattern: "ErrorType: Error message"
  const errorMatch = firstLine.match(/^(\w+Error):\s*(.+)$/);
  if (errorMatch) {
    return {
      errorType: errorMatch[1] ?? null,
      errorMessage: errorMatch[2] ?? null,
    };
  }

  // Domain rule: parsing - Just error type pattern: "ErrorType"
  if (/^\w+Error$/.test(firstLine)) {
    return {
      errorType: firstLine,
      errorMessage: null,
    };
  }

  // Domain rule: parsing - Generic format with colon
  const colonMatch = firstLine.match(/^([^:]+):\s*(.+)$/);
  if (colonMatch) {
    return {
      errorType: colonMatch[1] ?? null,
      errorMessage: colonMatch[2] ?? null,
    };
  }

  // Fallback: treat entire first line as message
  return {
    errorType: null,
    errorMessage: firstLine,
  };
}

/**
 * Detects whether the stack trace is from Node.js or browser
 * Domain rule: language_support - Supports JavaScript/TypeScript stack traces (Node.js and browser)
 */
function detectLanguage(stacktrace: string): 'node' | 'browser' | 'unknown' {
  // Domain rule: language_support - Node.js indicators (node_modules, internal/, .js files)
  if (
    /at\s+\w+\s+\([^)]+\)/.test(stacktrace) &&
    (/node_modules/.test(stacktrace) ||
      /internal\//.test(stacktrace) ||
      /\.js:\d+:\d+/.test(stacktrace))
  ) {
    return 'node';
  }

  // Domain rule: language_support - Browser indicators (HTTP URLs, webpack)
  if (
    /https?:\/\//.test(stacktrace) ||
    /@https?:\/\//.test(stacktrace) ||
    /webpack:\/\//.test(stacktrace)
  ) {
    return 'browser';
  }

  // Domain rule: language_support - Typical Node.js pattern fallback
  if (/at\s+\w+/.test(stacktrace) && /:\d+:\d+/.test(stacktrace)) {
    return 'node';
  }

  return 'unknown';
}

/**
 * Stacktrace Parse Tool
 * Parses stack traces into structured frames
 */
export const stacktraceParse = tool({
  description:
    'Parses a stack trace string into structured frames with file, method name, line number, and column information. Handles both Node.js and browser stack trace formats. Useful for analyzing errors and debugging issues.',
  inputSchema: jsonSchema<StackTraceParseInput>({
    type: 'object',
    properties: {
      stacktrace: {
        type: 'string',
        description: 'The stack trace string to parse (from Node.js or browser)',
      },
    },
    required: ['stacktrace'],
    additionalProperties: false,
  }),
  async execute({ stacktrace }): Promise<StackTraceResult> {
    // Validate input
    if (typeof stacktrace !== 'string') {
      throw new Error('stacktrace must be a string');
    }

    if (stacktrace.trim().length === 0) {
      throw new Error('stacktrace cannot be empty');
    }

    // Extract error information
    const { errorType, errorMessage } = extractErrorInfo(stacktrace);

    // Detect language/environment
    const language = detectLanguage(stacktrace);

    // Domain rule: parsing - Uses stacktrace-parser library for parsing
    // Parse the stack trace
    let parsedFrames: Array<{
      file: string | null;
      methodName: string | null;
      lineNumber: number | null;
      column: number | null;
      arguments?: string[];
    }>;

    try {
      parsedFrames = parseStacktrace(stacktrace);
    } catch (error) {
      throw new Error(
        `Failed to parse stack trace: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Domain rule: classification - Converts frames to standard format with file, method, line, column
    const frames: StackFrame[] = parsedFrames.map((frame) => ({
      file: frame.file || null,
      methodName: frame.methodName || null,
      lineNumber:
        frame.lineNumber !== undefined && frame.lineNumber !== null ? frame.lineNumber : null,
      column: frame.column !== undefined && frame.column !== null ? frame.column : null,
      arguments: frame.arguments || [],
    }));

    // Create summary
    let summary: string;
    if (frames.length === 0) {
      summary = 'No stack frames parsed';
    } else {
      const parts: string[] = [];
      if (errorType) parts.push(errorType);
      if (errorMessage) parts.push(errorMessage);
      parts.push(`${frames.length} frame${frames.length !== 1 ? 's' : ''}`);
      summary = parts.join(' - ');
    }

    return {
      frames,
      errorType,
      errorMessage,
      language,
      totalFrames: frames.length,
      summary,
    };
  },
});

export default stacktraceParse;
