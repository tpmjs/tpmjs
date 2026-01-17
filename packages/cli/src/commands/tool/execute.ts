import { Args, Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class ToolExecute extends Command {
  static description = 'Execute a TPMJS tool';

  static examples = [
    '<%= config.bin %> <%= command.id %> firecrawl-scrape --input \'{"url":"https://example.com"}\'',
    '<%= config.bin %> <%= command.id %> my-tool --input-file params.json',
    '<%= config.bin %> <%= command.id %> my-tool --stream',
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
      description: 'Stream output (for tools that support it)',
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
      description: 'Tool slug or ID',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ToolExecute);
    const output = createOutput(flags);
    const client = getClient();

    // Parse input parameters
    let params: Record<string, unknown> = {};

    if (flags.input) {
      try {
        params = JSON.parse(flags.input);
      } catch {
        output.error('Invalid JSON in --input flag');
        return;
      }
    } else if (flags['input-file']) {
      try {
        const fs = await import('node:fs');
        const content = fs.readFileSync(flags['input-file'], 'utf-8');
        params = JSON.parse(content);
      } catch (error) {
        output.error(`Failed to read input file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
    }

    // Check stdin for piped input
    if (!flags.input && !flags['input-file'] && !process.stdin.isTTY) {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk);
        }
        const stdinContent = Buffer.concat(chunks).toString('utf-8').trim();
        if (stdinContent) {
          params = JSON.parse(stdinContent);
        }
      } catch {
        output.error('Failed to parse JSON from stdin');
        return;
      }
    }

    const spinner = flags.stream ? null : output.spinner(`Executing ${args.tool}...`);

    try {
      if (flags.stream) {
        // Streaming execution
        output.info(`Executing ${args.tool} with streaming...`);
        output.divider();

        const stream = client.executeToolStream(args.tool, params);

        for await (const event of stream) {
          if (event.type === 'text') {
            process.stdout.write(event.data);
          } else if (event.type === 'error') {
            output.error(event.data);
          } else if (event.type === 'done') {
            output.text('');
            output.divider();
            output.success('Execution complete');
          } else if (flags.verbose) {
            output.info(`Event: ${event.type}`);
          }
        }
      } else {
        // Non-streaming execution
        const result = await client.executeTool(args.tool, params);

        spinner?.stop();

        if (flags.json) {
          output.json(result);
          return;
        }

        output.success('Execution complete');
        output.divider();

        if (typeof result === 'string') {
          output.text(result);
        } else if (result && typeof result === 'object') {
          // Pretty print the result
          const formatted = JSON.stringify(result, null, 2);
          output.text(formatted);
        } else {
          output.text(String(result));
        }
      }
    } catch (error) {
      spinner?.fail('Execution failed');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
