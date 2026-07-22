import { Args, Command, Flags } from '@oclif/core';
import { getClient, type TpmClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

type Output = ReturnType<typeof createOutput>;

interface ParameterFlags {
  input?: string;
  'input-file'?: string;
}

function parseParameters(json: string): Record<string, unknown> {
  const value: unknown = JSON.parse(json);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Tool input must be a JSON object');
  }
  return value as Record<string, unknown>;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8').trim();
}

async function loadParameters(
  flags: ParameterFlags,
  output: Output
): Promise<Record<string, unknown> | null> {
  try {
    if (flags.input) return parseParameters(flags.input);

    if (flags['input-file']) {
      const fs = await import('node:fs');
      return parseParameters(fs.readFileSync(flags['input-file'], 'utf-8'));
    }

    if (!process.stdin.isTTY) {
      const stdin = await readStdin();
      return stdin ? parseParameters(stdin) : {};
    }

    return {};
  } catch (error) {
    output.error(error instanceof Error ? error.message : 'Failed to parse tool input');
    return null;
  }
}

async function printStream(
  client: TpmClient,
  toolId: string,
  params: Record<string, unknown>,
  output: Output,
  verbose: boolean
): Promise<void> {
  output.info(`Executing ${toolId} (stream-compatible output)...`);
  output.divider();

  for await (const event of client.executeToolStream(toolId, params)) {
    if (event.type === 'text') process.stdout.write(event.data);
    else if (event.type === 'error') output.error(event.data);
    else if (event.type === 'done') {
      output.text('');
      output.divider();
      output.success('Execution complete');
    } else if (verbose) output.info(`Event: ${event.type}`);
  }
}

function printResult(result: unknown, output: Output, json: boolean): void {
  if (json) {
    output.json(result);
    return;
  }

  output.success('Execution complete');
  output.divider();
  output.text(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
}

export default class ToolExecute extends Command {
  static description = 'Execute a TPMJS tool';

  static examples = [
    '<%= config.bin %> <%= command.id %> "@tpmjs/official-firecrawl::scrapeTool" --input \'{"url":"https://example.com"}\'',
    '<%= config.bin %> <%= command.id %> "@scope/package::toolName" --input-file params.json',
    '<%= config.bin %> <%= command.id %> "@scope/package::toolName" --stream',
  ];

  static flags = {
    input: Flags.string({
      char: 'i',
      description: 'Input parameters as JSON string',
    }),
    'input-file': Flags.string({
      char: 'f',
      description: 'Path to JSON file containing input parameters',
    }),
    stream: Flags.boolean({
      char: 's',
      description: 'Emit the atomic registry result through streaming-compatible output',
      default: false,
    }),
    timeout: Flags.integer({
      char: 't',
      description: 'Timeout in seconds',
      default: 300,
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show verbose output',
      default: false,
    }),
  };

  static args = {
    tool: Args.string({
      description: 'Canonical tool ID (package::toolName); unique legacy names are also accepted',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ToolExecute);
    const output = createOutput(flags);
    const client = getClient({ timeout: flags.timeout * 1000 });
    const params = await loadParameters(flags, output);
    if (!params) return;

    const spinner = flags.stream ? null : output.spinner(`Executing ${args.tool}...`);

    try {
      if (flags.stream) {
        await printStream(client, args.tool, params, output, flags.verbose);
        return;
      }

      const result = await client.executeTool(args.tool, params);
      spinner?.stop();
      printResult(result, output, flags.json);
    } catch (error) {
      spinner?.fail('Execution failed');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
