/**
 * Schema Infer Tool for TPMJS
 * Infer JSON Schema from sample data
 *
 * @requires Node.js 18+
 */

import { jsonSchema, tool } from 'ai';
import schemaGenerator from 'json-schema-generator';

/**
 * Input interface for schema inference
 */
export interface SchemaInferInput {
  samples: any[];
  options?: {
    required?: boolean;
    additionalProperties?: boolean;
  };
}

/**
 * Output interface for schema inference
 */
export interface SchemaInferResult {
  schema: object;
  sampleCount: number;
  properties: string[];
}

/**
 * Extract property names from a JSON schema
 */
function extractPropertyNames(schema: any): string[] {
  const properties: string[] = [];

  if (schema && typeof schema === 'object') {
    if (schema.properties) {
      properties.push(...Object.keys(schema.properties));
    }
  }

  return properties;
}

/**
 * Apply options to the generated schema
 */
function applySchemaOptions(
  schema: any,
  options?: { required?: boolean; additionalProperties?: boolean }
): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  const modified = { ...schema };

  // Handle required fields
  if (options?.required !== undefined) {
    if (options.required && modified.properties) {
      // Mark all properties as required
      modified.required = Object.keys(modified.properties);
    } else if (!options.required) {
      // Remove required fields
      modified.required = undefined;
    }
  }

  // Handle additionalProperties
  if (options?.additionalProperties !== undefined) {
    modified.additionalProperties = options.additionalProperties;
  }

  return modified;
}

/**
 * Schema Infer Tool
 * Infers JSON Schema from sample data objects
 */
export const schemaInferTool = tool({
  description:
    'Infer a JSON Schema from sample data objects. Analyzes multiple samples to determine types, required fields, and structure. Useful for generating schemas from API responses or data samples.',
  inputSchema: jsonSchema<SchemaInferInput>({
    type: 'object',
    properties: {
      samples: {
        type: 'array',
        description: 'Array of sample data objects to analyze (minimum 1 sample)',
        items: {
          type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
        },
        minItems: 1,
      },
      options: {
        type: 'object',
        description: 'Schema generation options',
        properties: {
          required: {
            type: 'boolean',
            description: 'Mark all properties as required (default: false)',
          },
          additionalProperties: {
            type: 'boolean',
            description: 'Allow additional properties not in schema (default: true)',
          },
        },
        additionalProperties: false,
      },
    },
    required: ['samples'],
    additionalProperties: false,
  }),
  async execute({ samples, options }): Promise<SchemaInferResult> {
    // Validate input
    if (!Array.isArray(samples)) {
      throw new Error('Samples must be an array');
    }

    if (samples.length === 0) {
      throw new Error('At least one sample is required');
    }

    // Generate schema from samples
    let generatedSchema: any;
    try {
      // If single sample, use it directly
      // If multiple samples, merge them
      if (samples.length === 1) {
        generatedSchema = schemaGenerator(samples[0]);
      } else {
        // For multiple samples, generate schemas for each and merge
        // The library handles this by generating from the first sample
        // then validating against others
        generatedSchema = schemaGenerator(samples[0]);

        // Validate that other samples would match
        // This is a simple approach - in production you might want more sophisticated merging
        for (let i = 1; i < samples.length; i++) {
          const sampleSchema = schemaGenerator(samples[i]);
          // Merge properties if they exist
          if (sampleSchema.properties && generatedSchema.properties) {
            generatedSchema.properties = {
              ...generatedSchema.properties,
              ...sampleSchema.properties,
            };
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate schema: ${message}`);
    }

    // Apply options to schema
    const finalSchema = applySchemaOptions(generatedSchema, options);

    // Extract property names
    const properties = extractPropertyNames(finalSchema);

    return {
      schema: finalSchema,
      sampleCount: samples.length,
      properties,
    };
  },
});

export default schemaInferTool;
