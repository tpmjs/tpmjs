import { Args, Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class ScenarioInfo extends Command {
  static description = 'Show detailed information about a scenario';

  static examples = [
    '<%= config.bin %> <%= command.id %> clu123abc456',
    '<%= config.bin %> <%= command.id %> clu123abc456 --runs 20',
    '<%= config.bin %> <%= command.id %> clu123abc456 --json',
  ];

  static args = {
    scenarioId: Args.string({
      description: 'Scenario ID',
      required: true,
    }),
  };

  static flags = {
    runs: Flags.integer({
      char: 'r',
      description: 'Number of recent runs to show',
      default: 10,
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

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ScenarioInfo);
    const output = createOutput(flags);
    const client = getClient();

    const spinner = output.spinner('Fetching scenario...');

    try {
      const response = await client.getScenario(args.scenarioId);
      const scenario = (
        response as unknown as {
          data: {
            id: string;
            name: string | null;
            prompt: string;
            description: string | null;
            tags: string[];
            qualityScore: number;
            consecutivePasses: number;
            consecutiveFails: number;
            totalRuns: number;
            lastRunAt: string | null;
            lastRunStatus: string | null;
            createdAt: string;
            updatedAt: string;
            collection?: {
              id: string;
              name: string;
              slug: string | null;
              username: string | null;
            };
            recentRuns?: Array<{
              id: string;
              status: string;
              evaluatorVerdict: string | null;
              executionTimeMs: number | null;
              createdAt: string;
            }>;
            runCount?: number;
          };
        }
      ).data;

      spinner.stop();

      if (flags.json) {
        output.json(scenario);
        return;
      }

      // Header
      output.text(output.bold(scenario.name || 'Unnamed Scenario'));
      output.text(output.dim(`ID: ${scenario.id}`));
      output.newLine();

      // Collection info
      if (scenario.collection) {
        output.text(output.bold('Collection'));
        output.text(`  Name:     ${scenario.collection.name}`);
        if (scenario.collection.slug) {
          output.text(`  Slug:     ${scenario.collection.slug}`);
        }
        if (scenario.collection.username) {
          output.text(`  Owner:    @${scenario.collection.username}`);
        }
        output.newLine();
      }

      // Prompt
      output.text(output.bold('Prompt'));
      if (flags.verbose || scenario.prompt.length <= 200) {
        output.text(`  ${scenario.prompt}`);
      } else {
        output.text(`  ${scenario.prompt.slice(0, 200)}...`);
        output.text(output.dim('  (use --verbose to see full prompt)'));
      }
      output.newLine();

      // Tags
      if (scenario.tags && scenario.tags.length > 0) {
        output.text(output.bold('Tags'));
        output.text(`  ${scenario.tags.join(', ')}`);
        output.newLine();
      }

      // Metrics
      output.text(output.bold('Metrics'));
      output.text(`  Quality Score:       ${(scenario.qualityScore * 100).toFixed(1)}%`);
      output.text(`  Total Runs:          ${scenario.totalRuns}`);
      output.text(`  Consecutive Passes:  ${scenario.consecutivePasses}`);
      output.text(`  Consecutive Fails:   ${scenario.consecutiveFails}`);
      if (scenario.lastRunStatus) {
        const statusColor =
          scenario.lastRunStatus === 'pass'
            ? output.green
            : scenario.lastRunStatus === 'fail'
              ? output.red
              : output.yellow;
        output.text(`  Last Run Status:     ${statusColor(scenario.lastRunStatus)}`);
      }
      if (scenario.lastRunAt) {
        output.text(`  Last Run:            ${new Date(scenario.lastRunAt).toLocaleString()}`);
      }
      output.newLine();

      // Timestamps
      output.text(output.bold('Timestamps'));
      output.text(`  Created:  ${new Date(scenario.createdAt).toLocaleString()}`);
      output.text(`  Updated:  ${new Date(scenario.updatedAt).toLocaleString()}`);
      output.newLine();

      // Recent runs
      if (scenario.recentRuns && scenario.recentRuns.length > 0) {
        output.text(
          output.bold(
            `Recent Runs (${scenario.recentRuns.length} of ${scenario.runCount ?? scenario.totalRuns})`
          )
        );
        output.table(
          scenario.recentRuns.map((run) => ({
            status:
              run.status === 'pass'
                ? output.green('pass')
                : run.status === 'fail'
                  ? output.red('fail')
                  : output.yellow(run.status),
            verdict: run.evaluatorVerdict || '-',
            time: run.executionTimeMs ? `${run.executionTimeMs}ms` : '-',
            date: new Date(run.createdAt).toLocaleString(),
          })),
          [
            { key: 'status', header: 'Status', width: 10 },
            { key: 'verdict', header: 'Verdict', width: 10 },
            { key: 'time', header: 'Time', width: 12 },
            { key: 'date', header: 'Date', width: 25 },
          ]
        );
      } else {
        output.text(output.dim('No runs yet'));
      }

      output.newLine();
      output.text(output.dim('Run this scenario with:'));
      output.text(output.dim(`  tpm scenario test ${scenario.id}`));
    } catch (error) {
      spinner.fail('Failed to fetch scenario');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
