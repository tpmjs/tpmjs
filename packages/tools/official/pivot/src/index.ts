/**
 * Pivot Tool for TPMJS
 * Transforms array data from row format to column format (pivot table transformation).
 * Useful for reshaping data for analysis, reporting, and visualization.
 *
 * Domain rule: pivot_transformation - Transforms row-oriented data to column-oriented (pivot table)
 * Domain rule: value_aggregation - Aggregates multiple values (sum for numbers, concatenate for strings)
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for pivot transformation
 */
export interface PivotResult {
  pivoted: Array<Record<string, unknown>>;
  columns: string[];
  rowCount: number;
  metadata: {
    uniqueRows: number;
    uniqueColumns: number;
    totalCells: number;
    nullCells: number;
  };
}

type PivotInput = {
  rows: Array<Record<string, unknown>>;
  rowKey: string;
  columnKey: string;
  valueKey: string;
};

/**
 * Domain rule: value_aggregation - Aggregates multiple values into a single value
 * For numbers: sum
 * For strings: concatenate with comma
 * For arrays: flatten
 * For others: take first value
 */
function aggregateValues(values: unknown[]): unknown {
  if (values.length === 0) return null;
  if (values.length === 1) return values[0];

  // Check if all values are numbers
  const allNumbers = values.every((v) => typeof v === 'number');
  if (allNumbers) {
    return (values as number[]).reduce((sum, val) => sum + val, 0);
  }

  // Check if all values are strings
  const allStrings = values.every((v) => typeof v === 'string');
  if (allStrings) {
    return (values as string[]).join(', ');
  }

  // Check if all values are arrays
  const allArrays = values.every((v) => Array.isArray(v));
  if (allArrays) {
    return (values as unknown[][]).flat();
  }

  // Default: return first non-null value
  return values.find((v) => v !== null && v !== undefined) ?? null;
}

/**
 * Domain rule: pivot_transformation - Pivots array data from row format to column format
 */
function pivotData(
  rows: Array<Record<string, unknown>>,
  rowKey: string,
  columnKey: string,
  valueKey: string
): {
  pivoted: Array<Record<string, unknown>>;
  columns: string[];
  uniqueRows: number;
  uniqueColumns: number;
  totalCells: number;
  nullCells: number;
} {
  // Collect all unique column values and row values
  const columnValues = new Set<string>();
  const rowValues = new Set<string>();
  // Map of (rowValue -> (colValue -> array of values))
  const pivotMap = new Map<string, Map<string, unknown[]>>();

  for (const row of rows) {
    const rowValue = String(row[rowKey] ?? '');
    const colValue = String(row[columnKey] ?? '');
    const cellValue = row[valueKey];

    rowValues.add(rowValue);
    columnValues.add(colValue);

    if (!pivotMap.has(rowValue)) {
      pivotMap.set(rowValue, new Map());
    }

    const rowData = pivotMap.get(rowValue)!;
    if (!rowData.has(colValue)) {
      rowData.set(colValue, []);
    }

    // Accumulate values for aggregation
    rowData.get(colValue)!.push(cellValue);
  }

  // Build pivoted array
  const columns = Array.from(columnValues).sort();
  const pivoted: Array<Record<string, unknown>> = [];
  let totalCells = 0;
  let nullCells = 0;

  for (const rowValue of Array.from(rowValues).sort()) {
    const pivotedRow: Record<string, unknown> = {
      [rowKey]: rowValue,
    };

    const rowData = pivotMap.get(rowValue)!;

    for (const col of columns) {
      const values = rowData.get(col);
      // Aggregate multiple values
      const value = values ? aggregateValues(values) : null;
      pivotedRow[col] = value;
      totalCells++;

      if (value === undefined || value === null) {
        nullCells++;
      }
    }

    pivoted.push(pivotedRow);
  }

  return {
    pivoted,
    columns,
    uniqueRows: rowValues.size,
    uniqueColumns: columnValues.size,
    totalCells,
    nullCells,
  };
}

/**
 * Pivot Tool
 * Transforms row data into column format (pivot table)
 */
export const pivotTool = tool({
  description:
    'Pivot array data from row format to column format. Takes an array of objects and transforms it into a pivot table where one field becomes row identifiers, another becomes column names, and a third provides the cell values. Useful for reshaping data for analysis, creating summary tables, and data visualization.',
  inputSchema: jsonSchema<PivotInput>({
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        description: 'Array of objects to pivot',
        items: {
          type: 'object',
        },
      },
      rowKey: {
        type: 'string',
        description: 'The field name to use as row identifiers in the pivoted output',
      },
      columnKey: {
        type: 'string',
        description: 'The field name whose values will become column names in the pivoted output',
      },
      valueKey: {
        type: 'string',
        description: 'The field name whose values will populate the cells of the pivot table',
      },
    },
    required: ['rows', 'rowKey', 'columnKey', 'valueKey'],
    additionalProperties: false,
  }),
  async execute({ rows, rowKey, columnKey, valueKey }): Promise<PivotResult> {
    // Validate inputs
    if (!Array.isArray(rows)) {
      throw new Error('rows must be an array');
    }

    if (!rowKey || typeof rowKey !== 'string') {
      throw new Error('rowKey is required and must be a string');
    }

    if (!columnKey || typeof columnKey !== 'string') {
      throw new Error('columnKey is required and must be a string');
    }

    if (!valueKey || typeof valueKey !== 'string') {
      throw new Error('valueKey is required and must be a string');
    }

    // Handle empty array
    if (rows.length === 0) {
      return {
        pivoted: [],
        columns: [],
        rowCount: 0,
        metadata: {
          uniqueRows: 0,
          uniqueColumns: 0,
          totalCells: 0,
          nullCells: 0,
        },
      };
    }

    // Validate that rows contain objects
    if (!rows.every((row) => typeof row === 'object' && row !== null)) {
      throw new Error('All items in rows must be objects');
    }

    // Check if keys exist in at least one row
    const hasRowKey = rows.some((row) => rowKey in row);
    const hasColumnKey = rows.some((row) => columnKey in row);
    const hasValueKey = rows.some((row) => valueKey in row);

    if (!hasRowKey) {
      throw new Error(`rowKey "${rowKey}" not found in any row`);
    }

    if (!hasColumnKey) {
      throw new Error(`columnKey "${columnKey}" not found in any row`);
    }

    if (!hasValueKey) {
      throw new Error(`valueKey "${valueKey}" not found in any row`);
    }

    // Perform the pivot
    const { pivoted, columns, uniqueRows, uniqueColumns, totalCells, nullCells } = pivotData(
      rows,
      rowKey,
      columnKey,
      valueKey
    );

    return {
      pivoted,
      columns,
      rowCount: pivoted.length,
      metadata: {
        uniqueRows,
        uniqueColumns,
        totalCells,
        nullCells,
      },
    };
  },
});

export default pivotTool;
