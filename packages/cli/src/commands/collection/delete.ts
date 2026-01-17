import { Args, Command, Flags } from '@oclif/core';
import * as readline from 'node:readline';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class CollectionDelete extends Command {
  static description = 'Delete a collection';

  static examples = [
    '<%= config.bin %> <%= command.id %> my-collection',
    '<%= config.bin %> <%= command.id %> my-collection --force',
  ];

  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
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

  static args = {
    id: Args.string({
      description: 'Collection ID or slug',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CollectionDelete);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    // Get collection info first
    const collectionResponse = await client.getCollection(args.id);
    if (!collectionResponse.success || !collectionResponse.data) {
      output.error('Collection not found');
      return;
    }

    const collection = collectionResponse.data;

    // Confirm deletion
    if (!flags.force) {
      const confirmed = await this.confirm(
        `Are you sure you want to delete collection "${collection.name}"? This cannot be undone.`
      );
      if (!confirmed) {
        output.info('Deletion cancelled');
        return;
      }
    }

    const spinner = output.spinner('Deleting collection...');

    try {
      await client.deleteCollection(args.id);

      spinner.stop();

      if (flags.json) {
        output.json({ success: true, deleted: args.id });
        return;
      }

      output.success(`Collection "${collection.name}" deleted successfully`);
    } catch (error) {
      spinner.fail('Failed to delete collection');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }

  private async confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(`${message} [y/N] `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }
}
