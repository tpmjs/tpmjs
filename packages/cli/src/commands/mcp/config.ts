import { Args, Command, Flags } from '@oclif/core';
import * as fs from 'node:fs';
import { createOutput } from '../../lib/output.js';

type ClientType = 'claude' | 'cursor' | 'windsurf' | 'generic';

export default class McpConfig extends Command {
  static description = 'Generate MCP configuration for AI clients';

  static examples = [
    '<%= config.bin %> <%= command.id %> ajax/ajax-collection',
    '<%= config.bin %> <%= command.id %> ajax/ajax-collection --client cursor',
    '<%= config.bin %> <%= command.id %> ajax/ajax-collection --output ~/Library/Application\\ Support/Claude/claude_desktop_config.json',
  ];

  static flags = {
    client: Flags.string({
      char: 'c',
      description: 'Target client (claude, cursor, windsurf, generic)',
      default: 'claude',
      options: ['claude', 'cursor', 'windsurf', 'generic'],
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output file path (will merge with existing config)',
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
    'api-key': Flags.string({
      char: 'k',
      description: 'API key to include in config (optional)',
    }),
  };

  static args = {
    collection: Args.string({
      description: 'Collection path (username/slug)',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(McpConfig);
    const output = createOutput(flags);

    const [username, slug] = args.collection.split('/');
    if (!username || !slug) {
      output.error('Invalid collection path. Use format: username/collection-slug');
      return;
    }

    const mcpUrl = `https://tpmjs.com/api/mcp/${username}/${slug}/sse`;
    const clientType = flags.client as ClientType;

    // Generate config based on client type
    const config = generateConfig(clientType, mcpUrl, slug, flags['api-key']);

    if (flags.json) {
      output.json(config);
      return;
    }

    if (flags.output) {
      // Merge with existing config if file exists
      let existingConfig: Record<string, unknown> = {};
      if (fs.existsSync(flags.output)) {
        try {
          const content = fs.readFileSync(flags.output, 'utf-8');
          existingConfig = JSON.parse(content);
        } catch {
          output.warning(`Could not parse existing config at ${flags.output}, creating new file`);
        }
      }

      // Merge mcpServers
      const existingServers = typeof existingConfig.mcpServers === 'object' && existingConfig.mcpServers !== null
        ? existingConfig.mcpServers as Record<string, unknown>
        : {};
      const mergedConfig = {
        ...existingConfig,
        mcpServers: {
          ...existingServers,
          ...(config.mcpServers as Record<string, unknown>),
        },
      };

      fs.writeFileSync(flags.output, JSON.stringify(mergedConfig, null, 2));
      output.success(`Config written to ${flags.output}`);
      return;
    }

    // Output config to console
    output.heading(`MCP Config for ${clientType}`);
    output.text(output.dim(`Collection: ${args.collection}`));
    output.text(output.dim(`URL: ${mcpUrl}`));
    output.newLine();

    output.subheading('Add to your config file:');
    output.code(JSON.stringify(config, null, 2), 'json');

    output.newLine();
    output.text(output.dim(getConfigPath(clientType)));
  }
}

function generateConfig(
  _client: ClientType,
  mcpUrl: string,
  name: string,
  apiKey?: string
): Record<string, unknown> {
  const serverName = `tpmjs-${name}`;

  const baseConfig = {
    mcpServers: {
      [serverName]: {
        command: 'npx',
        args: ['-y', '@anthropic/mcp-remote', mcpUrl],
        ...(apiKey && {
          env: {
            TPMJS_API_KEY: apiKey,
          },
        }),
      },
    },
  };

  return baseConfig;
}

function getConfigPath(client: ClientType): string {
  switch (client) {
    case 'claude':
      return 'Config location: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)';
    case 'cursor':
      return 'Config location: ~/.cursor/mcp.json';
    case 'windsurf':
      return 'Config location: ~/.windsurf/mcp.json';
    default:
      return 'Consult your MCP client documentation for config location';
  }
}
