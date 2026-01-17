import { Command, Flags } from '@oclif/core';
import { execSync } from 'node:child_process';
import { createOutput } from '../lib/output.js';

export default class Update extends Command {
  static description = 'Update the TPMJS CLI to the latest version';

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
    check: Flags.boolean({
      description: 'Only check for updates, do not install',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Update);
    const output = createOutput(flags);

    const currentVersion = this.config.version;
    output.debug(`Current version: ${currentVersion}`);

    // Check for latest version on npm
    const spinner = output.spinner('Checking for updates...');

    try {
      const latestVersion = execSync('npm view @tpmjs/cli version', {
        encoding: 'utf-8',
        timeout: 10000,
      }).trim();

      spinner.stop();

      if (flags.json) {
        output.json({
          currentVersion,
          latestVersion,
          updateAvailable: latestVersion !== currentVersion,
        });
        return;
      }

      if (latestVersion === currentVersion) {
        output.success(`You're on the latest version (${currentVersion})`);
        return;
      }

      output.info(`Update available: ${currentVersion} → ${latestVersion}`);

      if (flags.check) {
        output.text('Run `tpm update` to install the update');
        return;
      }

      // Perform update
      const updateSpinner = output.spinner('Installing update...');

      try {
        // Try npm first, then pnpm, then yarn
        execSync('npm install -g @tpmjs/cli@latest', {
          encoding: 'utf-8',
          timeout: 120000,
          stdio: flags.verbose ? 'inherit' : 'pipe',
        });

        updateSpinner.succeed(`Updated to ${latestVersion}`);
        output.text('Restart your terminal to use the new version');
      } catch (installError) {
        updateSpinner.fail('Update failed');
        output.error(
          'Failed to install update',
          flags.verbose ? String(installError) : 'Try running: npm install -g @tpmjs/cli@latest'
        );
      }
    } catch (error) {
      spinner.fail('Failed to check for updates');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
