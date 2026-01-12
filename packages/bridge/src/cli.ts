import type { MCPServerConfig } from '@tpmjs/mcp-client';
import { Command } from 'commander';
import pc from 'picocolors';
import { Bridge } from './bridge.js';
import {
  createDefaultConfig,
  deleteCredentials,
  ensureConfigDir,
  getConfigPath,
  loadConfig,
  loadCredentials,
  saveConfig,
  saveCredentials,
} from './config.js';

const program = new Command();

program.name('tpmjs-bridge').description('Bridge local MCP servers to TPMJS').version('0.1.0');

// Init command
program
  .command('init')
  .description('Initialize bridge configuration')
  .action(() => {
    ensureConfigDir();
    const config = loadConfig();

    if (config.servers.length === 0) {
      createDefaultConfig();
      console.log(`${pc.green('✓')} Created config file: ${getConfigPath()}`);
      console.log('\nEdit the config file to add your MCP servers, then run:');
      console.log(`  ${pc.cyan('tpmjs-bridge login')}`);
      console.log(`  ${pc.cyan('tpmjs-bridge start')}`);
    } else {
      console.log(`Config file already exists: ${getConfigPath()}`);
    }
  });

// Login command
program
  .command('login')
  .description('Authenticate with TPMJS')
  .option('--api-key <key>', 'API key (or set TPMJS_API_KEY env var)')
  .action((options) => {
    const apiKey = options.apiKey || process.env.TPMJS_API_KEY;

    if (!apiKey) {
      console.log(`${pc.red('✗')} No API key provided`);
      console.log('\nProvide an API key via:');
      console.log(`  ${pc.cyan('tpmjs-bridge login --api-key <key>')}`);
      console.log(`  ${pc.cyan('TPMJS_API_KEY=<key> tpmjs-bridge login')}`);
      console.log('\nGet your API key at: https://tpmjs.com/dashboard/settings/api-keys');
      process.exit(1);
    }

    saveCredentials({ apiKey });
    console.log(`${pc.green('✓')} API key saved`);
  });

// Logout command
program
  .command('logout')
  .description('Remove saved credentials')
  .action(() => {
    deleteCredentials();
    console.log(`${pc.green('✓')} Credentials removed`);
  });

// Add command
program
  .command('add <name>')
  .description('Add an MCP server to the config')
  .option('--command <cmd>', 'Command to run', 'npx')
  .option('--args <args>', 'Arguments (comma-separated)', '')
  .action((name, options) => {
    const config = loadConfig();

    // Check if already exists
    if (config.servers.some((s) => s.id === name)) {
      console.log(`${pc.yellow('!')} Server "${name}" already exists`);
      return;
    }

    const server: MCPServerConfig = {
      id: name,
      name: name,
      transport: 'stdio',
      command: options.command,
      args: options.args ? options.args.split(',') : [],
    };

    config.servers.push(server);
    saveConfig(config);
    console.log(`${pc.green('✓')} Added server: ${name}`);
  });

// Remove command
program
  .command('remove <name>')
  .description('Remove an MCP server from the config')
  .action((name) => {
    const config = loadConfig();
    const index = config.servers.findIndex((s) => s.id === name);

    if (index === -1) {
      console.log(`${pc.yellow('!')} Server "${name}" not found`);
      return;
    }

    config.servers.splice(index, 1);
    saveConfig(config);
    console.log(`${pc.green('✓')} Removed server: ${name}`);
  });

// List command
program
  .command('list')
  .description('List configured MCP servers')
  .action(() => {
    const config = loadConfig();

    if (config.servers.length === 0) {
      console.log('No servers configured');
      console.log(`\nRun ${pc.cyan('tpmjs-bridge init')} to create a config file`);
      return;
    }

    console.log('Configured MCP servers:\n');
    for (const server of config.servers) {
      console.log(`  ${pc.cyan(server.id)}`);
      console.log(`    Name: ${server.name}`);
      console.log(`    Command: ${server.command} ${(server.args || []).join(' ')}`);
      console.log();
    }
  });

// Config command
program
  .command('config')
  .description('Show config file path')
  .action(() => {
    console.log(`Config file: ${getConfigPath()}`);
  });

// Start command
program
  .command('start')
  .description('Start the bridge')
  .option('-v, --verbose', 'Verbose output')
  .option('--url <url>', 'Custom WebSocket URL')
  .action(async (options) => {
    const config = loadConfig();
    const credentials = loadCredentials();

    // Check for API key
    const apiKey = credentials?.apiKey || process.env.TPMJS_API_KEY;
    if (!apiKey) {
      console.log(`${pc.red('✗')} Not authenticated`);
      console.log(`\nRun ${pc.cyan('tpmjs-bridge login')} first`);
      process.exit(1);
    }

    // Check for servers
    if (config.servers.length === 0) {
      console.log(`${pc.yellow('!')} No MCP servers configured`);
      console.log(`\nEdit ${getConfigPath()} to add servers`);
      process.exit(1);
    }

    // Filter out example servers
    const servers = config.servers.filter((s) => s.id !== 'example');
    if (servers.length === 0) {
      console.log(`${pc.yellow('!')} Only example server configured`);
      console.log(`\nEdit ${getConfigPath()} to add real servers`);
      process.exit(1);
    }

    const bridge = new Bridge({
      apiKey,
      servers,
      verbose: options.verbose,
      apiUrl: options.url,
    });

    // Handle shutdown
    const shutdown = async () => {
      await bridge.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    try {
      await bridge.start();
      console.log(`\n${pc.green('Bridge running.')} Press Ctrl+C to stop.\n`);
    } catch (error) {
      console.log(`${pc.red('✗')} Failed to start bridge: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show bridge status')
  .action(() => {
    const config = loadConfig();
    const credentials = loadCredentials();

    console.log('Bridge Status\n');

    // Auth status
    if (credentials?.apiKey) {
      console.log(`  Auth: ${pc.green('✓')} Logged in`);
    } else {
      console.log(`  Auth: ${pc.red('✗')} Not logged in`);
    }

    // Config status
    console.log(`  Config: ${getConfigPath()}`);
    console.log(`  Servers: ${config.servers.length}`);

    if (config.servers.length > 0) {
      console.log('\n  Configured servers:');
      for (const server of config.servers) {
        console.log(`    - ${server.name} (${server.id})`);
      }
    }
  });

program.parse();
