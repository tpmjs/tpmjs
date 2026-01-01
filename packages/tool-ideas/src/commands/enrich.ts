import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { BatchProcessor, getEnrichmentStats } from '../enrichment/batch-processor.js';
import { getSkeletonStats } from '../generators/skeleton-generator.js';

export const enrichCommand = new Command('enrich')
  .description('Enrich tool skeletons with GPT-4.1-mini')
  .option('--db <path>', 'Database path', './data/tool-ideas.db')
  .option('--batch <n>', 'Batch size', '100')
  .option('--concurrency <n>', 'Concurrent API calls', '5')
  .option('--cost-limit <n>', 'Max cost in USD', '50')
  .option('--continuous', 'Process all pending skeletons', false)
  .option('--model <name>', 'OpenAI model to use', 'gpt-4.1-mini')
  .action(async (options) => {
    const spinner = ora('Starting enrichment...').start();

    try {
      // Check pending count
      const stats = getSkeletonStats(options.db);
      if (stats.pending === 0) {
        spinner.info(chalk.yellow('No pending skeletons to process'));
        return;
      }

      spinner.text = `Found ${stats.pending} pending skeletons`;

      const processor = new BatchProcessor({
        dbPath: options.db,
        batchSize: Number.parseInt(options.batch),
        concurrency: Number.parseInt(options.concurrency),
        costLimitUsd: Number.parseFloat(options.costLimit),
        model: options.model,
        onProgress: (processed, total, cost) => {
          const pct = Math.round((processed / total) * 100);
          spinner.text = `Enriching: ${processed}/${total} (${pct}%) | Cost: $${cost.toFixed(4)}`;
        },
        onError: (error, skeletonId) => {
          console.log(chalk.red(`\n  Error processing skeleton ${skeletonId}: ${error.message}`));
        },
      });

      if (options.continuous) {
        // Process all
        spinner.text = 'Processing all pending skeletons...';
        const result = await processor.processAll();

        spinner.succeed(chalk.green('Enrichment complete!'));
        console.log(chalk.dim('─'.repeat(50)));
        console.log(`  Processed:    ${chalk.cyan(result.totalProcessed)}`);
        console.log(`  Failed:       ${chalk.red(result.totalFailed)}`);
        console.log(`  Nonsensical:  ${chalk.yellow(result.totalNonsensical)}`);
        console.log(`  Total cost:   ${chalk.green(`$${result.totalCost.toFixed(4)}`)}`);
      } else {
        // Process single batch
        const result = await processor.processNextBatch();

        if (result.success) {
          spinner.succeed(chalk.green('Batch processed!'));
          console.log(chalk.dim('─'.repeat(50)));
          console.log(`  Processed:    ${chalk.cyan(result.processed)}`);
          console.log(`  Failed:       ${chalk.red(result.failed)}`);
          console.log(`  Nonsensical:  ${chalk.yellow(result.nonsensical)}`);
          console.log(`  Batch cost:   ${chalk.green(`$${result.cost.toFixed(4)}`)}`);
          console.log(chalk.dim('\n  Run with --continuous to process all pending'));
        } else {
          spinner.warn(chalk.yellow(result.message));
        }
      }

      // Show enrichment stats
      const enrichStats = getEnrichmentStats(options.db);
      console.log(chalk.dim('─'.repeat(50)));
      console.log(chalk.bold('Enrichment Stats:'));
      console.log(`  Total ideas:      ${chalk.cyan(enrichStats.totalIdeas)}`);
      console.log(`  Quality ideas:    ${chalk.green(enrichStats.quality)}`);
      console.log(`  Nonsensical:      ${chalk.yellow(enrichStats.nonsensical)}`);
      console.log(`  Avg quality:      ${chalk.cyan(enrichStats.avgQualityScore.toFixed(2))}`);
      console.log(`  Total cost:       ${chalk.green(`$${enrichStats.totalCost.toFixed(4)}`)}`);
    } catch (error) {
      spinner.fail(chalk.red('Enrichment failed'));
      console.error(error);
      process.exit(1);
    }
  });
