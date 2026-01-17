import { Command, Flags } from '@oclif/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class ToolValidate extends Command {
  static description = 'Validate a tpmjs package configuration';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --path ./my-tool',
  ];

  static flags = {
    path: Flags.string({
      char: 'p',
      description: 'Path to package directory (defaults to current directory)',
      default: '.',
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

  async run(): Promise<void> {
    const { flags } = await this.parse(ToolValidate);
    const output = createOutput(flags);
    const client = getClient();

    const packagePath = path.resolve(flags.path, 'package.json');

    // Check if package.json exists
    if (!fs.existsSync(packagePath)) {
      output.error(`package.json not found at ${packagePath}`);
      return;
    }

    let packageJson: Record<string, unknown>;
    try {
      const content = fs.readFileSync(packagePath, 'utf-8');
      packageJson = JSON.parse(content);
    } catch (error) {
      output.error('Failed to parse package.json', error instanceof Error ? error.message : undefined);
      return;
    }

    // Check for tpmjs keyword
    const keywords = (packageJson.keywords as string[]) || [];
    const hasTpmjsKeyword = keywords.includes('tpmjs');

    if (!hasTpmjsKeyword) {
      output.warning('Missing "tpmjs" keyword in package.json');
      output.text('Add "tpmjs" to the keywords array for auto-discovery');
    }

    // Check for tpmjs field
    const tpmjsField = packageJson.tpmjs;
    if (!tpmjsField) {
      output.error('Missing "tpmjs" field in package.json');
      output.newLine();
      output.text('Add a tpmjs field like:');
      output.code(
        JSON.stringify(
          {
            tpmjs: {
              category: 'utilities',
              tools: ['myTool'],
            },
          },
          null,
          2
        ),
        'json'
      );
      return;
    }

    // Validate with API
    const spinner = output.spinner('Validating tpmjs configuration...');

    try {
      const response = await client.validateTpmjsField(tpmjsField);

      spinner.stop();

      if (flags.json) {
        output.json({
          valid: response.data?.valid ?? false,
          tier: response.data?.tier,
          errors: response.data?.errors,
          hasTpmjsKeyword,
        });
        return;
      }

      if (response.data?.valid) {
        output.success('Configuration is valid');
        output.newLine();
        output.keyValue('Tier', response.data.tier || 'minimal');
        output.keyValue('Has tpmjs keyword', hasTpmjsKeyword ? 'Yes' : 'No (add for auto-discovery)');

        if (!hasTpmjsKeyword) {
          output.newLine();
          output.warning('Add "tpmjs" to keywords for auto-discovery on npm publish');
        }
      } else {
        output.error('Configuration is invalid');
        if (response.data?.errors && Array.isArray(response.data.errors)) {
          output.newLine();
          output.subheading('Errors:');
          for (const error of response.data.errors) {
            output.listItem(JSON.stringify(error));
          }
        }
      }
    } catch (error) {
      spinner.fail('Validation failed');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
