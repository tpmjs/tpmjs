import { Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class CollectionCreate extends Command {
  static description = 'Create a new collection';

  static examples = [
    '<%= config.bin %> <%= command.id %> --name "My Tools"',
    '<%= config.bin %> <%= command.id %> --name "Web Scrapers" --description "Tools for web scraping" --public',
  ];

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'Collection name',
      required: true,
    }),
    description: Flags.string({
      char: 'd',
      description: 'Collection description',
    }),
    public: Flags.boolean({
      description: 'Make collection public',
      default: false,
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
    const { flags } = await this.parse(CollectionCreate);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    const spinner = output.spinner('Creating collection...');

    try {
      const response = await client.createCollection({
        name: flags.name,
        description: flags.description,
        isPublic: flags.public,
      });

      spinner.stop();

      if (!response.success || !response.data) {
        output.error(response.message || 'Failed to create collection');
        return;
      }

      if (flags.json) {
        output.json(response.data);
        return;
      }

      output.success(`Collection "${response.data.name}" created successfully`);
      output.newLine();
      output.keyValue('ID', response.data.id);
      if (response.data.slug) {
        output.keyValue('Slug', response.data.slug);
      }
      output.keyValue('Public', response.data.isPublic ? 'Yes' : 'No');
      output.newLine();
      output.text(`Add tools: tpm collection add ${response.data.id} <tool-id>`);
    } catch (error) {
      spinner.fail('Failed to create collection');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
