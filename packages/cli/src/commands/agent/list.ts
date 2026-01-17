import { Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class AgentList extends Command {
  static description = 'List your agents';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --limit 10',
  ];

  static flags = {
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of results',
      default: 20,
    }),
    offset: Flags.integer({
      char: 'o',
      description: 'Offset for pagination',
      default: 0,
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
    const { flags } = await this.parse(AgentList);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    const spinner = output.spinner('Fetching agents...');

    try {
      const response = await client.listAgents({
        limit: flags.limit,
        offset: flags.offset,
      });

      spinner.stop();

      if (flags.json) {
        output.json(response);
        return;
      }

      if (response.data.length === 0) {
        output.info('No agents found');
        output.text('Create one with: tpm agent create');
        return;
      }

      output.table(
        response.data.map((agent) => ({
          uid: agent.uid,
          name: agent.name,
          provider: agent.provider,
          model: agent.modelId,
          public: agent.isPublic ? 'Yes' : 'No',
          tools: agent._count?.tools ?? 0,
          collections: agent._count?.collections ?? 0,
        })),
        [
          { key: 'uid', header: 'UID', width: 20 },
          { key: 'name', header: 'Name', width: 25 },
          { key: 'provider', header: 'Provider', width: 12 },
          { key: 'model', header: 'Model', width: 20 },
          { key: 'public', header: 'Public', width: 8 },
          { key: 'tools', header: 'Tools', width: 7 },
          { key: 'collections', header: 'Collections', width: 12 },
        ]
      );

      output.newLine();
      output.text(
        output.dim(
          `Showing ${response.data.length} agent(s)` +
            (response.pagination.hasMore ? ` (more available)` : '')
        )
      );
    } catch (error) {
      spinner.fail('Failed to fetch agents');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
