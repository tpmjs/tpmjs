import { Args, Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class CollectionAdd extends Command {
  static description = 'Add tools to a collection';

  static examples = [
    '<%= config.bin %> <%= command.id %> my-collection tool-id-1',
    '<%= config.bin %> <%= command.id %> my-collection tool-id-1 tool-id-2 tool-id-3',
  ];

  static strict = false; // Allow variable number of arguments

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
  };

  async run(): Promise<void> {
    const { args, argv, flags } = await this.parse(CollectionAdd);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    // Get tool IDs from remaining arguments
    const toolIds = argv.slice(1) as string[];

    if (toolIds.length === 0) {
      output.error('Please specify at least one tool ID to add');
      output.text('Example: tpm collection add my-collection tool-id-1 tool-id-2');
      return;
    }

    const spinner = output.spinner(`Adding ${toolIds.length} tool(s)...`);

    try {
      await client.addToolsToCollection(args.collection, toolIds);

      spinner.stop();

      if (flags.json) {
        output.json({ success: true, added: toolIds.length, toolIds });
        return;
      }

      output.success(`Added ${toolIds.length} tool(s) to collection`);
      for (const toolId of toolIds) {
        output.listItem(toolId);
      }
    } catch (error) {
      spinner.fail('Failed to add tools');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
