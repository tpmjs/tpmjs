import { Args, Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class AgentUpdate extends Command {
  static description = 'Update an agent';

  static examples = [
    '<%= config.bin %> <%= command.id %> my-agent --name "New Name"',
    '<%= config.bin %> <%= command.id %> my-agent --temperature 0.5 --public false',
  ];

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'Agent name',
    }),
    uid: Flags.string({
      description: 'Unique identifier (URL-friendly)',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Agent description',
    }),
    provider: Flags.string({
      char: 'p',
      description: 'AI provider',
      options: ['ANTHROPIC', 'OPENAI', 'GOOGLE', 'GROQ', 'MISTRAL'],
    }),
    model: Flags.string({
      char: 'm',
      description: 'Model ID',
    }),
    'system-prompt': Flags.string({
      char: 's',
      description: 'System prompt',
    }),
    temperature: Flags.string({
      char: 't',
      description: 'Temperature (0-2)',
    }),
    public: Flags.boolean({
      description: 'Make agent public',
      allowNo: true,
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
    const { args, flags } = await this.parse(AgentUpdate);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    // Build update payload
    const updates: Record<string, unknown> = {};
    if (flags.name) updates.name = flags.name;
    if (flags.uid) updates.uid = flags.uid;
    if (flags.description !== undefined) updates.description = flags.description;
    if (flags.provider) updates.provider = flags.provider;
    if (flags.model) updates.modelId = flags.model;
    if (flags['system-prompt'] !== undefined) updates.systemPrompt = flags['system-prompt'];
    if (flags.temperature) updates.temperature = parseFloat(flags.temperature);
    if (flags.public !== undefined) updates.isPublic = flags.public;

    if (Object.keys(updates).length === 0) {
      output.error('No updates specified. Use --help to see available options.');
      return;
    }

    const spinner = output.spinner('Updating agent...');

    try {
      const response = await client.updateAgent(args.id, updates);

      spinner.stop();

      if (!response.success || !response.data) {
        output.error(response.message || 'Failed to update agent');
        return;
      }

      if (flags.json) {
        output.json(response.data);
        return;
      }

      output.success(`Agent "${response.data.name}" updated successfully`);
    } catch (error) {
      spinner.fail('Failed to update agent');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
