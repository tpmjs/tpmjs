import { Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class Whoami extends Command {
  static description = 'Show current user information';

  static examples = ['<%= config.bin %> <%= command.id %>'];

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

  async run(): Promise<void> {
    const { flags } = await this.parse(Whoami);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    const spinner = output.spinner('Fetching user info...');

    try {
      const response = await client.whoami();

      if (!response.success || !response.data) {
        spinner.fail('Failed to fetch user info');
        return;
      }

      spinner.stop();

      if (flags.json) {
        output.json(response.data);
      } else {
        output.keyValue('Email', response.data.email);
        if (response.data.username) {
          output.keyValue('Username', response.data.username);
        }
        if (response.data.name) {
          output.keyValue('Name', response.data.name);
        }
        output.keyValue('User ID', response.data.id);
      }
    } catch (error) {
      spinner.fail('Failed to fetch user info');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
