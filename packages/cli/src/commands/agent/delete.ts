import { Args, Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';
import * as readline from 'node:readline';

export default class AgentDelete extends Command {
  static description = 'Delete an agent';

  static examples = [
    '<%= config.bin %> <%= command.id %> my-agent',
    '<%= config.bin %> <%= command.id %> my-agent --force',
  ];

  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
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
    id: Args.string({
      description: 'Agent ID or UID',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AgentDelete);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    // Get agent info first
    const agentResponse = await client.getAgent(args.id);
    if (!agentResponse.success || !agentResponse.data) {
      output.error('Agent not found');
      return;
    }

    const agent = agentResponse.data;

    // Confirm deletion
    if (!flags.force) {
      const confirmed = await this.confirm(
        `Are you sure you want to delete agent "${agent.name}"? This cannot be undone.`
      );
      if (!confirmed) {
        output.info('Deletion cancelled');
        return;
      }
    }

    const spinner = output.spinner('Deleting agent...');

    try {
      await client.deleteAgent(args.id);

      spinner.stop();

      if (flags.json) {
        output.json({ success: true, deleted: args.id });
        return;
      }

      output.success(`Agent "${agent.name}" deleted successfully`);
    } catch (error) {
      spinner.fail('Failed to delete agent');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }

  private async confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(`${message} [y/N] `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }
}
