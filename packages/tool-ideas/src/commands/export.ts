import { writeFileSync } from 'node:fs';
import chalk from 'chalk';
import { Command } from 'commander';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import ora from 'ora';
import { getDatabase } from '../db/client.js';
import { categories, contexts, objects, toolIdeas, toolSkeletons, verbs } from '../db/schema.js';

interface ExportedTool {
  name: string;
  description: string;
  category: string;
  parameters: unknown[];
  returns: { type: string; description: string };
  aiAgent: { useCase: string; limitations?: string; examples?: string[] };
  tags: string[];
  examples: { input: Record<string, unknown>; description: string }[];
  qualityScore: number;
  skeleton: {
    verb: string;
    object: string;
    context: string | null;
  };
}

export const exportCommand = new Command('export')
  .description('Export enriched tools to JSON')
  .option('--db <path>', 'Database path', './data/tool-ideas.db')
  .option('--output <path>', 'Output file path', './data/tools-export.json')
  .option('--min-quality <n>', 'Minimum quality score', '0.5')
  .option('--exclude-nonsensical', 'Exclude nonsensical tools', false)
  .option('--limit <n>', 'Maximum tools to export', '0')
  .option('--format <type>', 'Export format: json, jsonl, prisma', 'json')
  .action(async (options) => {
    const spinner = ora('Exporting tools...').start();

    try {
      const db = getDatabase(options.db);
      const minQuality = Number.parseFloat(options.minQuality);
      const limit = Number.parseInt(options.limit);

      // Build query conditions
      const conditions = [gte(toolIdeas.qualityScore, minQuality)];
      if (options.excludeNonsensical) {
        conditions.push(eq(toolIdeas.isNonsensical, false));
      }

      // Query tools with skeleton relations
      let query = db
        .select()
        .from(toolIdeas)
        .where(and(...conditions))
        .orderBy(desc(toolIdeas.qualityScore));

      if (limit > 0) {
        query = query.limit(limit);
      }

      const tools = query.all();

      spinner.text = `Found ${tools.length} tools to export`;

      // Load skeleton data for context
      const skeletonIds = [...new Set(tools.map((t) => t.skeletonId))];
      const skeletons = db
        .select()
        .from(toolSkeletons)
        .where(inArray(toolSkeletons.id, skeletonIds))
        .all();
      const skeletonMap = new Map(skeletons.map((s) => [s.id, s]));

      // Load related vocabulary
      const verbIds = [...new Set(skeletons.map((s) => s.verbId))];
      const objectIds = [...new Set(skeletons.map((s) => s.objectId))];
      const contextIds = [
        ...new Set(skeletons.map((s) => s.contextId).filter(Boolean)),
      ] as number[];

      const verbMap = new Map(
        db
          .select()
          .from(verbs)
          .where(inArray(verbs.id, verbIds))
          .all()
          .map((v) => [v.id, v])
      );
      const objectMap = new Map(
        db
          .select()
          .from(objects)
          .where(inArray(objects.id, objectIds))
          .all()
          .map((o) => [o.id, o])
      );
      const contextMap =
        contextIds.length > 0
          ? new Map(
              db
                .select()
                .from(contexts)
                .where(inArray(contexts.id, contextIds))
                .all()
                .map((c) => [c.id, c])
            )
          : new Map();

      // Transform to export format
      const exported: ExportedTool[] = tools
        .map((tool) => {
          const skeleton = skeletonMap.get(tool.skeletonId);
          if (!skeleton) return null;
          const verb = verbMap.get(skeleton.verbId);
          const object = objectMap.get(skeleton.objectId);
          if (!verb || !object) return null;
          const context = skeleton.contextId ? contextMap.get(skeleton.contextId) : null;

          // Parse category from name (e.g., "data.parseCSV" -> "data")
          const category = tool.name.split('.')[0];

          return {
            name: tool.name,
            description: tool.description,
            category,
            parameters: JSON.parse(tool.parametersJson),
            returns: JSON.parse(tool.returnsJson),
            aiAgent: JSON.parse(tool.aiAgentJson),
            tags: JSON.parse(tool.tagsJson),
            examples: JSON.parse(tool.examplesJson),
            qualityScore: tool.qualityScore,
            skeleton: {
              verb: verb.name,
              object: object.name,
              context: context?.name ?? null,
            },
          };
        })
        .filter((t): t is ExportedTool => t !== null);

      // Write output based on format
      let output: string;
      let outputPath = options.output;

      switch (options.format) {
        case 'jsonl':
          output = exported.map((t) => JSON.stringify(t)).join('\n');
          if (!outputPath.endsWith('.jsonl')) {
            outputPath = outputPath.replace(/\.json$/, '.jsonl');
          }
          break;

        case 'prisma': {
          // Export in format ready for Prisma seed
          const prismaData = exported.map((t) => ({
            name: t.name,
            slug: t.name.replace('.', '-').toLowerCase(),
            description: t.description,
            category: t.category,
            isOfficial: false,
            tier: 'rich',
            toolSpec: {
              name: t.name,
              description: t.description,
              parameters: t.parameters,
              returns: t.returns,
              aiAgent: t.aiAgent,
              tags: t.tags,
              examples: t.examples,
            },
            qualityScore: t.qualityScore,
          }));
          output = JSON.stringify(prismaData, null, 2);
          if (!outputPath.includes('prisma')) {
            outputPath = outputPath.replace(/\.json$/, '-prisma.json');
          }
          break;
        }
        default:
          output = JSON.stringify(
            {
              metadata: {
                exportedAt: new Date().toISOString(),
                count: exported.length,
                minQuality,
                excludeNonsensical: options.excludeNonsensical,
              },
              tools: exported,
            },
            null,
            2
          );
      }

      writeFileSync(outputPath, output);

      spinner.succeed(chalk.green(`Exported ${exported.length} tools to ${outputPath}`));

      // Show summary
      console.log(chalk.dim('─'.repeat(50)));
      console.log(`  Format:       ${chalk.cyan(options.format)}`);
      console.log(`  Min quality:  ${chalk.cyan(minQuality)}`);
      console.log(
        `  Nonsensical:  ${chalk.cyan(options.excludeNonsensical ? 'excluded' : 'included')}`
      );
      console.log(`  File size:    ${chalk.cyan(formatBytes(Buffer.byteLength(output)))}`);

      // Quality distribution
      const qualityDist = {
        excellent: exported.filter((t) => t.qualityScore >= 0.9).length,
        good: exported.filter((t) => t.qualityScore >= 0.7 && t.qualityScore < 0.9).length,
        fair: exported.filter((t) => t.qualityScore >= 0.5 && t.qualityScore < 0.7).length,
        poor: exported.filter((t) => t.qualityScore < 0.5).length,
      };

      console.log(chalk.dim('─'.repeat(50)));
      console.log(chalk.bold('Quality Distribution:'));
      console.log(`  Excellent (≥0.9): ${chalk.green(qualityDist.excellent)}`);
      console.log(`  Good (0.7-0.9):   ${chalk.cyan(qualityDist.good)}`);
      console.log(`  Fair (0.5-0.7):   ${chalk.yellow(qualityDist.fair)}`);
      console.log(`  Poor (<0.5):      ${chalk.red(qualityDist.poor)}`);
    } catch (error) {
      spinner.fail(chalk.red('Export failed'));
      console.error(error);
      process.exit(1);
    }
  });

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
