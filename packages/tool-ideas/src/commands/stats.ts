import chalk from 'chalk';
import { Command } from 'commander';
import { desc, eq, sql } from 'drizzle-orm';
import { getDatabase } from '../db/client.js';
import { toolIdeas } from '../db/schema.js';
import { getEnrichmentStats } from '../enrichment/batch-processor.js';
import { getSkeletonStats } from '../generators/skeleton-generator.js';
import { getVocabularyStats } from '../generators/vocabulary.js';

export const statsCommand = new Command('stats')
  .description('Show statistics for all stages')
  .option('--db <path>', 'Database path', './data/tool-ideas.db')
  .option('--detailed', 'Show detailed breakdowns', false)
  .action(async (options) => {
    try {
      const db = getDatabase(options.db);

      console.log(chalk.bold('\n📊 Tool Ideas Statistics\n'));

      // Vocabulary stats
      const vocabStats = getVocabularyStats(options.db);
      console.log(chalk.bold.blue('Vocabulary'));
      console.log(chalk.dim('─'.repeat(50)));
      console.log(`  Categories:  ${chalk.cyan(vocabStats.categories.toString().padStart(6))}`);
      console.log(`  Verbs:       ${chalk.cyan(vocabStats.verbs.toString().padStart(6))}`);
      console.log(`  Objects:     ${chalk.cyan(vocabStats.objects.toString().padStart(6))}`);
      console.log(`  Contexts:    ${chalk.cyan(vocabStats.contexts.toString().padStart(6))}`);
      console.log(`  Qualifiers:  ${chalk.cyan(vocabStats.qualifiers.toString().padStart(6))}`);
      console.log(
        `  ${chalk.bold('Total:')}      ${chalk.bold(vocabStats.total.toString().padStart(7))}`
      );

      // Skeleton stats
      const skelStats = getSkeletonStats(options.db);
      console.log(chalk.bold.blue('\nSkeletons'));
      console.log(chalk.dim('─'.repeat(50)));
      console.log(`  Pending:     ${chalk.yellow(skelStats.pending.toString().padStart(6))}`);
      console.log(`  Completed:   ${chalk.green(skelStats.completed.toString().padStart(6))}`);
      console.log(`  Failed:      ${chalk.red(skelStats.failed.toString().padStart(6))}`);
      console.log(
        `  ${chalk.bold('Total:')}      ${chalk.bold(skelStats.total.toString().padStart(7))}`
      );

      // Enrichment stats
      const enrichStats = getEnrichmentStats(options.db);
      console.log(chalk.bold.blue('\nEnriched Tools'));
      console.log(chalk.dim('─'.repeat(50)));
      console.log(`  Quality:     ${chalk.green(enrichStats.quality.toString().padStart(6))}`);
      console.log(`  Nonsensical: ${chalk.yellow(enrichStats.nonsensical.toString().padStart(6))}`);
      console.log(
        `  ${chalk.bold('Total:')}      ${chalk.bold(enrichStats.totalIdeas.toString().padStart(7))}`
      );
      console.log(
        `  Avg Score:   ${chalk.cyan(enrichStats.avgQualityScore.toFixed(2).padStart(6))}`
      );
      console.log(
        `  Total Cost:  ${chalk.green(`$${enrichStats.totalCost.toFixed(2)}`.padStart(6))}`
      );

      // Progress bar
      const progress =
        skelStats.total > 0 ? Math.round((skelStats.completed / skelStats.total) * 100) : 0;
      const filled = Math.round(progress / 2);
      const bar = '█'.repeat(filled) + '░'.repeat(50 - filled);
      console.log(chalk.bold.blue('\nProgress'));
      console.log(chalk.dim('─'.repeat(50)));
      console.log(`  [${bar}] ${progress}%`);

      // Detailed breakdowns
      if (options.detailed) {
        console.log(chalk.bold.blue('\nQuality Distribution'));
        console.log(chalk.dim('─'.repeat(50)));

        const qualityDist = db
          .select({
            bucket: sql<string>`
            CASE
              WHEN quality_score >= 0.9 THEN '0.9-1.0'
              WHEN quality_score >= 0.8 THEN '0.8-0.9'
              WHEN quality_score >= 0.7 THEN '0.7-0.8'
              WHEN quality_score >= 0.6 THEN '0.6-0.7'
              WHEN quality_score >= 0.5 THEN '0.5-0.6'
              ELSE '< 0.5'
            END
          `,
            count: sql<number>`count(*)`,
          })
          .from(toolIdeas)
          .where(eq(toolIdeas.isNonsensical, false))
          .groupBy(sql`1`)
          .orderBy(desc(sql`1`))
          .all();

        for (const row of qualityDist) {
          const barLen = Math.round((row.count / enrichStats.quality) * 30);
          const bar = '█'.repeat(barLen);
          console.log(`  ${row.bucket}: ${bar} ${row.count}`);
        }

        // Top categories
        console.log(chalk.bold.blue('\nTop Categories'));
        console.log(chalk.dim('─'.repeat(50)));

        const topCats = db
          .select({
            name: sql<string>`substr(name, 1, instr(name, '.') - 1)`,
            count: sql<number>`count(*)`,
          })
          .from(toolIdeas)
          .where(eq(toolIdeas.isNonsensical, false))
          .groupBy(sql`1`)
          .orderBy(desc(sql`2`))
          .limit(10)
          .all();

        for (const row of topCats) {
          console.log(`  ${row.name.padEnd(20)} ${row.count}`);
        }
      }

      console.log('');
    } catch (error) {
      console.error(chalk.red('Failed to get stats:'), error);
      process.exit(1);
    }
  });
