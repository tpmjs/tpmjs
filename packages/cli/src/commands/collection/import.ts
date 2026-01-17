import { Args, Command, Flags } from '@oclif/core';
import * as fs from 'node:fs';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class CollectionImport extends Command {
  static description = 'Import tools to a collection from a file';

  static examples = [
    '<%= config.bin %> <%= command.id %> my-collection --file tools.txt',
    '<%= config.bin %> <%= command.id %> my-collection --file tools.json',
  ];

  static flags = {
    file: Flags.string({
      char: 'f',
      description: 'File containing tool IDs (one per line or JSON array)',
      required: true,
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
    collection: Args.string({
      description: 'Collection ID or slug',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CollectionImport);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    // Read tool IDs from file
    if (!fs.existsSync(flags.file)) {
      output.error(`File not found: ${flags.file}`);
      return;
    }

    const content = fs.readFileSync(flags.file, 'utf-8').trim();
    let toolIds: string[];

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        toolIds = parsed.map(String);
      } else {
        output.error('JSON file must contain an array of tool IDs');
        return;
      }
    } catch {
      // Parse as line-separated text
      toolIds = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));
    }

    if (toolIds.length === 0) {
      output.error('No tool IDs found in file');
      return;
    }

    output.info(`Found ${toolIds.length} tool(s) in file`);

    const spinner = output.spinner(`Adding ${toolIds.length} tool(s)...`);

    try {
      let added = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const toolId of toolIds) {
        try {
          await client.addToolsToCollection(args.collection, [toolId]);
          added++;
        } catch (error) {
          failed++;
          errors.push(`${toolId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      spinner.stop();

      if (flags.json) {
        output.json({ success: true, added, failed, errors });
        return;
      }

      if (added > 0) {
        output.success(`Added ${added} tool(s) to collection`);
      }
      if (failed > 0) {
        output.warning(`Failed to add ${failed} tool(s)`);
        if (flags.verbose) {
          for (const err of errors) {
            output.listItem(err);
          }
        }
      }
    } catch (error) {
      spinner.fail('Import failed');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
