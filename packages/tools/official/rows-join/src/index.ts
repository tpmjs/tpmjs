/**
 * Rows Join Tool for TPMJS
 * Joins two arrays of objects by key fields, supporting inner, left, right, and full outer joins
 */

import { jsonSchema, tool } from 'ai';

/**
 * Supported join types
 */
export type JoinType = 'inner' | 'left' | 'right' | 'full';

/**
 * Result of joining two arrays
 */
export interface JoinResult {
  rows: Array<Record<string, any>>;
  matchedCount: number;
  unmatchedLeft: number;
  unmatchedRight: number;
}

type RowsJoinInput = {
  left: Array<Record<string, any>>;
  right: Array<Record<string, any>>;
  leftKey: string;
  rightKey: string;
  type?: JoinType;
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
 * Converts a value to a string key for matching
 */
function toKey(value: any): string {
  if (value === null || value === undefined) {
    return '__NULL__';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Merges two objects, prefixing keys to avoid collisions
 */
function mergeRows(
  leftRow: Record<string, any> | null,
  rightRow: Record<string, any> | null,
  leftKey: string,
  rightKey: string
): Record<string, any> {
  const result: Record<string, any> = {};

  // Add left row fields with 'left_' prefix
  if (leftRow) {
    for (const [key, value] of Object.entries(leftRow)) {
      result[`left_${key}`] = value;
    }
  }

  // Add right row fields with 'right_' prefix
  if (rightRow) {
    for (const [key, value] of Object.entries(rightRow)) {
      result[`right_${key}`] = value;
    }
  }

  // Add the join key without prefix for convenience
  if (leftRow && rightRow) {
    const joinValue = getFieldValue(leftRow, leftKey);
    result.joinKey = joinValue;
  } else if (leftRow) {
    result.joinKey = getFieldValue(leftRow, leftKey);
  } else if (rightRow) {
    result.joinKey = getFieldValue(rightRow, rightKey);
  }

  return result;
}

/**
 * Rows Join Tool
 * Joins two arrays of objects by key fields
 */
export const rowsJoinTool = tool({
  description:
    'Joins two arrays of objects by matching key fields. Supports inner join (only matches), left join (all left + matches), right join (all right + matches), and full outer join (all from both). Fields are prefixed with left_ and right_ to avoid collisions.',
  inputSchema: jsonSchema<RowsJoinInput>({
    type: 'object',
    properties: {
      left: {
        type: 'array',
        description: 'Left array of objects to join',
        items: {
          type: 'object',
        },
      },
      right: {
        type: 'array',
        description: 'Right array of objects to join',
        items: {
          type: 'object',
        },
      },
      leftKey: {
        type: 'string',
        description:
          'Field name in left array to join on (supports nested fields with dot notation)',
      },
      rightKey: {
        type: 'string',
        description:
          'Field name in right array to join on (supports nested fields with dot notation)',
      },
      type: {
        type: 'string',
        enum: ['inner', 'left', 'right', 'full'],
        description:
          "Join type: 'inner' (only matches), 'left' (all left + matches), 'right' (all right + matches), 'full' (all from both). Defaults to 'inner'.",
        default: 'inner',
      },
    },
    required: ['left', 'right', 'leftKey', 'rightKey'],
    additionalProperties: false,
  }),
  async execute({ left, right, leftKey, rightKey, type = 'inner' }): Promise<JoinResult> {
    // Validate inputs
    if (!Array.isArray(left)) {
      throw new Error('left must be an array');
    }

    if (!Array.isArray(right)) {
      throw new Error('right must be an array');
    }

    if (!leftKey || typeof leftKey !== 'string') {
      throw new Error('leftKey must be a non-empty string');
    }

    if (!rightKey || typeof rightKey !== 'string') {
      throw new Error('rightKey must be a non-empty string');
    }

    if (!['inner', 'left', 'right', 'full'].includes(type)) {
      throw new Error(`Invalid join type "${type}". Must be one of: inner, left, right, full`);
    }

    // Build index for right array
    const rightIndex = new Map<string, Array<Record<string, any>>>();
    for (const rightRow of right) {
      const key = toKey(getFieldValue(rightRow, rightKey));
      if (!rightIndex.has(key)) {
        rightIndex.set(key, []);
      }
      rightIndex.get(key)?.push(rightRow);
    }

    const results: Array<Record<string, any>> = [];
    const matchedLeftKeys = new Set<string>();
    const matchedRightKeys = new Set<string>();
    let matchedCount = 0;

    // Process left array
    for (const leftRow of left) {
      const key = toKey(getFieldValue(leftRow, leftKey));
      const rightMatches = rightIndex.get(key);

      if (rightMatches && rightMatches.length > 0) {
        // Found match(es)
        matchedLeftKeys.add(key);
        for (const rightRow of rightMatches) {
          results.push(mergeRows(leftRow, rightRow, leftKey, rightKey));
          matchedRightKeys.add(key);
          matchedCount++;
        }
      } else if (type === 'left' || type === 'full') {
        // No match, but include for left/full join
        results.push(mergeRows(leftRow, null, leftKey, rightKey));
      }
    }

    // For right and full joins, add unmatched right rows
    if (type === 'right' || type === 'full') {
      for (const rightRow of right) {
        const key = toKey(getFieldValue(rightRow, rightKey));
        if (!matchedRightKeys.has(key)) {
          results.push(mergeRows(null, rightRow, leftKey, rightKey));
        }
      }
    }

    // Calculate unmatched counts
    const unmatchedLeft =
      type === 'left' || type === 'full' ? left.length - Array.from(matchedLeftKeys).length : 0;

    const unmatchedRight =
      type === 'right' || type === 'full' ? right.length - Array.from(matchedRightKeys).length : 0;

    return {
      rows: results,
      matchedCount,
      unmatchedLeft,
      unmatchedRight,
    };
  },
});

export default rowsJoinTool;
