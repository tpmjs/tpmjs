/**
 * Dedupe By Key Tool for TPMJS
 * Removes duplicate objects from an array based on one or more key fields
 *
 * Domain rule: composite_key_deduplication - Supports single and composite key deduplication
 * Domain rule: key_serialization - Uses string serialization for key comparison
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for the dedupe result
 */
export interface DedupeResult {
  rows: Record<string, unknown>[];
  duplicatesRemoved: number;
  originalCount: number;
  uniqueCount: number;
}

type DedupeByKeyInput = {
  rows: Record<string, unknown>[];
  key: string | string[];
  keepLast?: boolean;
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
 * Domain rule: key_serialization - Creates a unique key string from an object based on the key field(s)
 */
function createKeyString(obj: Record<string, unknown>, keyFields: string[]): string {
  const keyValues = keyFields.map((field) => {
    const value = getFieldValue(obj, field);

    // Handle different types for key generation
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value);

    return String(value);
  });

  return keyValues.join('::');
}

/**
 * Dedupe By Key Tool
 * Removes duplicate objects based on unique key field(s)
 */
export const dedupeByKeyTool = tool({
  description:
    'Remove duplicate objects from an array based on one or more key fields. For each unique key value, keeps either the first or last occurrence. Supports composite keys (multiple fields) and nested field access using dot notation.',
  inputSchema: jsonSchema<DedupeByKeyInput>({
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        description: 'Array of objects to deduplicate',
        items: {
          type: 'object',
        },
      },
      key: {
        description:
          'Field name(s) to use as unique key. Can be a single field name (string) or array of field names for composite keys. Supports dot notation for nested fields.',
        oneOf: [
          { type: 'string' },
          {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
        ],
      },
      keepLast: {
        type: 'boolean',
        description:
          'If true, keeps the last occurrence of each duplicate. If false (default), keeps the first occurrence.',
        default: false,
      },
    },
    required: ['rows', 'key'],
    additionalProperties: false,
  }),
  async execute({ rows, key, keepLast = false }): Promise<DedupeResult> {
    // Validate inputs
    if (!Array.isArray(rows)) {
      throw new Error('rows must be an array');
    }

    // Normalize key to array
    const keyFields: string[] = Array.isArray(key) ? key : [key];

    if (keyFields.length === 0) {
      throw new Error('key must be a non-empty string or array of strings');
    }

    for (const field of keyFields) {
      if (!field || typeof field !== 'string') {
        throw new Error('Each key field must be a non-empty string');
      }
    }

    const originalCount = rows.length;

    // Domain rule: composite_key_deduplication - Track seen keys and their associated rows
    const seen = new Map<string, Record<string, unknown>>();

    // Process rows
    for (const row of rows) {
      if (typeof row !== 'object' || row === null) {
        continue;
      }

      const rowObj = row as Record<string, unknown>;
      const keyString = createKeyString(rowObj, keyFields);

      if (keepLast) {
        // Always update to keep the last occurrence
        seen.set(keyString, rowObj);
      } else {
        // Only set if not already seen (keep first occurrence)
        if (!seen.has(keyString)) {
          seen.set(keyString, rowObj);
        }
      }
    }

    // Extract unique rows in original order (for keepFirst) or reversed order (for keepLast)
    const uniqueRows = Array.from(seen.values());
    const uniqueCount = uniqueRows.length;
    const duplicatesRemoved = originalCount - uniqueCount;

    return {
      rows: uniqueRows,
      duplicatesRemoved,
      originalCount,
      uniqueCount,
    };
  },
});

export default dedupeByKeyTool;
