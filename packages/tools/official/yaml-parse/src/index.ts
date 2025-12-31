/**
 * YAML Parse Tool for TPMJS
 * Parses YAML text into JavaScript objects with validation and error handling
 */

import { jsonSchema, tool } from 'ai';
import * as yaml from 'js-yaml';

/**
 * Output interface for YAML parse result
 */
export interface YamlParseResult {
  data: unknown;
  isValid: boolean;
  error?: string;
  metadata?: {
    type: string;
    size: number;
  };
}

type YamlParseInput = {
  yaml: string;
};

/**
 * Determines the type of the parsed data
 */
function getDataType(data: unknown): string {
  if (data === null) return 'null';
  if (Array.isArray(data)) return 'array';
  return typeof data;
}

/**
 * Calculates the size of the parsed data (number of keys for objects, length for arrays)
 */
function getDataSize(data: unknown): number {
  if (data === null || data === undefined) return 0;
  if (Array.isArray(data)) return data.length;
  if (typeof data === 'object') return Object.keys(data).length;
  return 0;
}

/**
 * YAML Parse Tool
 * Parses YAML text into JavaScript objects with validation
 */
export const yamlParseTool = tool({
  description:
    'Parse YAML text into JavaScript objects. Handles various YAML formats including objects, arrays, and scalars. Returns parsed data with validation status.',
  inputSchema: jsonSchema<YamlParseInput>({
    type: 'object',
    properties: {
      yaml: {
        type: 'string',
        description: 'The YAML string to parse',
      },
    },
    required: ['yaml'],
    additionalProperties: false,
  }),
  async execute({ yaml: yamlText }): Promise<YamlParseResult> {
    // Validate input
    if (typeof yamlText !== 'string') {
      return {
        data: null,
        isValid: false,
        error: 'Input must be a string',
      };
    }

    if (yamlText.trim().length === 0) {
      return {
        data: null,
        isValid: false,
        error: 'Input YAML string is empty',
      };
    }

    try {
      // Parse YAML
      const parsed = yaml.load(yamlText, {
        json: false, // Allow non-JSON YAML features
        onWarning: (warning) => {
          // Log warnings but don't fail
          console.warn('YAML parsing warning:', warning);
        },
      });

      // Return successful result
      return {
        data: parsed,
        isValid: true,
        metadata: {
          type: getDataType(parsed),
          size: getDataSize(parsed),
        },
      };
    } catch (error) {
      // Handle parsing errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown parsing error occurred';

      return {
        data: null,
        isValid: false,
        error: errorMessage,
      };
    }
  },
});

export default yamlParseTool;
