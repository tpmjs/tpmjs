import { Command, Flags } from '@oclif/core';
import { hasCredentials, getApiKey, getApiUrl } from '../../lib/config.js';
import { TpmClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class Status extends Command {
  static description = 'Show authentication status';

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
    const { flags } = await this.parse(Status);
    const output = createOutput(flags);

    const apiKey = getApiKey();
    const apiUrl = getApiUrl();
    const hasStoredCredentials = hasCredentials();

    // Determine auth source
    let authSource: 'env' | 'config' | 'none' = 'none';
    if (process.env.TPMJS_API_KEY) {
      authSource = 'env';
    } else if (hasStoredCredentials) {
      authSource = 'config';
    }

    if (!apiKey) {
      if (flags.json) {
        output.json({
          authenticated: false,
          authSource: null,
          apiUrl,
        });
      } else {
        output.warning('Not authenticated');
        output.newLine();
        output.text('Run `tpm auth login` to authenticate.');
      }
      return;
    }

    // Test the API key
    const spinner = output.spinner('Checking authentication...');

    try {
      const client = new TpmClient({ apiKey });
      const response = await client.whoami();

      if (!response.success || !response.data) {
        spinner.fail('API key is invalid');

        if (flags.json) {
          output.json({
            authenticated: false,
            authSource,
            apiUrl,
            error: 'Invalid API key',
          });
        }
        return;
      }

      spinner.succeed('Authenticated');

      if (flags.json) {
        output.json({
          authenticated: true,
          authSource,
          apiUrl,
          user: response.data,
          keyPrefix: apiKey.substring(0, 12) + '...',
        });
      } else {
        output.newLine();
        output.keyValue('Email', response.data.email);
        if (response.data.username) {
          output.keyValue('Username', response.data.username);
        }
        if (response.data.name) {
          output.keyValue('Name', response.data.name);
        }
        output.keyValue('API URL', apiUrl);
        output.keyValue('Auth Source', authSource === 'env' ? 'Environment variable' : 'Config file');
        output.keyValue('Key Prefix', apiKey.substring(0, 12) + '...');
      }
    } catch (error) {
      spinner.fail('Failed to verify authentication');

      if (flags.json) {
        output.json({
          authenticated: false,
          authSource,
          apiUrl,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } else {
        output.error(
          error instanceof Error ? error.message : 'Unknown error',
          flags.verbose ? String(error) : undefined
        );
      }
    }
  }
}
