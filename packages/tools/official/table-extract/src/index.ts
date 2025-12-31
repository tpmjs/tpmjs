/**
 * Table Extract Tool for TPMJS
 * Extracts HTML tables from web pages and converts them to structured data.
 * Supports tables with <thead> headers or first-row headers.
 *
 * @requires Node.js 18+ (uses native fetch API)
 */

import { jsonSchema, tool } from 'ai';
import * as cheerio from 'cheerio';

// Verify fetch is available (Node.js 18+)
if (typeof globalThis.fetch !== 'function') {
  throw new Error('Table Extract tool requires Node.js 18+ with native fetch support');
}

/**
 * Represents a structured table with headers and rows
 */
export interface StructuredTable {
  headers: string[];
  rows: Array<Record<string, string>>;
  rowCount: number;
  columnCount: number;
  caption?: string;
}

/**
 * Output interface for table extraction
 */
export interface TableExtraction {
  url: string;
  tables: StructuredTable[];
  tableCount: number;
  metadata: {
    fetchedAt: string;
    domain: string;
  };
}

type TableExtractInput = {
  url: string;
  tableIndex?: number;
};

/**
 * Validates that a string is a valid URL
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts domain from URL
 */
function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Normalizes header text (lowercase, trim, remove special chars)
 */
function normalizeHeader(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50); // Limit length
}

/**
 * Extracts structured data from a table element
 */
function extractTableData($: cheerio.Root, table: cheerio.Element): StructuredTable | null {
  const $table = $(table);

  // Extract caption if present
  const caption = $table.find('caption').first().text().trim() || undefined;

  // Try to find headers in <thead>
  let headers: string[] = [];
  const $thead = $table.find('thead');

  if ($thead.length > 0) {
    $thead
      .find('tr')
      .first()
      .find('th, td')
      .each((_, cell) => {
        headers.push($(cell).text().trim());
      });
  }

  // If no <thead>, check if first row has <th> elements
  if (headers.length === 0) {
    const $firstRow = $table.find('tr').first();
    const $thCells = $firstRow.find('th');

    if ($thCells.length > 0) {
      $thCells.each((_, cell) => {
        headers.push($(cell).text().trim());
      });
    }
  }

  // If still no headers, use first row as headers
  const $tbody = $table.find('tbody');
  const $rows = $tbody.length > 0 ? $tbody.find('tr') : $table.find('tr');

  if (headers.length === 0 && $rows.length > 0) {
    const $firstRow = $rows.first();
    $firstRow.find('td, th').each((i, cell) => {
      const text = $(cell).text().trim();
      headers.push(text || `column_${i + 1}`);
    });

    // Remove first row from data rows since we used it as headers
    $rows.first().remove();
  }

  // If we still have no headers, generate generic ones
  if (headers.length === 0) {
    // Find the maximum number of columns
    let maxCols = 0;
    $rows.each((_, row) => {
      const colCount = $(row).find('td, th').length;
      if (colCount > maxCols) maxCols = colCount;
    });

    headers = Array.from({ length: maxCols }, (_, i) => `column_${i + 1}`);
  }

  // Normalize headers for use as object keys
  const normalizedHeaders = headers.map((h, i) => {
    const normalized = normalizeHeader(h);
    return normalized || `column_${i + 1}`;
  });

  // Extract data rows
  const rows: Array<Record<string, string>> = [];
  $rows.each((_, row) => {
    const $cells = $(row).find('td, th');

    // Skip empty rows
    if ($cells.length === 0) return;

    const rowData: Record<string, string> = {};
    $cells.each((i, cell) => {
      const header = normalizedHeaders[i] || `column_${i + 1}`;
      const value = $(cell).text().trim();
      rowData[header] = value;
    });

    // Only add rows that have at least one non-empty value
    if (Object.values(rowData).some((v) => v !== '')) {
      rows.push(rowData);
    }
  });

  // Skip tables with no data
  if (rows.length === 0) {
    return null;
  }

  return {
    headers,
    rows,
    rowCount: rows.length,
    columnCount: headers.length,
    ...(caption && { caption }),
  };
}

/**
 * Table Extract Tool
 * Fetches a URL and extracts HTML tables as structured data
 */
export const tableExtractTool = tool({
  description:
    'Extract HTML tables from web pages and convert them to structured data. Tables are parsed with headers (from <thead>, <th>, or first row) and converted to arrays of objects. You can extract all tables or a specific table by index. Useful for extracting data from comparison tables, pricing tables, statistical data, and more.',
  inputSchema: jsonSchema<TableExtractInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch and extract tables from (must be http or https)',
      },
      tableIndex: {
        type: 'number',
        description:
          'Optional: Which table to extract (0-based index). If not provided, extracts all tables.',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url, tableIndex }): Promise<TableExtraction> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}. Must be a valid http or https URL.`);
    }

    // Validate tableIndex if provided
    if (tableIndex !== undefined) {
      if (typeof tableIndex !== 'number' || tableIndex < 0 || !Number.isInteger(tableIndex)) {
        throw new Error('tableIndex must be a non-negative integer');
      }
    }

    // Fetch the page
    let html: string;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TPMJSBot/1.0; +https://tpmjs.com)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new Error(`Invalid content type: ${contentType}. Expected HTML content.`);
      }

      html = await response.text();

      if (!html || html.trim().length === 0) {
        throw new Error('Received empty response from server');
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request to ${url} timed out after 30 seconds`);
        }
        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
          throw new Error(`DNS resolution failed for ${url}. Check the domain name.`);
        }
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error(`Connection refused to ${url}. The server may be down.`);
        }
        if (error.message.includes('CERT_')) {
          throw new Error(
            `SSL certificate error for ${url}. The site may have an invalid certificate.`
          );
        }
        throw new Error(`Failed to fetch URL ${url}: ${error.message}`);
      }
      throw new Error(`Failed to fetch URL ${url}: Unknown network error`);
    }

    // Parse HTML with cheerio
    const $ = cheerio.load(html);

    // Extract all tables
    const allTables: StructuredTable[] = [];
    $('table').each((_, table) => {
      const structuredTable = extractTableData($, table as cheerio.Element);
      if (structuredTable) {
        allTables.push(structuredTable);
      }
    });

    // If tableIndex is specified, return only that table
    let tables: StructuredTable[];
    if (tableIndex !== undefined) {
      if (tableIndex >= allTables.length) {
        throw new Error(
          `Table index ${tableIndex} out of range. Page has ${allTables.length} table(s).`
        );
      }
      const selectedTable = allTables[tableIndex];
      if (!selectedTable) {
        throw new Error(`Table at index ${tableIndex} is undefined`);
      }
      tables = [selectedTable];
    } else {
      tables = allTables;
    }

    return {
      url,
      tables,
      tableCount: allTables.length,
      metadata: {
        fetchedAt: new Date().toISOString(),
        domain: extractDomain(url),
      },
    };
  },
});

export default tableExtractTool;
