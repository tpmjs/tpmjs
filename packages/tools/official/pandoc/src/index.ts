/**
 * @tpmjs/tools-pandoc — Pandoc Document Conversion Tools for AI Agents
 *
 * Convert between document formats using the Pandoc binary.
 * Requires `pandoc` to be installed and available in PATH.
 */

import { execSync } from 'node:child_process';
import { jsonSchema, tool } from 'ai';

function runPandoc(args: string[], stdin?: string): string {
  try {
    const result = execSync(`pandoc ${args.join(' ')}`, {
      input: stdin,
      encoding: 'utf-8',
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return result;
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    throw new Error(`Pandoc error: ${error.stderr || error.message}`);
  }
}

// ─── Tools ───────────────────────────────────────────────────────────────────

export interface ConvertInput {
  content: string;
  from: string;
  to: string;
  standalone?: boolean;
  options?: string[];
}

export const convert = tool({
  description:
    'Convert content between document formats using Pandoc. Pipes content via stdin/stdout. Common formats: markdown, html, latex, docx, rst, org, mediawiki, textile, asciidoc, json (Pandoc AST).',
  inputSchema: jsonSchema<ConvertInput>({
    type: 'object',
    properties: {
      content: { type: 'string', description: 'The content to convert.' },
      from: {
        type: 'string',
        description: 'Input format (e.g., "markdown", "html", "latex", "rst").',
      },
      to: {
        type: 'string',
        description: 'Output format (e.g., "html", "markdown", "latex", "rst").',
      },
      standalone: {
        type: 'boolean',
        description: 'Produce a standalone document (with header/footer). Default false.',
      },
      options: {
        type: 'array',
        items: { type: 'string' },
        description: 'Additional Pandoc CLI flags (e.g., ["--wrap=none", "--columns=80"]).',
      },
    },
    required: ['content', 'from', 'to'],
    additionalProperties: false,
  }),
  async execute(input: ConvertInput) {
    const args = [`--from=${input.from}`, `--to=${input.to}`];
    if (input.standalone) args.push('--standalone');
    if (input.options) args.push(...input.options);

    const output = runPandoc(args, input.content);
    return { output, from: input.from, to: input.to };
  },
});

export const listInputFormats = tool({
  description: 'List all input formats supported by the installed Pandoc version.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    const output = runPandoc(['--list-input-formats']);
    const formats = output.trim().split('\n');
    return { formats };
  },
});

export const listOutputFormats = tool({
  description: 'List all output formats supported by the installed Pandoc version.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    const output = runPandoc(['--list-output-formats']);
    const formats = output.trim().split('\n');
    return { formats };
  },
});

// ─── Default Export ──────────────────────────────────────────────────────────

export default {
  convert,
  listInputFormats,
  listOutputFormats,
};
