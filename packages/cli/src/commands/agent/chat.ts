import { Args, Command, Flags } from '@oclif/core';
import * as readline from 'node:readline';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';
import { getApiKey, getApiUrl } from '../../lib/config.js';

export default class AgentChat extends Command {
  static description = 'Chat with an agent';

  static examples = [
    '<%= config.bin %> <%= command.id %> my-agent "Hello!"',
    '<%= config.bin %> <%= command.id %> my-agent --interactive',
    '<%= config.bin %> <%= command.id %> my-agent -i',
  ];

  static flags = {
    interactive: Flags.boolean({
      char: 'i',
      description: 'Enter interactive chat mode (REPL)',
      default: false,
    }),
    conversation: Flags.string({
      char: 'c',
      description: 'Continue existing conversation by ID',
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
    agent: Args.string({
      description: 'Agent ID or UID',
      required: true,
    }),
    message: Args.string({
      description: 'Message to send (required unless --interactive)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AgentChat);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    // Verify agent exists
    const agentResponse = await client.getAgent(args.agent);
    if (!agentResponse.success || !agentResponse.data) {
      output.error('Agent not found');
      return;
    }

    const agent = agentResponse.data;

    if (flags.interactive) {
      await this.interactiveChat(agent, flags, output);
    } else if (args.message) {
      await this.singleMessage(agent, args.message, flags, output);
    } else {
      output.error('Please provide a message or use --interactive flag');
      output.text('Examples:');
      output.listItem(`tpm agent chat ${args.agent} "Hello!"`);
      output.listItem(`tpm agent chat ${args.agent} --interactive`);
    }
  }

  private async singleMessage(
    agent: { id: string; name: string },
    message: string,
    flags: { json?: boolean; verbose?: boolean; conversation?: string },
    output: ReturnType<typeof createOutput>
  ): Promise<void> {
    const spinner = output.spinner('Sending message...');

    try {
      const response = await this.sendChatMessage(agent.id, message, flags.conversation);

      spinner.stop();

      if (flags.json) {
        output.json(response);
        return;
      }

      if (response.content) {
        output.text(response.content);
      }

      if (response.toolCalls && response.toolCalls.length > 0) {
        output.newLine();
        output.subheading('Tool Calls:');
        for (const call of response.toolCalls) {
          output.listItem(`${call.name}: ${JSON.stringify(call.result)}`);
        }
      }
    } catch (error) {
      spinner.fail('Failed to send message');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }

  private async interactiveChat(
    agent: { id: string; name: string; uid: string },
    flags: { json?: boolean; verbose?: boolean; conversation?: string },
    output: ReturnType<typeof createOutput>
  ): Promise<void> {
    output.heading(`Chat with ${agent.name}`);
    output.text(output.dim('Type "exit" or Ctrl+C to quit'));
    output.hr();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const conversationId = flags.conversation;

    const prompt = () => {
      rl.question('\n> ', async (message) => {
        if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
          output.info('Goodbye!');
          rl.close();
          return;
        }

        if (!message.trim()) {
          prompt();
          return;
        }

        try {
          process.stdout.write('\n');
          const response = await this.sendChatMessage(agent.id, message, conversationId);

          if (response.content) {
            output.text(response.content);
          }

          if (response.toolCalls && response.toolCalls.length > 0) {
            output.newLine();
            output.text(output.dim('Tool calls:'));
            for (const call of response.toolCalls) {
              output.text(output.dim(`  • ${call.name}`));
            }
          }
        } catch (error) {
          output.error(error instanceof Error ? error.message : 'Failed to send message');
        }

        prompt();
      });
    };

    prompt();

    // Handle Ctrl+C
    rl.on('SIGINT', () => {
      output.newLine();
      output.info('Goodbye!');
      rl.close();
      process.exit(0);
    });
  }

  private async sendChatMessage(
    agentId: string,
    message: string,
    conversationId?: string
  ): Promise<{
    content: string;
    conversationId: string;
    toolCalls?: { name: string; result: unknown }[];
  }> {
    const apiKey = getApiKey();
    const apiUrl = getApiUrl();

    const url = `${apiUrl}/agents/${agentId}/chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({
        message,
        conversationId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json() as {
      content: string;
      conversationId: string;
      toolCalls?: { name: string; result: unknown }[];
    };
    return data;
  }
}
