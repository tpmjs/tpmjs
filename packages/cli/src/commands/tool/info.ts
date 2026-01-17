import { Args, Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class ToolInfo extends Command {
  static description = 'Get detailed information about a tool';

  static examples = [
    '<%= config.bin %> <%= command.id %> @tpmjs/official-firecrawl scrapeTool',
    '<%= config.bin %> <%= command.id %> firecrawl-tool default',
  ];

  static flags = {
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
    package: Args.string({
      description: 'Package name (e.g., @tpmjs/official-firecrawl)',
      required: true,
    }),
    tool: Args.string({
      description: 'Tool name (e.g., scrapeTool)',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ToolInfo);
    const output = createOutput(flags);
    const client = getClient();

    const spinner = output.spinner('Fetching tool info...');

    try {
      const response = await client.getTool(args.package, args.tool);

      spinner.stop();

      if (!response.success || !response.data) {
        output.error('Tool not found');
        return;
      }

      const tool = response.data;

      if (flags.json) {
        output.json(tool);
        return;
      }

      output.heading(`${tool.name}`);

      output.keyValue('Package', tool.package?.npmPackageName || tool.npmPackageName);
      output.keyValue('Category', tool.package?.category || tool.category);
      output.keyValue('Official', (tool.package?.isOfficial || tool.isOfficial) ? 'Yes' : 'No');
      output.newLine();

      output.subheading('Description');
      output.text(tool.description || 'No description available');
      output.newLine();

      output.subheading('Health Status');
      output.keyValue('Import', formatHealthBadge(tool.importHealth));
      output.keyValue('Execution', formatHealthBadge(tool.executionHealth));
      output.newLine();

      output.subheading('Metrics');
      output.keyValue('Quality Score', tool.qualityScore ? tool.qualityScore.toFixed(2) : 'N/A');
      output.keyValue('Downloads/Month', formatDownloads(tool.package?.npmDownloadsLastMonth || tool.npmDownloadsLastMonth));
      output.keyValue('Likes', tool.likeCount.toString());
      output.newLine();

      output.subheading('Links');
      output.text(`Web: ${output.link('View on TPMJS', `https://tpmjs.com/tool/${args.package}/${args.tool}`)}`);
      output.text(`npm: ${output.link('View on npm', `https://www.npmjs.com/package/${args.package}`)}`);
    } catch (error) {
      spinner.fail('Failed to fetch tool info');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}

function formatDownloads(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

function formatHealthBadge(health: string): string {
  switch (health) {
    case 'HEALTHY':
      return '✓ Healthy';
    case 'BROKEN':
      return '✗ Broken';
    default:
      return '? Unknown';
  }
}
