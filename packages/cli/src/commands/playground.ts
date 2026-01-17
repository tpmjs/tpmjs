import { Command, Flags } from '@oclif/core';
import * as readline from 'node:readline';
import { getClient } from '../lib/api-client.js';
import { createOutput } from '../lib/output.js';

export default class Playground extends Command {
  static description = 'Interactive playground for testing tools';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --tool firecrawl-scrape',
    '<%= config.bin %> <%= command.id %> --web',
  ];

  static flags = {
    tool: Flags.string({
      char: 't',
      description: 'Start with a specific tool selected',
    }),
    web: Flags.boolean({
      char: 'w',
      description: 'Open the web playground instead',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show verbose output',
      default: false,
    }),
  };

  private rl?: readline.Interface;
  private client = getClient();
  private selectedTool?: string;

  async run(): Promise<void> {
    const { flags } = await this.parse(Playground);
    const output = createOutput(flags);

    if (flags.web) {
      output.info('Opening web playground...');
      const open = (await import('open')).default;
      await open('https://tpmjs.com/playground');
      return;
    }

    this.selectedTool = flags.tool;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    output.heading('TPMJS Playground');
    output.text('');
    output.text('Commands:');
    output.listItem('.help      - Show this help');
    output.listItem('.tools     - List available tools');
    output.listItem('.select    - Select a tool to use');
    output.listItem('.info      - Show info about selected tool');
    output.listItem('.clear     - Clear the screen');
    output.listItem('.exit      - Exit the playground');
    output.text('');

    if (this.selectedTool) {
      output.info(`Selected tool: ${this.selectedTool}`);
    } else {
      output.text('No tool selected. Use .select to choose a tool.');
    }

    output.text('');
    output.text('Enter JSON input to execute the selected tool.');
    output.divider();

    await this.repl(output, flags.verbose);
  }

  private async repl(output: ReturnType<typeof createOutput>, verbose: boolean): Promise<void> {
    const prompt = () => {
      const prefix = this.selectedTool ? `[${this.selectedTool}]` : '[no tool]';
      this.rl?.question(`${prefix} > `, async (input) => {
        const trimmed = input.trim();

        if (!trimmed) {
          prompt();
          return;
        }

        if (trimmed.startsWith('.')) {
          await this.handleCommand(trimmed, output, verbose);
          if (trimmed !== '.exit') {
            prompt();
          }
          return;
        }

        // Try to execute as JSON input
        if (!this.selectedTool) {
          output.warning('No tool selected. Use .select to choose a tool first.');
          prompt();
          return;
        }

        try {
          const params = JSON.parse(trimmed);
          await this.executeTool(params, output, verbose);
        } catch {
          output.error('Invalid JSON input. Enter valid JSON or use a command (.help)');
        }

        prompt();
      });
    };

    prompt();

    // Keep running until exit
    await new Promise<void>((resolve) => {
      this.rl?.on('close', resolve);
    });
  }

  private async handleCommand(
    command: string,
    output: ReturnType<typeof createOutput>,
    verbose: boolean
  ): Promise<void> {
    const [cmd, ...args] = command.split(/\s+/);

    switch (cmd) {
      case '.help':
        output.text('');
        output.text('Commands:');
        output.listItem('.help           - Show this help');
        output.listItem('.tools          - List available tools');
        output.listItem('.select <tool>  - Select a tool to use');
        output.listItem('.info           - Show info about selected tool');
        output.listItem('.clear          - Clear the screen');
        output.listItem('.exit           - Exit the playground');
        output.text('');
        output.text('To execute a tool, enter JSON input:');
        output.text('  {"url": "https://example.com"}');
        output.text('');
        break;

      case '.tools':
        await this.listTools(output);
        break;

      case '.select':
        if (args.length === 0) {
          output.warning('Usage: .select <tool-slug>');
        } else {
          this.selectedTool = args[0];
          output.success(`Selected: ${this.selectedTool}`);
        }
        break;

      case '.info':
        await this.showToolInfo(output, verbose);
        break;

      case '.clear':
        console.clear();
        break;

      case '.exit':
        output.info('Goodbye!');
        this.rl?.close();
        break;

      default:
        output.warning(`Unknown command: ${cmd}. Type .help for available commands.`);
    }
  }

  private async listTools(output: ReturnType<typeof createOutput>): Promise<void> {
    const spinner = output.spinner('Loading tools...');

    try {
      const response = await this.client.getTrendingTools({ limit: 20 });

      spinner.stop();

      if (!response.data || response.data.length === 0) {
        output.error('No tools found');
        return;
      }

      output.text('');
      output.text('Available tools:');

      for (const tool of response.data) {
        output.listItem(`${tool.slug} - ${tool.name}`);
      }

      output.text('');
      output.text('Use .select <slug> to select a tool');
    } catch {
      spinner.fail('Failed to load tools');
    }
  }

  private async showToolInfo(
    output: ReturnType<typeof createOutput>,
    verbose: boolean
  ): Promise<void> {
    if (!this.selectedTool) {
      output.warning('No tool selected');
      return;
    }

    const spinner = output.spinner('Loading tool info...');

    try {
      const response = await this.client.getToolBySlug(this.selectedTool);

      spinner.stop();

      if (!response.success || !response.data) {
        output.error('Tool not found');
        return;
      }

      const tool = response.data;

      output.text('');
      output.heading(tool.name);
      output.text(`Slug: ${tool.slug}`);
      output.text(`Category: ${tool.category}`);
      output.text(`Version: ${tool.npmVersion}`);
      output.text('');
      output.text('Description:');
      output.text(`  ${tool.description || '(none)'}`);

      if (tool.inputSchema) {
        output.text('');
        output.text('Input Schema:');
        output.text(JSON.stringify(tool.inputSchema, null, 2));
      }

      if (verbose && tool.tools && tool.tools.length > 0) {
        output.text('');
        output.text('Available operations:');
        for (const t of tool.tools) {
          output.listItem(`${t.name}: ${t.description || ''}`);
        }
      }

      output.text('');
    } catch {
      spinner.fail('Failed to load tool info');
    }
  }

  private async executeTool(
    params: Record<string, unknown>,
    output: ReturnType<typeof createOutput>,
    verbose: boolean
  ): Promise<void> {
    if (!this.selectedTool) {
      output.warning('No tool selected');
      return;
    }

    const spinner = output.spinner('Executing...');

    try {
      const result = await this.client.executeTool(this.selectedTool, params);

      spinner.stop();

      output.success('Result:');
      output.text(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail('Execution failed');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        verbose ? String(error) : undefined
      );
    }
  }
}
