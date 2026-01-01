/**
 * YAML Stringify Tool for TPMJS
 * Converts JavaScript objects to YAML strings with formatting options
 *
 * Domain rule: yaml_serialization - Uses js-yaml library for YAML serialization
 */

import { jsonSchema, tool } from 'ai';
// Domain rule: yaml_serialization - js-yaml for YAML serialization
import * as yaml from 'js-yaml';

/**
 * Output interface for YAML stringify result
 */
export interface YamlStringifyResult {
  yaml: string;
  metadata: {
    lines: number;
    characters: number;
    indent: number;
  };
}

type YamlStringifyInput = {
  data: unknown;
  indent?: number;
};

/**
 * Counts the number of lines in a string
 */
function countLines(text: string): number {
  return text.split('\n').length;
}

/**
 * YAML Stringify Tool
 * Converts JavaScript objects to YAML strings with formatting options
 */
export const yamlStringifyTool = tool({
  description:
    'Convert JavaScript objects to YAML strings. Supports objects, arrays, and primitive values with configurable indentation. Perfect for generating configuration files or serializing data.',
  inputSchema: jsonSchema<YamlStringifyInput>({
    type: 'object',
    properties: {
      data: {
        type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
        description: 'The JavaScript data to convert to YAML',
      },
      indent: {
        type: 'number',
        description: 'Number of spaces for indentation (default: 2, range: 1-8)',
        minimum: 1,
        maximum: 8,
      },
    },
    required: ['data'],
    additionalProperties: false,
  }),
  async execute({ data, indent = 2 }): Promise<YamlStringifyResult> {
    // Validate indent parameter
    if (indent !== undefined) {
      if (typeof indent !== 'number' || !Number.isInteger(indent)) {
        throw new Error('Indent must be an integer number');
      }
      if (indent < 1 || indent > 8) {
        throw new Error('Indent must be between 1 and 8 spaces');
      }
    }

    try {
      // Domain rule: yaml_serialization - Convert to YAML with specified indentation using yaml.dump
      const yamlString = yaml.dump(data, {
        indent: indent,
        lineWidth: -1, // Don't wrap lines
        noRefs: true, // Don't use anchors/references
        sortKeys: false, // Preserve key order
        noCompatMode: true, // Use YAML 1.2
      });

      // Return result with metadata
      return {
        yaml: yamlString,
        metadata: {
          lines: countLines(yamlString),
          characters: yamlString.length,
          indent: indent,
        },
      };
    } catch (error) {
      // Handle conversion errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred during YAML conversion';

      throw new Error(`Failed to stringify data to YAML: ${errorMessage}`);
    }
  },
});

export default yamlStringifyTool;
