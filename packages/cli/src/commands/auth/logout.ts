import { Command, Flags } from '@oclif/core';
import { deleteCredentials, hasCredentials } from '../../lib/config.js';
import { createOutput } from '../../lib/output.js';

export default class Logout extends Command {
  static description = 'Log out from TPMJS';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Logout);
    const output = createOutput(flags);

    if (!hasCredentials()) {
      if (flags.json) {
        output.json({ success: true, message: 'Not logged in' });
      } else {
        output.info('Not logged in');
      }
      return;
    }

    deleteCredentials();

    if (flags.json) {
      output.json({ success: true, message: 'Logged out successfully' });
    } else {
      output.success('Logged out successfully');
    }
  }
}
