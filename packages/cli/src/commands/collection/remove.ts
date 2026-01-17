import { Args, Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class CollectionRemove extends Command {
  static description = 'Remove a tool from a collection';

  static examples = [
    '<%= config.bin %> <%= command.id %> my-collection tool-id-1',
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
    collection: Args.string({
      description: 'Collection ID or slug',
      required: true,
    }),
    tool: Args.string({
      description: 'Tool ID to remove',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CollectionRemove);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    const spinner = output.spinner('Removing tool...');

    try {
      await client.removeToolFromCollection(args.collection, args.tool);

      spinner.stop();

      if (flags.json) {
        output.json({ success: true, removed: args.tool });
        return;
      }

      output.success(`Removed tool from collection`);
    } catch (error) {
      spinner.fail('Failed to remove tool');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
