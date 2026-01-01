/**
 * Rows Sort Tool for TPMJS
 * Sorts an array of objects by one or more fields with customizable direction
 *
 * Domain rule: multi_level_sorting - Supports multi-level sorting with nested field access
 * Domain rule: type_aware_comparison - Uses type-aware comparison (numbers, strings, dates, booleans)
 */

import { jsonSchema, tool } from 'ai';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort specification for a single field
 */
export interface SortSpec {
  field: string;
  direction: SortDirection;
}

/**
 * Output interface for the sort result
 */
export interface SortResult {
  rows: Record<string, unknown>[];
  sortedBy: SortSpec[];
}

type RowsSortInput = {
  rows: Record<string, unknown>[];
  sortBy: SortSpec[];
};

/**
 * Domain rule: nested_field_access - Gets a nested field value from an object using dot notation
 */
function getFieldValue(obj: Record<string, unknown>, field: string): unknown {
  const parts = field.split('.');
  let value: unknown = obj;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Domain rule: type_aware_comparison - Compares two values for sorting with type awareness
 * Returns: -1 if a < b, 1 if a > b, 0 if equal
 */
function compareValues(a: unknown, b: unknown): number {
  // Handle null/undefined
  if (a === null || a === undefined) {
    if (b === null || b === undefined) return 0;
    return -1; // null/undefined sorts before everything
  }
  if (b === null || b === undefined) {
    return 1;
  }

  // Handle numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  // Handle strings
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  }

  // Handle booleans
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1;
  }

  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  // Convert to strings for other types
  const aStr = String(a);
  const bStr = String(b);
  return aStr.localeCompare(bStr);
}

/**
 * Rows Sort Tool
 * Sorts an array of objects by one or more fields
 */
export const rowsSortTool = tool({
  description:
    'Sort an array of objects by one or more fields. Supports multi-level sorting with customizable direction (ascending or descending) for each field. When multiple sort fields are provided, rows are sorted by the first field, then by the second field for ties, and so on.',
  inputSchema: jsonSchema<RowsSortInput>({
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        description: 'Array of objects to sort',
        items: {
          type: 'object',
        },
      },
      sortBy: {
        type: 'array',
        description: 'Array of sort specifications, applied in order for multi-level sorting',
        items: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              description: 'Field name to sort by (supports dot notation for nested fields)',
            },
            direction: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort direction: asc (ascending) or desc (descending)',
            },
          },
          required: ['field', 'direction'],
        },
        minItems: 1,
      },
    },
    required: ['rows', 'sortBy'],
    additionalProperties: false,
  }),
  async execute({ rows, sortBy }): Promise<SortResult> {
    // Validate inputs
    if (!Array.isArray(rows)) {
      throw new Error('rows must be an array');
    }

    if (!Array.isArray(sortBy) || sortBy.length === 0) {
      throw new Error('sortBy must be a non-empty array');
    }

    // Validate each sort spec
    for (const spec of sortBy) {
      if (!spec.field || typeof spec.field !== 'string') {
        throw new Error('Each sortBy item must have a field (string)');
      }
      if (spec.direction !== 'asc' && spec.direction !== 'desc') {
        throw new Error('Each sortBy item must have direction as "asc" or "desc"');
      }
    }

    // Create a copy of the array to avoid mutating the input
    const sortedRows = [...rows];

    // Domain rule: multi_level_sorting - Sort using multi-level comparison
    sortedRows.sort((a, b) => {
      if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
        return 0;
      }

      // Compare by each sort spec in order
      for (const spec of sortBy) {
        const aValue = getFieldValue(a as Record<string, unknown>, spec.field);
        const bValue = getFieldValue(b as Record<string, unknown>, spec.field);

        const comparison = compareValues(aValue, bValue);

        // If values are different, return based on direction
        if (comparison !== 0) {
          return spec.direction === 'asc' ? comparison : -comparison;
        }

        // If equal, continue to next sort spec
      }

      return 0; // All sort specs resulted in equality
    });

    return {
      rows: sortedRows as Record<string, unknown>[],
      sortedBy: sortBy,
    };
  },
});

export default rowsSortTool;
