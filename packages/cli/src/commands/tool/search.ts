import { Args, Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class ToolSearch extends Command {
  static description = 'Search for tools in the TPMJS registry';

  static examples = [
    '<%= config.bin %> <%= command.id %> firecrawl',
    '<%= config.bin %> <%= command.id %> "web scraper" --category web',
    '<%= config.bin %> <%= command.id %> --category data --limit 20',
  ];

  static flags = {
    category: Flags.string({
      char: 'c',
      description: 'Filter by category',
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of results',
      default: 20,
    }),
    offset: Flags.integer({
      char: 'o',
      description: 'Offset for pagination',
      default: 0,
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
    query: Args.string({
      description: 'Search query',
      required: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ToolSearch);
    const output = createOutput(flags);
    const client = getClient();

    const spinner = output.spinner('Searching tools...');

    try {
      const response = await client.searchTools({
        query: args.query,
        category: flags.category,
        limit: flags.limit,
        offset: flags.offset,
      });

      spinner.stop();

      if (flags.json) {
        output.json(response);
        return;
      }

      if (response.data.length === 0) {
        output.info('No tools found');
        if (args.query) {
          output.text(`Try a different search query or remove the --category filter`);
        }
        return;
      }

      output.table(
        response.data.map((tool) => ({
          name: tool.name,
          package: tool.npmPackageName,
          category: tool.category,
          downloads: formatDownloads(tool.npmDownloadsLastMonth),
          health: formatHealth(tool.importHealth, tool.executionHealth),
          score: typeof tool.qualityScore === 'number' ? tool.qualityScore.toFixed(2) : '-',
        })),
        [
          { key: 'name', header: 'Name', width: 25 },
          { key: 'package', header: 'Package', width: 35 },
          { key: 'category', header: 'Category', width: 15 },
          { key: 'downloads', header: 'Downloads', width: 12 },
          { key: 'health', header: 'Health', width: 10 },
          { key: 'score', header: 'Score', width: 8 },
        ]
      );

      output.newLine();
      output.text(
        output.dim(
          `Showing ${response.data.length} of ${response.pagination.hasMore ? 'more' : response.data.length} tools` +
            (args.query ? ` matching "${args.query}"` : '')
        )
      );

      if (response.pagination.hasMore) {
        output.text(
          output.dim(
            `Use --offset ${flags.offset + flags.limit} to see more results`
          )
        );
      }
    } catch (error) {
      spinner.fail('Search failed');
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

function formatHealth(importHealth: string, executionHealth: string): string {
  if (importHealth === 'BROKEN' || executionHealth === 'BROKEN') {
    return 'Broken';
  }
  if (importHealth === 'HEALTHY' && executionHealth === 'HEALTHY') {
    return 'Healthy';
  }
  return 'Unknown';
}
