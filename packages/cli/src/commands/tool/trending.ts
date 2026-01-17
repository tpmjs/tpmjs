import { Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class ToolTrending extends Command {
  static description = 'Show trending tools';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --limit 10',
  ];

  static flags = {
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of results',
      default: 10,
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

  async run(): Promise<void> {
    const { flags } = await this.parse(ToolTrending);
    const output = createOutput(flags);
    const client = getClient();

    const spinner = output.spinner('Fetching trending tools...');

    try {
      const response = await client.getTrendingTools({
        limit: flags.limit,
      });

      spinner.stop();

      if (flags.json) {
        output.json(response);
        return;
      }

      if (response.data.length === 0) {
        output.info('No trending tools found');
        return;
      }

      output.heading('Trending Tools');

      output.table(
        response.data.map((tool, index) => ({
          rank: `#${index + 1}`,
          name: tool.name,
          package: tool.npmPackageName,
          category: tool.category,
          downloads: formatDownloads(tool.npmDownloadsLastMonth),
          score: typeof tool.qualityScore === 'number' ? tool.qualityScore.toFixed(2) : '-',
        })),
        [
          { key: 'rank', header: '#', width: 4 },
          { key: 'name', header: 'Name', width: 25 },
          { key: 'package', header: 'Package', width: 35 },
          { key: 'category', header: 'Category', width: 15 },
          { key: 'downloads', header: 'Downloads', width: 12 },
          { key: 'score', header: 'Score', width: 8 },
        ]
      );
    } catch (error) {
      spinner.fail('Failed to fetch trending tools');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}

function formatDownloads(count: number | undefined): string {
  if (count === undefined || count === null) return '-';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}
