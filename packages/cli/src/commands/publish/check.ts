import { Args, Command, Flags } from '@oclif/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class PublishCheck extends Command {
  static description = 'Check if your package has been discovered by tpmjs.com';

  static examples = [
    '<%= config.bin %> <%= command.id %> @myorg/my-tool',
    '<%= config.bin %> <%= command.id %>',
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
    package: Args.string({
      description: 'npm package name (defaults to current directory)',
      required: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PublishCheck);
    const output = createOutput(flags);
    const client = getClient();

    // Determine package name
    let packageName = args.package as string | undefined;

    if (!packageName) {
      const packagePath = path.resolve('.', 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        packageName = packageJson.name;
      }
    }

    if (!packageName) {
      output.error('No package name provided and no package.json found');
      return;
    }

    output.info(`Checking discovery status for: ${packageName}`);

    const spinner = output.spinner('Checking tpmjs.com...');

    try {
      // Search for the package by npm name
      const searchResponse = await client.searchTools({ query: packageName, limit: 10 });

      spinner.stop();

      if (!searchResponse.data || searchResponse.data.length === 0) {
        // No results found
      }

      // Find exact match
      const exactMatch = searchResponse.data?.find(
        (tool) => tool.npmPackageName === packageName
      );

      if (flags.json) {
        output.json({
          packageName,
          discovered: Boolean(exactMatch),
          tool: exactMatch || null,
        });
        return;
      }

      if (exactMatch) {
        output.success('Package has been discovered!');
        output.divider();
        output.text(`Name: ${exactMatch.name}`);
        output.text(`Slug: ${exactMatch.slug}`);
        output.text(`Category: ${exactMatch.category}`);
        output.text(`Tier: ${exactMatch.tier}`);
        output.text(`Version: ${exactMatch.npmVersion}`);
        output.text(`Downloads (last month): ${exactMatch.npmDownloadsLastMonth?.toLocaleString() || 'N/A'}`);
        output.text(`Quality Score: ${exactMatch.qualityScore?.toFixed(2) || 'N/A'}`);
        output.text('');
        output.text(`View on tpmjs.com:`);
        output.text(`  https://tpmjs.com/tools/${exactMatch.slug}`);
      } else {
        output.warning('Package not yet discovered');
        output.text('');
        output.text('Possible reasons:');
        output.listItem('Package was recently published (sync runs every 2-15 minutes)');
        output.listItem('Missing "tpmjs" keyword in package.json keywords array');
        output.listItem('Missing or invalid "tpmjs" field in package.json');
        output.text('');
        output.text('To publish a TPMJS tool:');
        output.listItem('Add "tpmjs" to your package.json keywords');
        output.listItem('Add a valid "tpmjs" field with category and tools');
        output.listItem('Run `tpm tool validate` to check your configuration');
        output.listItem('Publish to npm with `npm publish`');
        output.text('');
        output.text('After publishing, your tool should appear within 15 minutes.');
      }
    } catch (error) {
      spinner.fail('Failed to check status');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
