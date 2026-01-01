/**
 * Config Normalize Tool for TPMJS
 * Applies defaults from schema and validates configuration objects.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a change made during normalization
 */
export interface ConfigChange {
  type: 'removed' | 'sorted' | 'cleaned' | 'defaultApplied' | 'coerced';
  path: string;
  reason: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Schema property definition
 */
export interface SchemaProperty {
  type: string;
  default?: unknown;
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
}

/**
 * Configuration schema
 */
export interface ConfigSchema {
  type: string;
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

/**
 * Output interface for config normalization
 */
export interface ConfigNormalizeResult {
  normalized: Record<string, unknown>;
  changes: ConfigChange[];
  valid: boolean;
  errors: string[];
}

type ConfigNormalizeInput = {
  config: Record<string, unknown>;
  schema: ConfigSchema;
};

/**
 * Validates a value against a schema property
 * Domain rule: validation - Validates against schema with type checking
 */
function validateValue(
  value: unknown,
  schema: SchemaProperty,
  path: string,
  errors: string[]
): boolean {
  if (value === undefined) return true;

  const type = schema.type;

  // Domain rule: validation - Type validation for primitives and objects
  if (type === 'string' && typeof value !== 'string') {
    errors.push(`${path}: expected string, got ${typeof value}`);
    return false;
  }
  if (type === 'number' && typeof value !== 'number') {
    errors.push(`${path}: expected number, got ${typeof value}`);
    return false;
  }
  if (type === 'boolean' && typeof value !== 'boolean') {
    errors.push(`${path}: expected boolean, got ${typeof value}`);
    return false;
  }
  if (type === 'array' && !Array.isArray(value)) {
    errors.push(`${path}: expected array, got ${typeof value}`);
    return false;
  }
  if (type === 'object' && (typeof value !== 'object' || Array.isArray(value) || value === null)) {
    errors.push(`${path}: expected object, got ${typeof value}`);
    return false;
  }

  // Validate nested objects
  if (type === 'object' && schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const propValue = (value as Record<string, unknown>)[key];
      validateValue(propValue, propSchema, `${path}.${key}`, errors);
    }
  }

  // Validate array items
  if (type === 'array' && schema.items && Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      validateValue(value[i], schema.items, `${path}[${i}]`, errors);
    }
  }

  return errors.length === 0;
}

/**
 * Coerces a value to the expected type if safe
 * Domain rule: coercion - Coerces types where safe (string to number, string to boolean, etc.)
 */
function coerceValue(value: unknown, targetType: string): unknown {
  if (value === null || value === undefined) return value;

  // Domain rule: coercion - String coercion (safe for all types)
  if (targetType === 'string' && typeof value !== 'string') {
    return String(value);
  }

  // Domain rule: coercion - Number coercion from string (only if valid number)
  if (targetType === 'number' && typeof value === 'string') {
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
  }

  // Domain rule: coercion - Boolean coercion from string ('true'/'false') or number
  if (targetType === 'boolean') {
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
  }

  return value;
}

/**
 * Applies defaults and coercion from schema to config
 * Domain rule: defaults - Applies default values from schema for missing properties
 * Domain rule: coercion - Coerces types where safe
 */
function applyDefaults(
  config: Record<string, unknown>,
  schema: ConfigSchema,
  changes: ConfigChange[],
  path = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...config };

  // Domain rule: defaults - Apply defaults for missing properties
  for (const [key, propSchema] of Object.entries(schema.properties)) {
    const valuePath = path ? `${path}.${key}` : key;
    const currentValue = result[key];

    // Domain rule: defaults - Apply default if missing
    if (currentValue === undefined && propSchema.default !== undefined) {
      result[key] = propSchema.default;
      changes.push({
        type: 'defaultApplied',
        path: valuePath,
        reason: 'applied default value from schema',
        newValue: propSchema.default,
      });
      continue;
    }

    // Domain rule: coercion - Coerce type if safe (e.g., "123" -> 123, "true" -> true)
    if (currentValue !== undefined) {
      const coerced = coerceValue(currentValue, propSchema.type);
      if (coerced !== currentValue) {
        result[key] = coerced;
        changes.push({
          type: 'coerced',
          path: valuePath,
          reason: `coerced to ${propSchema.type}`,
          oldValue: currentValue,
          newValue: coerced,
        });
      }
    }

    // Recursively apply defaults for nested objects
    if (propSchema.type === 'object' && propSchema.properties && result[key]) {
      const nestedSchema: ConfigSchema = {
        type: 'object',
        properties: propSchema.properties,
      };
      result[key] = applyDefaults(
        result[key] as Record<string, unknown>,
        nestedSchema,
        changes,
        valuePath
      );
    }
  }

  return result;
}

/**
 * Config Normalize Tool
 * Applies defaults from schema and validates configuration objects
 */
export const configNormalize = tool({
  description:
    'Applies defaults and coercions to config objects based on a schema. Validates the config against the schema and returns normalized config with changes and validation results.',
  inputSchema: jsonSchema<ConfigNormalizeInput>({
    type: 'object',
    properties: {
      config: {
        type: 'object',
        description: 'Raw configuration object to normalize',
      },
      schema: {
        type: 'object',
        description: 'Schema with defaults and type definitions',
        properties: {
          type: {
            type: 'string',
            description: 'Schema type (should be "object")',
          },
          properties: {
            type: 'object',
            description: 'Property definitions with types and defaults',
          },
          required: {
            type: 'array',
            description: 'List of required property names',
            items: {
              type: 'string',
            },
          },
        },
        required: ['type', 'properties'],
      },
    },
    required: ['config', 'schema'],
    additionalProperties: false,
  }),
  async execute({ config, schema }): Promise<ConfigNormalizeResult> {
    // Validate inputs
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Error('config must be a non-null object (not an array)');
    }

    if (!schema || typeof schema !== 'object') {
      throw new Error('schema must be an object');
    }

    if (!schema.properties || typeof schema.properties !== 'object') {
      throw new Error('schema.properties must be an object');
    }

    // Track changes
    const changes: ConfigChange[] = [];

    // Apply defaults and coerce types
    const normalized = applyDefaults(config, schema, changes);

    // Validate against schema
    const errors: string[] = [];

    // Check required fields
    if (schema.required) {
      for (const requiredKey of schema.required) {
        if (normalized[requiredKey] === undefined) {
          errors.push(`Missing required field: ${requiredKey}`);
        }
      }
    }

    // Validate all properties
    for (const [key, value] of Object.entries(normalized)) {
      const propSchema = schema.properties[key];
      if (propSchema) {
        validateValue(value, propSchema, key, errors);
      }
    }

    return {
      normalized,
      changes,
      valid: errors.length === 0,
      errors,
    };
  },
});

export default configNormalize;
