import { Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class AgentCreate extends Command {
  static description = 'Create a new agent';

  static examples = [
    '<%= config.bin %> <%= command.id %> --name "My Agent" --provider ANTHROPIC --model claude-3-5-sonnet-20241022',
    '<%= config.bin %> <%= command.id %> --name "GPT Agent" --provider OPENAI --model gpt-4o --public',
  ];

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'Agent name',
      required: true,
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
      description: 'AI provider (ANTHROPIC, OPENAI, GOOGLE, GROQ, MISTRAL)',
      required: true,
      options: ['ANTHROPIC', 'OPENAI', 'GOOGLE', 'GROQ', 'MISTRAL'],
    }),
    model: Flags.string({
      char: 'm',
      description: 'Model ID',
      required: true,
    }),
    'system-prompt': Flags.string({
      char: 's',
      description: 'System prompt',
    }),
    temperature: Flags.string({
      char: 't',
      description: 'Temperature (0-2)',
      default: '0.7',
    }),
    public: Flags.boolean({
      description: 'Make agent public',
      default: true,
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
    const { flags } = await this.parse(AgentCreate);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    const spinner = output.spinner('Creating agent...');

    try {
      const response = await client.createAgent({
        name: flags.name,
        uid: flags.uid,
        description: flags.description,
        provider: flags.provider as 'ANTHROPIC' | 'OPENAI' | 'GOOGLE' | 'GROQ' | 'MISTRAL',
        modelId: flags.model,
        systemPrompt: flags['system-prompt'],
        temperature: parseFloat(flags.temperature),
        isPublic: flags.public,
      });

      spinner.stop();

      if (!response.success || !response.data) {
        output.error(response.message || 'Failed to create agent');
        return;
      }

      if (flags.json) {
        output.json(response.data);
        return;
      }

      output.success(`Agent "${response.data.name}" created successfully`);
      output.newLine();
      output.keyValue('ID', response.data.id);
      output.keyValue('UID', response.data.uid);
      output.keyValue('Provider', response.data.provider);
      output.keyValue('Model', response.data.modelId);
      output.keyValue('Public', response.data.isPublic ? 'Yes' : 'No');
      output.newLine();
      output.text(`Chat with it: tpm agent chat ${response.data.uid}`);
    } catch (error) {
      spinner.fail('Failed to create agent');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
