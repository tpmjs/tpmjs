/**
 * JSON Schema Validate Tool for TPMJS
 * Validates JSON data against JSON Schema using ajv
 */

import { jsonSchema, tool } from 'ai';
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

/**
 * Validation error with detailed information
 */
export interface ValidationError {
  path: string;
  message: string;
  keyword?: string;
  params?: Record<string, any>;
}

/**
 * Result of JSON Schema validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  errorCount: number;
}

type JsonSchemaValidateInput = {
  data: any;
  schema: Record<string, any>;
};

// Create a singleton AJV instance with common formats support
let ajvInstance: Ajv | null = null;

function getAjvInstance(): Ajv {
  if (!ajvInstance) {
    ajvInstance = new Ajv({
      allErrors: true, // Collect all errors, not just the first one
      verbose: true, // Include schema and data in errors
      strict: false, // Allow unknown keywords for compatibility
    });
    // Add common format validators (email, uri, date-time, etc.)
    addFormats(ajvInstance);
  }
  return ajvInstance;
}

/**
 * Formats an AJV error into a readable error object
 */
function formatError(error: ErrorObject): ValidationError {
  const path = error.instancePath || '/';
  let message = error.message || 'Validation failed';

  // Enhance message with more context
  if (error.keyword === 'required') {
    message = `Missing required property: ${error.params.missingProperty}`;
  } else if (error.keyword === 'type') {
    message = `Expected type ${error.params.type}, got ${typeof error.data}`;
  } else if (error.keyword === 'enum') {
    message = `Value must be one of: ${error.params.allowedValues?.join(', ')}`;
  } else if (error.keyword === 'minimum' || error.keyword === 'maximum') {
    message = `Value ${error.keyword === 'minimum' ? 'must be >= ' : 'must be <= '}${error.params.limit}`;
  } else if (error.keyword === 'minLength' || error.keyword === 'maxLength') {
    message = `String length ${error.keyword === 'minLength' ? 'must be >= ' : 'must be <= '}${error.params.limit}`;
  } else if (error.keyword === 'pattern') {
    message = `String must match pattern: ${error.params.pattern}`;
  } else if (error.keyword === 'format') {
    message = `Invalid ${error.params.format} format`;
  }

  return {
    path,
    message,
    keyword: error.keyword,
    params: error.params,
  };
}

/**
 * JSON Schema Validate Tool
 * Validates JSON data against a JSON Schema
 */
export const jsonSchemaValidateTool = tool({
  description:
    'Validates JSON data against a JSON Schema specification using the ajv validator. Returns validation status, detailed errors, and error count. Supports JSON Schema Draft 7 and common formats (email, uri, date-time, etc.).',
  inputSchema: jsonSchema<JsonSchemaValidateInput>({
    type: 'object',
    properties: {
      data: {
        description: 'The data to validate (can be any JSON value: object, array, string, etc.)',
      },
      schema: {
        type: 'object',
        description:
          'JSON Schema object defining the expected structure and validation rules (Draft 7 compatible)',
      },
    },
    required: ['data', 'schema'],
    additionalProperties: false,
  }),
  async execute({ data, schema }): Promise<ValidationResult> {
    // Validate inputs
    if (schema === null || schema === undefined) {
      throw new Error('schema is required');
    }

    if (typeof schema !== 'object' || Array.isArray(schema)) {
      throw new Error('schema must be a JSON Schema object');
    }

    // Get AJV instance
    const ajv = getAjvInstance();

    // Compile the schema
    let validate: ValidateFunction;
    try {
      validate = ajv.compile(schema);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Invalid JSON Schema: ${message}`);
    }

    // Validate the data
    const valid = validate(data);

    // Format errors if validation failed
    const errors: ValidationError[] = [];
    if (!valid && validate.errors) {
      for (const error of validate.errors) {
        errors.push(formatError(error));
      }
    }

    return {
      valid,
      errors,
      errorCount: errors.length,
    };
  },
});

export default jsonSchemaValidateTool;
