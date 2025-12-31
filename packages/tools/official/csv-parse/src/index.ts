/**
 * CSV Parse Tool for TPMJS
 * Parses CSV text into array of objects using papaparse
 *
 * @requires Node.js 18+
 */

import { jsonSchema, tool } from 'ai';
import Papa from 'papaparse';

/**
 * Output interface for CSV parsing
 */
export interface CsvParseResult {
  rows: Record<string, string | number | boolean | null>[];
  headers: string[];
  rowCount: number;
  metadata: {
    parsedAt: string;
    hasErrors: boolean;
    errorCount: number;
    errors?: Array<{
      row: number;
      message: string;
    }>;
  };
}

type CsvParseInput = {
  csv: string;
  hasHeaders?: boolean;
};

/**
 * CSV Parse Tool
 * Parses CSV text into structured data with automatic type inference
 */
export const csvParseTool = tool({
  description:
    'Parse CSV text into an array of objects. Automatically detects headers and infers data types. Returns parsed rows, headers, and metadata. Useful for processing CSV data from files or API responses.',
  inputSchema: jsonSchema<CsvParseInput>({
    type: 'object',
    properties: {
      csv: {
        type: 'string',
        description: 'The CSV text to parse',
      },
      hasHeaders: {
        type: 'boolean',
        description: 'Whether the first row contains headers (default: true)',
        default: true,
      },
    },
    required: ['csv'],
    additionalProperties: false,
  }),
  async execute({ csv, hasHeaders = true }): Promise<CsvParseResult> {
    // Validate input
    if (!csv || typeof csv !== 'string') {
      throw new Error('CSV input is required and must be a string');
    }

    if (csv.trim().length === 0) {
      throw new Error('CSV input cannot be empty');
    }

    // Parse CSV with papaparse
    const parseResult = Papa.parse(csv, {
      header: hasHeaders,
      dynamicTyping: true, // Automatically convert numbers and booleans
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
    });

    // Extract headers
    let headers: string[];
    if (hasHeaders) {
      // Headers are automatically extracted by papaparse
      if (parseResult.data.length > 0) {
        headers = Object.keys(parseResult.data[0] as object);
      } else {
        headers = [];
      }
    } else {
      // Generate generic headers: col_0, col_1, etc.
      if (parseResult.data.length > 0) {
        const firstRow = parseResult.data[0] as unknown[];
        headers = firstRow.map((_, index) => `col_${index}`);

        // Convert array rows to objects with generic headers
        parseResult.data = parseResult.data.map((row) => {
          const rowArray = row as unknown[];
          const rowObject: Record<string, string | number | boolean | null> = {};
          headers.forEach((header, index) => {
            rowObject[header] = rowArray[index] as string | number | boolean | null;
          });
          return rowObject;
        });
      } else {
        headers = [];
      }
    }

    // Process errors
    const errors = parseResult.errors.map((error) => ({
      row: error.row ?? -1,
      message: error.message,
    }));

    // Build result
    const result: CsvParseResult = {
      rows: parseResult.data as Record<string, string | number | boolean | null>[],
      headers,
      rowCount: parseResult.data.length,
      metadata: {
        parsedAt: new Date().toISOString(),
        hasErrors: errors.length > 0,
        errorCount: errors.length,
        ...(errors.length > 0 ? { errors: errors.slice(0, 10) } : {}), // Limit to first 10 errors
      },
    };

    return result;
  },
});

export default csvParseTool;
