/**
 * Config Normalize Tool for TPMJS
 * Normalizes configuration objects by sorting keys, removing null/undefined values,
 * removing empty objects/arrays, and tracking changes made during normalization.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a change made during normalization
 */
export interface ConfigChange {
  type: 'removed' | 'sorted' | 'cleaned';
  path: string;
  reason: string;
  oldValue?: unknown;
}

/**
 * Options for configuration normalization
 */
export interface NormalizeOptions {
  sortKeys?: boolean;
  removeNulls?: boolean;
  removeEmpty?: boolean;
}

/**
 * Output interface for config normalization
 */
export interface ConfigNormalizeResult {
  normalized: Record<string, unknown>;
  changes: ConfigChange[];
  keyCount: number;
  originalKeyCount: number;
}

type ConfigNormalizeInput = {
  config: Record<string, unknown>;
  options?: NormalizeOptions;
};

/**
 * Default normalization options
 */
const DEFAULT_OPTIONS: Required<NormalizeOptions> = {
  sortKeys: true,
  removeNulls: true,
  removeEmpty: true,
};

/**
 * Checks if a value is null or undefined
 */
function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Checks if a value is an empty object
 */
function isEmptyObject(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  );
}

/**
 * Checks if a value is an empty array
 */
function isEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}

/**
 * Checks if a value should be considered empty based on options
 */
function isEmpty(value: unknown, options: Required<NormalizeOptions>): boolean {
  if (options.removeNulls && isNullOrUndefined(value)) {
    return true;
  }
  if (options.removeEmpty) {
    return isEmptyObject(value) || isEmptyArray(value);
  }
  return false;
}

/**
 * Gets the reason why a value is being removed
 */
function getRemovalReason(value: unknown): string {
  if (value === null) return 'null value';
  if (value === undefined) return 'undefined value';
  if (isEmptyObject(value)) return 'empty object';
  if (isEmptyArray(value)) return 'empty array';
  return 'empty value';
}

/**
 * Counts total keys in a nested object
 */
function countKeys(obj: unknown): number {
  if (typeof obj !== 'object' || obj === null) {
    return 0;
  }

  let count = 0;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      count += countKeys(item);
    }
  } else {
    const keys = Object.keys(obj);
    count += keys.length;

    for (const key of keys) {
      count += countKeys((obj as Record<string, unknown>)[key]);
    }
  }

  return count;
}

/**
 * Normalizes a configuration object recursively
 */
function normalizeConfig(
  config: unknown,
  options: Required<NormalizeOptions>,
  changes: ConfigChange[],
  path = ''
): unknown {
  // Handle null/undefined
  if (isNullOrUndefined(config)) {
    return config;
  }

  // Handle arrays
  if (Array.isArray(config)) {
    const normalized: unknown[] = [];

    for (let i = 0; i < config.length; i++) {
      const item = config[i];
      const itemPath = `${path}[${i}]`;

      if (isEmpty(item, options)) {
        changes.push({
          type: 'removed',
          path: itemPath,
          reason: getRemovalReason(item),
          oldValue: item,
        });
        continue;
      }

      normalized.push(normalizeConfig(item, options, changes, itemPath));
    }

    return normalized;
  }

  // Handle objects
  if (typeof config === 'object') {
    const obj = config as Record<string, unknown>;
    const keys = Object.keys(obj);

    // Sort keys if requested
    const sortedKeys = options.sortKeys ? keys.sort() : keys;

    // Track if keys were reordered
    if (options.sortKeys && keys.length > 1) {
      const wasReordered = sortedKeys.some((key, index) => keys[index] !== key);
      if (wasReordered) {
        changes.push({
          type: 'sorted',
          path: path || 'root',
          reason: 'keys sorted alphabetically',
        });
      }
    }

    const normalized: Record<string, unknown> = {};

    for (const key of sortedKeys) {
      const value = obj[key];
      const valuePath = path ? `${path}.${key}` : key;

      // Remove empty values if requested
      if (isEmpty(value, options)) {
        changes.push({
          type: 'removed',
          path: valuePath,
          reason: getRemovalReason(value),
          oldValue: value,
        });
        continue;
      }

      // Recursively normalize nested objects
      const normalizedValue = normalizeConfig(value, options, changes, valuePath);

      // After normalization, check again if it became empty
      if (isEmpty(normalizedValue, options)) {
        changes.push({
          type: 'cleaned',
          path: valuePath,
          reason: 'became empty after normalization',
          oldValue: value,
        });
        continue;
      }

      normalized[key] = normalizedValue;
    }

    return normalized;
  }

  // Return primitives as-is
  return config;
}

/**
 * Config Normalize Tool
 * Normalizes configuration objects with various options
 */
export const configNormalize = tool({
  description:
    'Normalize configuration objects by sorting keys alphabetically, removing null/undefined values, and removing empty objects/arrays. Returns the normalized config along with a list of changes made and key counts.',
  inputSchema: jsonSchema<ConfigNormalizeInput>({
    type: 'object',
    properties: {
      config: {
        type: 'object',
        description: 'The configuration object to normalize',
      },
      options: {
        type: 'object',
        description: 'Normalization options',
        properties: {
          sortKeys: {
            type: 'boolean',
            description: 'Sort object keys alphabetically (default: true)',
          },
          removeNulls: {
            type: 'boolean',
            description: 'Remove null and undefined values (default: true)',
          },
          removeEmpty: {
            type: 'boolean',
            description: 'Remove empty objects and arrays (default: true)',
          },
        },
        additionalProperties: false,
      },
    },
    required: ['config'],
    additionalProperties: false,
  }),
  async execute({ config, options = {} }): Promise<ConfigNormalizeResult> {
    // Validate input
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Error('config must be a non-null object (not an array)');
    }

    // Merge with default options
    const normalizeOptions: Required<NormalizeOptions> = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    // Count original keys
    const originalKeyCount = countKeys(config);

    // Track changes
    const changes: ConfigChange[] = [];

    // Normalize the config
    const normalized = normalizeConfig(config, normalizeOptions, changes) as Record<
      string,
      unknown
    >;

    // Count normalized keys
    const keyCount = countKeys(normalized);

    return {
      normalized,
      changes,
      keyCount,
      originalKeyCount,
    };
  },
});

export default configNormalize;
