/**
 * Rows Group Aggregate Tool for TPMJS
 * Groups rows by a key field and aggregates values using operations like sum, count, avg, min, max
 */

import { jsonSchema, tool } from 'ai';

/**
 * Supported aggregation operations
 */
export type AggregateOperation = 'sum' | 'count' | 'avg' | 'min' | 'max';

/**
 * Definition of an aggregation to perform
 */
export interface AggregateDefinition {
  field: string;
  operation: AggregateOperation;
}

/**
 * Result of grouping and aggregating rows
 */
export interface GroupAggregateResult {
  groups: Array<{
    groupKey: string | number | null;
    aggregates: Record<string, number>;
    rowCount: number;
  }>;
  groupCount: number;
}

type RowsGroupAggregateInput = {
  rows: Array<Record<string, any>>;
  groupBy: string;
  aggregates: AggregateDefinition[];
};

/**
 * Gets the value from an object by field path
 */
function getFieldValue(obj: Record<string, any>, field: string): any {
  const parts = field.split('.');
  let value: any = obj;
  for (const part of parts) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[part];
  }
  return value;
}

/**
 * Converts value to number, returns NaN if not convertible
 */
function toNumber(value: any): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }
  return Number.NaN;
}

/**
 * Performs aggregation on a group of rows
 */
function performAggregation(
  rows: Array<Record<string, any>>,
  aggregates: AggregateDefinition[]
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const agg of aggregates) {
    const key = `${agg.field}_${agg.operation}`;

    if (agg.operation === 'count') {
      result[key] = rows.length;
      continue;
    }

    // Extract values for this field
    const values = rows
      .map((row) => getFieldValue(row, agg.field))
      .map(toNumber)
      .filter((n) => !Number.isNaN(n));

    if (values.length === 0) {
      result[key] = 0;
      continue;
    }

    switch (agg.operation) {
      case 'sum':
        result[key] = values.reduce((acc, val) => acc + val, 0);
        break;

      case 'avg':
        result[key] = values.reduce((acc, val) => acc + val, 0) / values.length;
        break;

      case 'min':
        result[key] = Math.min(...values);
        break;

      case 'max':
        result[key] = Math.max(...values);
        break;

      default:
        result[key] = 0;
    }
  }

  return result;
}

/**
 * Rows Group Aggregate Tool
 * Groups rows by a key field and performs aggregation operations
 */
export const rowsGroupAggregateTool = tool({
  description:
    'Groups an array of objects by a specified key field and performs aggregation operations (sum, count, avg, min, max) on other fields. Useful for analyzing data by categories or creating summary statistics.',
  inputSchema: jsonSchema<RowsGroupAggregateInput>({
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        description: 'Array of objects to group and aggregate',
        items: {
          type: 'object',
        },
      },
      groupBy: {
        type: 'string',
        description: 'The field name to group by (supports nested fields with dot notation)',
      },
      aggregates: {
        type: 'array',
        description:
          'Array of aggregation operations to perform on each group. Each operation specifies a field and operation type.',
        items: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              description: 'Field name to aggregate (supports nested fields with dot notation)',
            },
            operation: {
              type: 'string',
              enum: ['sum', 'count', 'avg', 'min', 'max'],
              description:
                'Aggregation operation: sum (total), count (count rows), avg (average), min (minimum), max (maximum)',
            },
          },
          required: ['field', 'operation'],
        },
      },
    },
    required: ['rows', 'groupBy', 'aggregates'],
    additionalProperties: false,
  }),
  async execute({ rows, groupBy, aggregates }): Promise<GroupAggregateResult> {
    // Validate inputs
    if (!Array.isArray(rows)) {
      throw new Error('rows must be an array');
    }

    if (!groupBy || typeof groupBy !== 'string') {
      throw new Error('groupBy must be a non-empty string');
    }

    if (!Array.isArray(aggregates) || aggregates.length === 0) {
      throw new Error('aggregates must be a non-empty array');
    }

    // Validate each aggregate definition
    for (const agg of aggregates) {
      if (!agg.field || typeof agg.field !== 'string') {
        throw new Error('Each aggregate must have a field name');
      }
      if (!['sum', 'count', 'avg', 'min', 'max'].includes(agg.operation)) {
        throw new Error(
          `Invalid operation "${agg.operation}". Must be one of: sum, count, avg, min, max`
        );
      }
    }

    // Handle empty input
    if (rows.length === 0) {
      return {
        groups: [],
        groupCount: 0,
      };
    }

    // Group rows by the specified field
    const groupMap = new Map<string | number | null, Array<Record<string, any>>>();

    for (const row of rows) {
      const groupValue = getFieldValue(row, groupBy);

      // Convert group value to a key (handle null/undefined)
      let groupKey: string | number | null;
      if (groupValue === null || groupValue === undefined) {
        groupKey = null;
      } else if (typeof groupValue === 'number' || typeof groupValue === 'string') {
        groupKey = groupValue;
      } else {
        // For complex objects, stringify them
        groupKey = JSON.stringify(groupValue);
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)?.push(row);
    }

    // Perform aggregations for each group
    const groups = Array.from(groupMap.entries()).map(([groupKey, groupRows]) => ({
      groupKey,
      aggregates: performAggregation(groupRows, aggregates),
      rowCount: groupRows.length,
    }));

    return {
      groups,
      groupCount: groups.length,
    };
  },
});

export default rowsGroupAggregateTool;
