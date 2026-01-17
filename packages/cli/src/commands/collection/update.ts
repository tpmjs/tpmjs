import { Args, Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class CollectionUpdate extends Command {
  static description = 'Update a collection';

  static examples = [
    '<%= config.bin %> <%= command.id %> my-collection --name "New Name"',
    '<%= config.bin %> <%= command.id %> my-collection --public',
  ];

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'Collection name',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Collection description',
    }),
    public: Flags.boolean({
      description: 'Make collection public',
      allowNo: true,
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
    id: Args.string({
      description: 'Collection ID or slug',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CollectionUpdate);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    // Build update payload
    const updates: Record<string, unknown> = {};
    if (flags.name) updates.name = flags.name;
    if (flags.description !== undefined) updates.description = flags.description;
    if (flags.public !== undefined) updates.isPublic = flags.public;

    if (Object.keys(updates).length === 0) {
      output.error('No updates specified. Use --help to see available options.');
      return;
    }

    const spinner = output.spinner('Updating collection...');

    try {
      const response = await client.updateCollection(args.id, updates);

      spinner.stop();

      if (!response.success || !response.data) {
        output.error(response.message || 'Failed to update collection');
        return;
      }

      if (flags.json) {
        output.json(response.data);
        return;
      }

      output.success(`Collection "${response.data.name}" updated successfully`);
    } catch (error) {
      spinner.fail('Failed to update collection');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
