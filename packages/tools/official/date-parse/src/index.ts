/**
 * Date Parse Tool for TPMJS
 * Parse dates in natural language formats using chrono-node
 *
 * @requires Node.js 18+
 */

import { jsonSchema, tool } from 'ai';
import * as chrono from 'chrono-node';

/**
 * Input interface for date parsing
 */
export interface DateParseInput {
  text: string;
  referenceDate?: string;
  strict?: boolean;
}

/**
 * Parsed date information
 */
export interface ParsedDate {
  parsed: string;
  original: string;
  iso: string;
  timestamp: number;
}

/**
 * Output interface for date parsing
 */
export interface DateParseResult {
  dates: ParsedDate[];
  count: number;
}

/**
 * Date Parse Tool
 * Parses natural language date expressions from text
 */
export const dateParseTool = tool({
  description:
    'Parse dates from natural language text like "tomorrow at 3pm", "next Friday", "in 2 weeks", or "December 25th, 2024". Returns all found dates with their original text, ISO format, and Unix timestamps.',
  inputSchema: jsonSchema<DateParseInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Text containing one or more date/time expressions',
      },
      referenceDate: {
        type: 'string',
        description:
          'ISO 8601 date string to use as reference for relative dates (e.g., "2024-01-15T10:00:00Z"). Defaults to current date/time.',
      },
      strict: {
        type: 'boolean',
        description:
          'Use strict parsing mode for more accurate results with fewer false positives (default: false)',
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute({ text, referenceDate, strict = false }): Promise<DateParseResult> {
    // Validate input
    if (typeof text !== 'string') {
      throw new Error('Text must be a string');
    }

    if (text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Parse reference date if provided
    let refDate: Date | undefined;
    if (referenceDate) {
      refDate = new Date(referenceDate);
      if (Number.isNaN(refDate.getTime())) {
        throw new Error(
          `Invalid reference date: ${referenceDate}. Must be a valid ISO 8601 date string.`
        );
      }
    }

    // Parse dates using chrono-node
    let parsedResults: chrono.ParsedResult[];
    try {
      if (strict) {
        parsedResults = chrono.strict.parse(text, refDate);
      } else {
        parsedResults = chrono.parse(text, refDate);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse dates: ${message}`);
    }

    // Convert to output format
    const dates: ParsedDate[] = parsedResults.map((result) => {
      const dateObj = result.start.date();
      return {
        parsed: dateObj.toLocaleString('en-US', {
          dateStyle: 'full',
          timeStyle: 'long',
        }),
        original: result.text,
        iso: dateObj.toISOString(),
        timestamp: dateObj.getTime(),
      };
    });

    return {
      dates,
      count: dates.length,
    };
  },
});

export default dateParseTool;
