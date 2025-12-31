/**
 * JSON Repair Tool for TPMJS
 * Attempts to repair malformed JSON using jsonrepair
 *
 * @requires Node.js 18+
 */

import { jsonSchema, tool } from 'ai';
import { jsonrepair } from 'jsonrepair';

/**
 * Output interface for JSON repair
 */
export interface JsonRepairResult {
  repaired: string;
  wasModified: boolean;
  changes: string[];
  metadata: {
    repairedAt: string;
    originalLength: number;
    repairedLength: number;
    isValidJson: boolean;
  };
}

type JsonRepairInput = {
  json: string;
};

/**
 * Detects common JSON issues and creates a change log
 */
function detectChanges(original: string, repaired: string): string[] {
  const changes: string[] = [];

  // Check if strings were modified
  if (original !== repaired) {
    // Check for common fixes
    if (original.includes("'") && !repaired.includes("'") && repaired.includes('"')) {
      changes.push('Converted single quotes to double quotes');
    }

    if (!original.endsWith('}') && repaired.endsWith('}')) {
      changes.push('Added missing closing brace');
    }

    if (!original.endsWith(']') && repaired.endsWith(']')) {
      changes.push('Added missing closing bracket');
    }

    if (original.includes(',}') || original.includes(',]')) {
      changes.push('Removed trailing commas');
    }

    // Check for unquoted keys
    const unquotedKeyPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g;
    const originalMatches = original.match(unquotedKeyPattern);
    const repairedMatches = repaired.match(unquotedKeyPattern);

    if (originalMatches && (!repairedMatches || repairedMatches.length < originalMatches.length)) {
      changes.push('Added quotes to unquoted keys');
    }

    // Check for missing commas
    if (original.split(',').length < repaired.split(',').length) {
      changes.push('Added missing commas between elements');
    }

    // Check for comments
    if (original.includes('//') || original.includes('/*')) {
      changes.push('Removed comments');
    }

    // Check for escaped characters
    if (original.includes('\\') && original.split('\\').length !== repaired.split('\\').length) {
      changes.push('Fixed escape sequences');
    }

    // Generic change if we couldn't detect specific ones
    if (changes.length === 0) {
      changes.push('Applied general JSON formatting fixes');
    }
  }

  return changes;
}

/**
 * JSON Repair Tool
 * Attempts to repair malformed JSON and reports what was changed
 */
export const jsonRepairTool = tool({
  description:
    'Attempt to repair malformed JSON strings. Fixes common issues like unquoted keys, trailing commas, single quotes, missing commas, unclosed brackets, and comments. Returns the repaired JSON, whether it was modified, and a list of changes made.',
  inputSchema: jsonSchema<JsonRepairInput>({
    type: 'object',
    properties: {
      json: {
        type: 'string',
        description: 'The malformed JSON string to repair',
      },
    },
    required: ['json'],
    additionalProperties: false,
  }),
  async execute({ json }): Promise<JsonRepairResult> {
    // Validate input
    if (typeof json !== 'string') {
      throw new Error('JSON input must be a string');
    }

    if (json.trim().length === 0) {
      throw new Error('JSON input cannot be empty');
    }

    const originalLength = json.length;

    // Try to repair the JSON
    let repaired: string;
    try {
      repaired = jsonrepair(json);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to repair JSON: ${message}. The input may be too malformed to fix.`);
    }

    const repairedLength = repaired.length;
    const wasModified = json !== repaired;

    // Detect what changes were made
    const changes = wasModified ? detectChanges(json, repaired) : [];

    // Validate the repaired JSON
    let isValidJson = false;
    try {
      JSON.parse(repaired);
      isValidJson = true;
    } catch {
      isValidJson = false;
    }

    // Build result
    const result: JsonRepairResult = {
      repaired,
      wasModified,
      changes,
      metadata: {
        repairedAt: new Date().toISOString(),
        originalLength,
        repairedLength,
        isValidJson,
      },
    };

    return result;
  },
});

export default jsonRepairTool;
