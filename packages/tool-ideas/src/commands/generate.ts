import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { generateSkeletons, getSkeletonStats } from '../generators/skeleton-generator.js';

export const generateCommand = new Command('generate')
  .description('Generate tool skeletons from vocabulary')
  .option('--db <path>', 'Database path', './data/tool-ideas.db')
  .option('--count <n>', 'Number of skeletons to generate', '10000')
  .option('--threshold <n>', 'Minimum compatibility score', '0.5')
  .option('--seed <n>', 'Random seed for reproducibility', '42')
  .option('--contexts', 'Include context variations', false)
  .action(async (options) => {
    const spinner = ora('Generating tool skeletons...').start();

    try {
      const count = Number.parseInt(options.count);
      const threshold = Number.parseFloat(options.threshold);
      const seed = Number.parseInt(options.seed);

      spinner.text = `Generating up to ${count} skeletons (threshold: ${threshold})...`;

      const result = await generateSkeletons({
        dbPath: options.db,
        count,
        threshold,
        seed,
        includeContexts: options.contexts,
        onProgress: (current, total) => {
          const pct = Math.round((current / total) * 100);
          spinner.text = `Generating skeletons: ${current}/${total} (${pct}%)`;
        },
      });

      spinner.succeed(chalk.green('Skeleton generation complete!'));
      console.log(chalk.dim('─'.repeat(40)));
      console.log(`  Generated: ${chalk.cyan(result.generated)}`);
      console.log(`  Skipped:   ${chalk.yellow(result.skipped)} (duplicates)`);

      // Show overall stats
      const stats = getSkeletonStats(options.db);
      console.log(chalk.dim('─'.repeat(40)));
      console.log(chalk.bold('Total Skeletons:'));
      console.log(`  Total:     ${chalk.cyan(stats.total)}`);
      console.log(`  Pending:   ${chalk.yellow(stats.pending)}`);
      console.log(`  Completed: ${chalk.green(stats.completed)}`);
      console.log(`  Failed:    ${chalk.red(stats.failed)}`);
    } catch (error) {
      spinner.fail(chalk.red('Failed to generate skeletons'));
      console.error(error);
      process.exit(1);
    }
  });
