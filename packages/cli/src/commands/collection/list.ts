import { Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class CollectionList extends Command {
  static description = 'List your collections';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --limit 10',
  ];

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
    const { flags } = await this.parse(CollectionList);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    const spinner = output.spinner('Fetching collections...');

    try {
      const response = await client.listCollections({
        limit: flags.limit,
        offset: flags.offset,
      });

      spinner.stop();

      if (flags.json) {
        output.json(response);
        return;
      }

      if (response.data.length === 0) {
        output.info('No collections found');
        output.text('Create one with: tpm collection create');
        return;
      }

      output.table(
        response.data.map((collection) => ({
          name: collection.name,
          slug: collection.slug || '-',
          public: collection.isPublic ? 'Yes' : 'No',
          tools: collection._count?.tools ?? 0,
          likes: collection.likeCount,
        })),
        [
          { key: 'name', header: 'Name', width: 30 },
          { key: 'slug', header: 'Slug', width: 25 },
          { key: 'public', header: 'Public', width: 8 },
          { key: 'tools', header: 'Tools', width: 8 },
          { key: 'likes', header: 'Likes', width: 8 },
        ]
      );

      output.newLine();
      output.text(
        output.dim(
          `Showing ${response.data.length} collection(s)` +
            (response.pagination.hasMore ? ` (more available)` : '')
        )
      );
    } catch (error) {
      spinner.fail('Failed to fetch collections');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
