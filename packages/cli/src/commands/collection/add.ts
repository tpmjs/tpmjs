import { Args, Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class CollectionAdd extends Command {
  static description = 'Add tools to a collection';

  static examples = [
    '<%= config.bin %> <%= command.id %> my-collection tool-id-1',
    '<%= config.bin %> <%= command.id %> my-collection tool-id-1 tool-id-2 tool-id-3',
    '<%= config.bin %> <%= command.id %> my-collection --package @anthropic/mcp-tools',
    '<%= config.bin %> <%= command.id %> my-collection --search "firecrawl"',
    '<%= config.bin %> <%= command.id %> my-collection --search "web scraper" --category web',
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
    package: Flags.string({
      char: 'p',
      description: 'Add all tools from an npm package',
    }),
    search: Flags.string({
      char: 's',
      description: 'Search for tools and add matching results',
    }),
    category: Flags.string({
      char: 'c',
      description: 'Filter search results by category (use with --search)',
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Max tools to add from search results (default: 5)',
      default: 5,
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

    // Handle --search flag: search for tools and add them
    if (flags.search) {
      const spinner = output.spinner(`Searching for "${flags.search}"...`);

      try {
        const searchResult = await client.searchTools({
          query: flags.search,
          category: flags.category,
          limit: flags.limit,
        });

        spinner.stop();

        if (searchResult.data.length === 0) {
          output.info(`No tools found matching "${flags.search}"`);
          return;
        }

        const toolIds = searchResult.data.map((t) => t.id);
        const toolNames = searchResult.data.map((t) => `${t.name} (${t.npmPackageName})`);

        output.info(`Found ${searchResult.data.length} tool(s):`);
        for (const name of toolNames) {
          output.listItem(name);
        }
        output.newLine();

        const addSpinner = output.spinner(
          `Adding ${toolIds.length} tool(s) to ${args.collection}...`
        );

        await client.addToolsToCollection(args.collection, toolIds);

        addSpinner.stop();

        if (flags.json) {
          output.json({
            success: true,
            search: flags.search,
            added: toolIds.length,
            tools: searchResult.data.map((t) => ({
              id: t.id,
              name: t.name,
              package: t.npmPackageName,
              category: t.category,
            })),
          });
          return;
        }

        output.success(`Added ${toolIds.length} tool(s) to ${args.collection}`);
      } catch (error) {
        spinner.stop();
        output.error(
          error instanceof Error ? error.message : 'Unknown error',
          flags.verbose ? String(error) : undefined
        );
      }

      return;
    }

    // Handle --package flag: bulk add all tools from a package
    if (flags.package) {
      const spinner = output.spinner(`Adding tools from ${flags.package}...`);

      try {
        const result = await client.addToolsFromPackage(args.collection, flags.package);

        spinner.stop();

        if (flags.json) {
          output.json(result);
          return;
        }

        if (result.data) {
          output.success(
            `Added ${result.data.added} tool(s) from ${flags.package}` +
              (result.data.skipped > 0 ? ` (${result.data.skipped} already in collection)` : '')
          );
          if (result.data.limitReached) {
            output.text('  Collection tool limit reached. Some tools were not added.');
          }
        }
      } catch (error) {
        spinner.fail('Failed to add tools from package');
        output.error(
          error instanceof Error ? error.message : 'Unknown error',
          flags.verbose ? String(error) : undefined
        );
      }

      return;
    }

    // Get tool IDs from remaining arguments
    const toolIds = argv.slice(1) as string[];

    if (toolIds.length === 0) {
      output.error('Please specify at least one tool ID to add, or use --package or --search');
      output.text('Examples:');
      output.text('  tpm collection add my-collection tool-id-1 tool-id-2');
      output.text('  tpm collection add my-collection --package @anthropic/mcp-tools');
      output.text('  tpm collection add my-collection --search "firecrawl"');
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
