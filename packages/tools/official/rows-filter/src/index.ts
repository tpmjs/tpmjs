/**
 * Rows Filter Tool for TPMJS
 * Filters an array of objects by a predicate with support for various comparison operators
 */

import { jsonSchema, tool } from 'ai';

/**
 * Supported comparison operators
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';

/**
 * Output interface for the filter result
 */
export interface FilterResult {
  rows: Record<string, unknown>[];
  matchCount: number;
  totalCount: number;
}

type RowsFilterInput = {
  rows: Record<string, unknown>[];
  field: string;
  operator: FilterOperator;
  value: unknown;
};

/**
 * Gets a nested field value from an object using dot notation
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
 * Compares two values based on the operator
 */
function compareValues(
  fieldValue: unknown,
  operator: FilterOperator,
  targetValue: unknown
): boolean {
  switch (operator) {
    case 'eq':
      return fieldValue === targetValue;

    case 'ne':
      return fieldValue !== targetValue;

    case 'gt':
      if (typeof fieldValue === 'number' && typeof targetValue === 'number') {
        return fieldValue > targetValue;
      }
      if (typeof fieldValue === 'string' && typeof targetValue === 'string') {
        return fieldValue > targetValue;
      }
      return false;

    case 'lt':
      if (typeof fieldValue === 'number' && typeof targetValue === 'number') {
        return fieldValue < targetValue;
      }
      if (typeof fieldValue === 'string' && typeof targetValue === 'string') {
        return fieldValue < targetValue;
      }
      return false;

    case 'gte':
      if (typeof fieldValue === 'number' && typeof targetValue === 'number') {
        return fieldValue >= targetValue;
      }
      if (typeof fieldValue === 'string' && typeof targetValue === 'string') {
        return fieldValue >= targetValue;
      }
      return false;

    case 'lte':
      if (typeof fieldValue === 'number' && typeof targetValue === 'number') {
        return fieldValue <= targetValue;
      }
      if (typeof fieldValue === 'string' && typeof targetValue === 'string') {
        return fieldValue <= targetValue;
      }
      return false;

    case 'contains':
      if (typeof fieldValue === 'string' && typeof targetValue === 'string') {
        return fieldValue.toLowerCase().includes(targetValue.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.some((item) => {
          if (typeof item === 'string' && typeof targetValue === 'string') {
            return item.toLowerCase().includes(targetValue.toLowerCase());
          }
          return item === targetValue;
        });
      }
      return false;

    default:
      return false;
  }
}

/**
 * Rows Filter Tool
 * Filters an array of objects by a field comparison
 */
export const rowsFilterTool = tool({
  description:
    'Filter an array of objects by comparing a field value against a target value. Supports operators: eq (equals), ne (not equals), gt (greater than), lt (less than), gte (greater than or equal), lte (less than or equal), contains (string/array contains). Returns filtered rows with match statistics.',
  inputSchema: jsonSchema<RowsFilterInput>({
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        description: 'Array of objects to filter',
        items: {
          type: 'object',
        },
      },
      field: {
        type: 'string',
        description:
          'Field name to filter on (supports dot notation for nested fields, e.g., "user.name")',
      },
      operator: {
        type: 'string',
        enum: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'contains'],
        description: 'Comparison operator to use',
      },
      value: {
        description:
          'Value to compare against (type should match the field type for numeric/string comparisons)',
      },
    },
    required: ['rows', 'field', 'operator', 'value'],
    additionalProperties: false,
  }),
  async execute({ rows, field, operator, value }): Promise<FilterResult> {
    // Validate inputs
    if (!Array.isArray(rows)) {
      throw new Error('rows must be an array');
    }

    if (!field || typeof field !== 'string') {
      throw new Error('field must be a non-empty string');
    }

    const validOperators: FilterOperator[] = ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'contains'];
    if (!validOperators.includes(operator as FilterOperator)) {
      throw new Error(`operator must be one of: ${validOperators.join(', ')}`);
    }

    // Filter rows
    const filteredRows = rows.filter((row) => {
      if (typeof row !== 'object' || row === null) {
        return false;
      }

      const fieldValue = getFieldValue(row as Record<string, unknown>, field);
      return compareValues(fieldValue, operator, value);
    });

    return {
      rows: filteredRows as Record<string, unknown>[],
      matchCount: filteredRows.length,
      totalCount: rows.length,
    };
  },
});

export default rowsFilterTool;
