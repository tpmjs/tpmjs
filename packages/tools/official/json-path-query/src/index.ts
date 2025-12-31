/**
 * JSON Path Query Tool for TPMJS
 * Query JSON using JSONPath expressions
 *
 * @requires Node.js 18+
 */

import { jsonSchema, tool } from 'ai';
import { JSONPath } from 'jsonpath-plus';

/**
 * Input interface for JSON path querying
 */
export interface JsonPathQueryInput {
  json: object | any[];
  path: string;
}

/**
 * Output interface for JSON path query
 */
export interface JsonPathQueryResult {
  results: any[];
  count: number;
  paths: string[];
}

/**
 * JSON Path Query Tool
 * Query JSON data using JSONPath expressions
 */
export const jsonPathQueryTool = tool({
  description:
    'Query JSON data using JSONPath expressions. Supports filtering, recursive descent, and complex queries like "$.users[?(@.age > 18)].name" or "$..book[?(@.price < 10)]".',
  inputSchema: jsonSchema<JsonPathQueryInput>({
    type: 'object',
    properties: {
      json: {
        type: ['object', 'array'],
        description: 'JSON data to query (object or array)',
      },
      path: {
        type: 'string',
        description:
          'JSONPath expression (e.g., "$.users[*].name", "$..price", "$.items[?(@.active)]")',
      },
    },
    required: ['json', 'path'],
    additionalProperties: false,
  }),
  async execute({ json, path }): Promise<JsonPathQueryResult> {
    // Validate input
    if (typeof json !== 'object' || json === null) {
      throw new Error('JSON must be a non-null object or array');
    }

    if (typeof path !== 'string') {
      throw new Error('Path must be a string');
    }

    if (path.trim().length === 0) {
      throw new Error('Path cannot be empty');
    }

    // Execute JSONPath query
    let results: any[];
    let resultPaths: string[] = [];

    try {
      // Query with path tracking
      const queryResult = JSONPath({
        path,
        json,
        resultType: 'all', // Returns both values and paths
      });

      // Extract values and paths
      results = queryResult.map((item: any) => item.value);
      resultPaths = queryResult.map((item: any) => item.path);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to execute JSONPath query: ${message}`);
    }

    return {
      results,
      count: results.length,
      paths: resultPaths,
    };
  },
});

export default jsonPathQueryTool;
