/**
 * CSV Stringify Tool for TPMJS
 * Converts array of objects to CSV string using papaparse
 *
 * @requires Node.js 18+
 */

import { jsonSchema, tool } from 'ai';
import Papa from 'papaparse';

/**
 * Output interface for CSV stringification
 */
export interface CsvStringifyResult {
  csv: string;
  rowCount: number;
  metadata: {
    headers: string[];
    stringifiedAt: string;
    byteSize: number;
  };
}

type CsvStringifyInput = {
  rows: Record<string, unknown>[];
  headers?: string[];
};

/**
 * CSV Stringify Tool
 * Converts array of objects to CSV format with optional custom headers
 */
export const csvStringifyTool = tool({
  description:
    'Convert an array of objects to CSV string format. Optionally specify custom headers. Returns the CSV string, row count, and metadata. Useful for exporting data to CSV files or API responses.',
  inputSchema: jsonSchema<CsvStringifyInput>({
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        description: 'Array of objects to convert to CSV',
        items: {
          type: 'object',
          additionalProperties: true,
        },
      },
      headers: {
        type: 'array',
        description:
          'Optional array of header names. If not provided, uses object keys from first row.',
        items: {
          type: 'string',
        },
      },
    },
    required: ['rows'],
    additionalProperties: false,
  }),
  async execute({ rows, headers }): Promise<CsvStringifyResult> {
    // Validate input
    if (!rows || !Array.isArray(rows)) {
      throw new Error('Rows must be an array');
    }

    if (rows.length === 0) {
      throw new Error('Rows array cannot be empty');
    }

    // Validate that all rows are objects
    if (!rows.every((row) => typeof row === 'object' && row !== null && !Array.isArray(row))) {
      throw new Error('All rows must be objects (not arrays or primitives)');
    }

    // Determine headers
    let actualHeaders: string[];
    if (headers && headers.length > 0) {
      // Validate custom headers
      if (!Array.isArray(headers)) {
        throw new Error('Headers must be an array of strings');
      }
      if (!headers.every((h) => typeof h === 'string')) {
        throw new Error('All headers must be strings');
      }
      actualHeaders = headers;
    } else {
      // Extract headers from first row
      const firstRow = rows[0];
      if (!firstRow) {
        throw new Error('Cannot determine headers from empty first row');
      }
      actualHeaders = Object.keys(firstRow);
    }

    if (actualHeaders.length === 0) {
      throw new Error('No headers found. Either provide headers or ensure rows have properties.');
    }

    // Convert to CSV using papaparse
    const csv = Papa.unparse(rows, {
      columns: actualHeaders,
      header: true,
      skipEmptyLines: false,
      newline: '\n',
    });

    // Calculate byte size
    const byteSize = new TextEncoder().encode(csv).length;

    // Build result
    const result: CsvStringifyResult = {
      csv,
      rowCount: rows.length,
      metadata: {
        headers: actualHeaders,
        stringifiedAt: new Date().toISOString(),
        byteSize,
      },
    };

    return result;
  },
});

export default csvStringifyTool;
