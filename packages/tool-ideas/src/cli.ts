import { Command } from 'commander';
import { enrichCommand } from './commands/enrich.js';
import { exportCommand } from './commands/export.js';
import { generateCommand } from './commands/generate.js';
import { statsCommand } from './commands/stats.js';
import { vocabCommand } from './commands/vocab.js';

const program = new Command();

program
  .name('tool-ideas')
  .description('Generate and enrich AI tool ideas for TPMJS')
  .version('0.1.0');

program.addCommand(vocabCommand);
program.addCommand(generateCommand);
program.addCommand(enrichCommand);
program.addCommand(statsCommand);
program.addCommand(exportCommand);

program.parse();
