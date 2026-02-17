/**
 * @tpmjs/tools-jq — jq JSON Processing Tools for AI Agents
 *
 * Query, filter, and format JSON data using the jq binary.
 * Requires `jq` to be installed and available in PATH.
 */

import { execSync } from 'node:child_process';
import { jsonSchema, tool } from 'ai';

function runJq(args: string[], stdin: string): string {
  try {
    const result = execSync(`jq ${args.join(' ')}`, {
      input: stdin,
      encoding: 'utf-8',
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return result;
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    throw new Error(`jq error: ${error.stderr || error.message}`);
  }
}

// ─── Tools ───────────────────────────────────────────────────────────────────

export interface QueryInput {
  json: string;
  filter: string;
  rawOutput?: boolean;
  sortKeys?: boolean;
  nullInput?: boolean;
}

export const query = tool({
  description:
    'Run a jq expression on JSON input. Supports filtering, mapping, transforming, and extracting data from JSON. Examples: ".foo", ".[] | select(.age > 30)", "[.[] | {name, age}]".',
  inputSchema: jsonSchema<QueryInput>({
    type: 'object',
    properties: {
      json: { type: 'string', description: 'JSON string to process.' },
      filter: {
        type: 'string',
        description: 'jq filter expression (e.g., ".foo", ".[] | select(.x > 1)").',
      },
      rawOutput: {
        type: 'boolean',
        description: 'Output raw strings without JSON quotes (-r flag). Default false.',
      },
      sortKeys: {
        type: 'boolean',
        description: 'Sort object keys (-S flag). Default false.',
      },
      nullInput: {
        type: 'boolean',
        description: 'Use null as input instead of the json field (-n flag). Default false.',
      },
    },
    required: ['json', 'filter'],
    additionalProperties: false,
  }),
  async execute(input: QueryInput) {
    const args: string[] = [];
    if (input.rawOutput) args.push('-r');
    if (input.sortKeys) args.push('-S');
    if (input.nullInput) args.push('-n');
    args.push(JSON.stringify(input.filter));

    const output = runJq(args, input.json);
    return { output: output.trim() };
  },
});

export interface FormatInput {
  json: string;
  sortKeys?: boolean;
  compact?: boolean;
}

export const format = tool({
  description:
    'Pretty-print JSON with consistent formatting. Optionally sort keys or compact output.',
  inputSchema: jsonSchema<FormatInput>({
    type: 'object',
    properties: {
      json: { type: 'string', description: 'JSON string to format.' },
      sortKeys: {
        type: 'boolean',
        description: 'Sort object keys alphabetically. Default false.',
      },
      compact: {
        type: 'boolean',
        description: 'Compact output (no whitespace). Default false.',
      },
    },
    required: ['json'],
    additionalProperties: false,
  }),
  async execute(input: FormatInput) {
    const args: string[] = [];
    if (input.sortKeys) args.push('-S');
    if (input.compact) args.push('-c');
    args.push("'.'");

    const output = runJq(args, input.json);
    return { output: output.trim() };
  },
});

// ─── Default Export ──────────────────────────────────────────────────────────

export default {
  query,
  format,
};
