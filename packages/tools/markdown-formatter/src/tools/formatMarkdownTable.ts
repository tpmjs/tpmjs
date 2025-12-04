import { tool } from 'ai';
import { z } from 'zod';

const FormatMarkdownTableSchema = z.object({
  table: z.string().min(1, 'Table text cannot be empty').describe('The markdown table to format'),
  alignment: z
    .enum(['left', 'center', 'right'])
    .default('left')
    .describe('Text alignment for all columns'),
});

export const formatMarkdownTable = tool({
  description: 'Format and align markdown table columns for better readability',
  inputSchema: FormatMarkdownTableSchema,
  async execute(input: z.infer<typeof FormatMarkdownTableSchema>) {
    const { table, alignment } = input;

    // Defensive check: Validate required parameters
    if (!table || table.trim().length === 0) {
      return {
        success: false,
        error: 'Missing required parameter: table',
        formattedTable: '',
        rowCount: 0,
        columnCount: 0,
      };
    }

    // Split into lines and remove empty lines
    const lines = table
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.startsWith('|'));

    if (lines.length < 2) {
      return {
        success: false,
        error: 'Invalid table format: need at least header and separator rows',
        formattedTable: table,
        rowCount: lines.length,
        columnCount: 0,
      };
    }

    // Parse table rows
    const rows = lines.map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim())
    );

    // Calculate column widths
    const columnCount = rows[0]?.length || 0;
    const columnWidths = new Array(columnCount).fill(0);

    for (const row of rows) {
      for (let i = 0; i < row.length; i++) {
        const cell = row[i];
        const currentWidth = columnWidths[i];
        // Skip separator row when calculating widths
        if (cell && !cell.match(/^:?-+:?$/)) {
          columnWidths[i] = Math.max(currentWidth || 0, cell.length);
        }
      }
    }

    // Format alignment markers
    const alignmentMarkers = columnWidths.map((width) => {
      const dashes = '-'.repeat(Math.max(3, width));
      if (alignment === 'center') return `:${dashes}:`;
      if (alignment === 'right') return `${dashes}:`;
      return dashes;
    });

    // Build formatted table
    const formattedRows: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;

      // Check if this is the separator row
      if (i === 1 && row.every((cell) => cell.match(/^:?-+:?$/))) {
        // Replace with formatted separator
        formattedRows.push(`| ${alignmentMarkers.join(' | ')} |`);
      } else {
        // Format data row
        const formattedCells = row.map((cell, j) => {
          const width = columnWidths[j] || 0;
          return cell.padEnd(width, ' ');
        });
        formattedRows.push(`| ${formattedCells.join(' | ')} |`);
      }
    }

    return {
      success: true,
      formattedTable: formattedRows.join('\n'),
      rowCount: rows.length - 1, // Exclude separator row
      columnCount,
      alignment,
    };
  },
});
