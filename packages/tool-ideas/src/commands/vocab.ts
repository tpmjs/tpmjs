import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { getDatabase } from '../db/client.js';
import { seedCompatibilityRules } from '../generators/compatibility.js';
import { getVocabularyStats, seedVocabulary } from '../generators/vocabulary.js';

export const vocabCommand = new Command('vocab').description(
  'Manage vocabulary (categories, verbs, objects, contexts)'
);

vocabCommand
  .command('generate')
  .description('Generate vocabulary using AI (GPT-4.1-mini)')
  .option('--db <path>', 'Database path', './data/tool-ideas.db')
  .option('--categories <n>', 'Number of categories', '40')
  .option('--verbs <n>', 'Number of verbs', '60')
  .option('--objects <n>', 'Number of objects', '250')
  .option('--contexts <n>', 'Number of contexts', '50')
  .option('--qualifiers <n>', 'Number of qualifiers', '30')
  .action(async (options) => {
    const spinner = ora('Generating vocabulary with AI...').start();

    try {
      // Ensure database is initialized
      getDatabase(options.db);

      const counts = {
        categories: Number.parseInt(options.categories),
        verbs: Number.parseInt(options.verbs),
        objects: Number.parseInt(options.objects),
        contexts: Number.parseInt(options.contexts),
        qualifiers: Number.parseInt(options.qualifiers),
      };

      spinner.text = `Generating ${counts.categories} categories...`;
      const result = await seedVocabulary({
        dbPath: options.db,
        counts,
        onProgress: (type, current, total) => {
          spinner.text = `Generating ${type}: ${current}/${total}`;
        },
      });

      spinner.succeed(chalk.green('Vocabulary generated successfully!'));
      console.log(chalk.dim('Results:'));
      console.log(`  Categories: ${result.categories}`);
      console.log(`  Verbs: ${result.verbs}`);
      console.log(`  Objects: ${result.objects}`);
      console.log(`  Contexts: ${result.contexts}`);
      console.log(`  Qualifiers: ${result.qualifiers}`);
      console.log(chalk.dim(`  Total cost: $${result.totalCost.toFixed(4)}`));

      // Generate compatibility rules
      spinner.start('Generating compatibility rules...');
      const compatResult = await seedCompatibilityRules({ dbPath: options.db });
      spinner.succeed(chalk.green('Compatibility rules generated!'));
      console.log(`  Verb-object rules: ${compatResult.verbObjectRules}`);
      console.log(`  Category-verb rules: ${compatResult.categoryVerbRules}`);
    } catch (error) {
      spinner.fail(chalk.red('Failed to generate vocabulary'));
      console.error(error);
      process.exit(1);
    }
  });

vocabCommand
  .command('stats')
  .description('Show vocabulary statistics')
  .option('--db <path>', 'Database path', './data/tool-ideas.db')
  .action(async (options) => {
    try {
      const stats = getVocabularyStats(options.db);

      console.log(chalk.bold('\nVocabulary Statistics'));
      console.log(chalk.dim('─'.repeat(40)));
      console.log(`  Categories:  ${chalk.cyan(stats.categories)}`);
      console.log(`  Verbs:       ${chalk.cyan(stats.verbs)}`);
      console.log(`  Objects:     ${chalk.cyan(stats.objects)}`);
      console.log(`  Contexts:    ${chalk.cyan(stats.contexts)}`);
      console.log(`  Qualifiers:  ${chalk.cyan(stats.qualifiers)}`);
      console.log(chalk.dim('─'.repeat(40)));
      console.log(`  Total:       ${chalk.bold(stats.total)}`);
    } catch (error) {
      console.error(chalk.red('Failed to get stats:'), error);
      process.exit(1);
    }
  });
