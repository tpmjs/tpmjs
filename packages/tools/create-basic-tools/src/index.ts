#!/usr/bin/env node

import { Command } from 'commander';
import { runInteractiveCLI } from './cli.js';

const program = new Command();

program
  .name('create-basic-tools')
  .description('CLI generator for scaffolding production-ready TPMJS tool packages')
  .version('0.0.1')
  .option('--name <name>', 'Package name (e.g., @myorg/content-tools)')
  .option('--description <description>', 'Package description')
  .option('--category <category>', 'Tool category')
  .option('--tool <tool...>', 'Tool definition (format: "exportName:description")')
  .option('--output <path>', 'Output path')
  .option('--yes', 'Skip confirmation prompt')
  .action(async (options) => {
    // For now, only support interactive mode
    // CLI flags mode can be added later
    if (options.name || options.description || options.category || options.tool) {
      console.log('CLI flags mode is not yet implemented.');
      console.log('Please run without flags for interactive mode.');
      process.exit(1);
    }

    await runInteractiveCLI();
  });

program.parse();
