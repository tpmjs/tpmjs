import { Args, Command, Flags } from '@oclif/core';
import {
  type ApiResponse,
  getClient,
  type PaginatedResponse,
  type Scenario,
} from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class ScenarioList extends Command {
  static description = 'List scenarios for a collection or all public scenarios';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> my-collection',
    '<%= config.bin %> <%= command.id %> --limit 20 --json',
  ];

  static args = {
    collection: Args.string({
      description: 'Collection ID or slug (optional - shows all public scenarios if omitted)',
      required: false,
    }),
  };

  static flags = {
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
    tags: Flags.string({
      char: 't',
      description: 'Filter by tags (comma-separated)',
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
    const { args, flags } = await this.parse(ScenarioList);
    const output = createOutput(flags);
    const client = getClient();

    const spinner = output.spinner('Fetching scenarios...');

    try {
      let response: PaginatedResponse<Scenario> | ApiResponse<{ scenarios: Scenario[] }>;

      if (args.collection) {
        // Try to find collection by ID or slug
        const collections = await client.listCollections({ limit: 100 });
        const collection = collections.data.find(
          (c) => c.id === args.collection || c.slug === args.collection
        );

        if (!collection) {
          spinner.fail('Collection not found');
          output.error(`No collection found with ID or slug: ${args.collection}`);
          return;
        }

        response = await client.listCollectionScenarios(collection.id, {
          limit: flags.limit,
          offset: flags.offset,
        });

        spinner.stop();

        if (flags.json) {
          output.json(response);
          return;
        }

        const scenarios =
          (
            response as unknown as {
              data: {
                scenarios: Array<{
                  id: string;
                  name: string | null;
                  prompt: string;
                  qualityScore: number;
                  totalRuns: number;
                  lastRunStatus: string | null;
                  tags: string[];
                }>;
              };
            }
          ).data?.scenarios || [];

        if (scenarios.length === 0) {
          output.info(`No scenarios found for collection "${collection.name}"`);
          output.text(
            'Generate some with: tpm scenario generate ' + (collection.slug || collection.id)
          );
          return;
        }

        output.text(output.bold(`Scenarios for ${collection.name}\n`));
        output.table(
          scenarios.map((s) => ({
            name: s.name || s.prompt.slice(0, 30) + '...',
            quality: (s.qualityScore * 100).toFixed(0) + '%',
            runs: s.totalRuns,
            status: s.lastRunStatus || '-',
            tags: s.tags.slice(0, 3).join(', ') || '-',
          })),
          [
            { key: 'name', header: 'Name', width: 35 },
            { key: 'quality', header: 'Quality', width: 10 },
            { key: 'runs', header: 'Runs', width: 8 },
            { key: 'status', header: 'Status', width: 8 },
            { key: 'tags', header: 'Tags', width: 20 },
          ]
        );
      } else {
        response = await client.listScenarios({
          limit: flags.limit,
          offset: flags.offset,
          tags: flags.tags,
        });

        spinner.stop();

        if (flags.json) {
          output.json(response);
          return;
        }

        if (response.data.length === 0) {
          output.info('No public scenarios found');
          return;
        }

        output.table(
          response.data.map((s) => ({
            name: s.name || s.prompt.slice(0, 30) + '...',
            collection: s.collection?.name || '-',
            quality: (s.qualityScore * 100).toFixed(0) + '%',
            runs: s.totalRuns,
            status: s.lastRunStatus || '-',
          })),
          [
            { key: 'name', header: 'Name', width: 35 },
            { key: 'collection', header: 'Collection', width: 25 },
            { key: 'quality', header: 'Quality', width: 10 },
            { key: 'runs', header: 'Runs', width: 8 },
            { key: 'status', header: 'Status', width: 8 },
          ]
        );

        output.newLine();
        output.text(
          output.dim(
            `Showing ${response.data.length} scenario(s)` +
              (response.pagination.hasMore ? ` (more available)` : '')
          )
        );
      }
    } catch (error) {
      spinner.fail('Failed to fetch scenarios');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
