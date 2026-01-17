import { createServer } from 'node:http';
import { URL } from 'node:url';
import { Args, Command, Flags } from '@oclif/core';
import open from 'open';
import { TpmClient } from '../../lib/api-client.js';
import { getApiUrl, saveCredentials } from '../../lib/config.js';
import { createOutput } from '../../lib/output.js';

export default class Login extends Command {
  static description = 'Authenticate with TPMJS';

  static examples = [
    '<%= config.bin %> <%= command.id %> --api-key tpm_xxxxx',
    '<%= config.bin %> <%= command.id %> --browser',
  ];

  static flags = {
    'api-key': Flags.string({
      char: 'k',
      description: 'API key (or set TPMJS_API_KEY environment variable)',
    }),
    browser: Flags.boolean({
      char: 'b',
      description: 'Open browser for OAuth authentication',
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
    key: Args.string({
      description: 'API key (alternative to --api-key flag)',
      required: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Login);
    const output = createOutput(flags);

    const apiKey = flags['api-key'] ?? args.key;

    if (apiKey) {
      // Direct API key authentication
      await this.loginWithApiKey(apiKey, output, flags);
    } else if (flags.browser) {
      // Browser OAuth flow
      await this.loginWithBrowser(output, flags);
    } else {
      // Prompt for API key
      output.info('No API key provided. Use --api-key or --browser flag.');
      output.newLine();
      output.text('Options:');
      output.listItem('tpm auth login --api-key <your-api-key>');
      output.listItem('tpm auth login --browser (opens browser for OAuth)');
      output.newLine();
      output.text(
        `Get your API key at: ${output.link('tpmjs.com/dashboard/settings/tpmjs-api-keys', 'https://tpmjs.com/dashboard/settings/tpmjs-api-keys')}`
      );
    }
  }

  private async loginWithApiKey(
    apiKey: string,
    output: ReturnType<typeof createOutput>,
    flags: { json?: boolean; verbose?: boolean }
  ): Promise<void> {
    const spinner = output.spinner('Validating API key...');

    try {
      // Test the API key
      const client = new TpmClient({ apiKey });
      const response = await client.whoami();

      if (!response.success || !response.data) {
        spinner.fail('Invalid API key');
        return;
      }

      // Save credentials
      saveCredentials({ apiKey });
      spinner.succeed('Logged in successfully');

      if (flags.json) {
        output.json({
          success: true,
          user: response.data,
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
      }
    } catch (error) {
      spinner.fail('Authentication failed');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }

  private async loginWithBrowser(
    output: ReturnType<typeof createOutput>,
    flags: { json?: boolean; verbose?: boolean }
  ): Promise<void> {
    const port = 9876;
    const callbackUrl = `http://localhost:${port}/callback`;
    const state = crypto.randomUUID();

    output.info('Opening browser for authentication...');

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        clearTimeout(timeoutId);
        server.close();
      };

      const server = createServer(async (req, res) => {
        const url = new URL(req.url ?? '/', `http://localhost:${port}`);

        if (url.pathname === '/callback') {
          const receivedState = url.searchParams.get('state');
          const apiKey = url.searchParams.get('key');
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(
              '<html><body><h1>Authentication Failed</h1><p>You can close this window.</p></body></html>'
            );
            cleanup();
            output.error(`Authentication failed: ${error}`);
            resolve();
            return;
          }

          if (receivedState !== state) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(
              '<html><body><h1>Invalid State</h1><p>Authentication failed due to invalid state.</p></body></html>'
            );
            cleanup();
            output.error('Authentication failed: Invalid state parameter');
            resolve();
            return;
          }

          if (apiKey) {
            saveCredentials({ apiKey });

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(
              '<html><body><h1>Success!</h1><p>You are now logged in. You can close this window.</p></body></html>'
            );
            cleanup();

            output.success('Logged in successfully via browser');

            if (flags.json) {
              output.json({ success: true });
            }

            resolve();
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html><body><h1>Error</h1><p>No API key received.</p></body></html>');
            cleanup();
            output.error('No API key received from authentication');
            resolve();
          }
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      });

      server.listen(port, async () => {
        const authUrl = `${getApiUrl().replace('/api', '')}/cli/auth?state=${state}&callback=${encodeURIComponent(callbackUrl)}`;

        output.debug(`Auth URL: ${authUrl}`);
        output.text('Waiting for authentication...');

        try {
          await open(authUrl);
        } catch {
          output.warning('Could not open browser automatically.');
          output.text(`Please open this URL manually: ${authUrl}`);
        }
      });

      // Timeout after 5 minutes
      timeoutId = setTimeout(
        () => {
          server.close();
          output.error('Authentication timed out');
          resolve();
        },
        5 * 60 * 1000
      );
    });
  }
}
