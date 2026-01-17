import { Args, Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class ScenarioTest extends Command {
  static description = 'Run a single scenario by ID';

  static examples = [
    '<%= config.bin %> <%= command.id %> clu123abc456',
    '<%= config.bin %> <%= command.id %> clu123abc456 --json',
    '<%= config.bin %> <%= command.id %> clu123abc456 --verbose',
  ];

  static args = {
    scenarioId: Args.string({
      description: 'Scenario ID to run',
      required: true,
    }),
  };

  static flags = {
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show verbose output including full reason',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ScenarioTest);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    // Fetch scenario info first
    const infoSpinner = output.spinner('Fetching scenario...');
    let scenarioName: string;

    try {
      const scenarioResponse = await client.getScenario(args.scenarioId);
      const scenario = (
        scenarioResponse as unknown as {
          data: {
            name: string | null;
            prompt: string;
            collection?: { name: string };
          };
        }
      ).data;

      scenarioName = scenario.name || scenario.prompt.slice(0, 50) + '...';
      infoSpinner.stop();

      output.text(output.bold(`Scenario: ${scenarioName}`));
      if (scenario.collection) {
        output.text(output.dim(`Collection: ${scenario.collection.name}`));
      }
      output.newLine();
    } catch (error) {
      infoSpinner.fail('Scenario not found');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
      return;
    }

    // Run the scenario
    const runSpinner = output.spinner('Executing scenario...');

    try {
      const result = await client.runScenario(args.scenarioId);
      const runData = (
        result as unknown as {
          data: {
            runId: string;
            status: string;
            success: boolean;
            evaluator: {
              model: string | null;
              verdict: string | null;
              reason: string | null;
            };
            usage: {
              inputTokens: number | null;
              outputTokens: number | null;
              totalTokens: number | null;
              executionTimeMs: number | null;
            };
            timestamps: {
              startedAt: string | null;
              completedAt: string | null;
              createdAt: string;
            };
            quotaRemaining: number;
          };
        }
      ).data;

      if (runData.success) {
        runSpinner.succeed(output.green('Scenario PASSED'));
      } else if (runData.status === 'error') {
        runSpinner.fail(output.red('Scenario ERROR'));
      } else {
        runSpinner.fail(output.red('Scenario FAILED'));
      }

      output.newLine();

      if (flags.json) {
        output.json(runData);
        return;
      }

      // Display results
      output.text(output.bold('Results'));
      output.text(`  Status:    ${runData.status}`);
      output.text(`  Verdict:   ${runData.evaluator?.verdict || 'N/A'}`);

      if (runData.evaluator?.reason) {
        if (flags.verbose) {
          output.text(`  Reason:    ${runData.evaluator.reason}`);
        } else {
          const truncatedReason =
            runData.evaluator.reason.length > 80
              ? runData.evaluator.reason.slice(0, 80) + '...'
              : runData.evaluator.reason;
          output.text(`  Reason:    ${truncatedReason}`);
        }
      }

      output.newLine();
      output.text(output.bold('Usage'));
      if (runData.usage.executionTimeMs) {
        output.text(`  Duration:  ${runData.usage.executionTimeMs}ms`);
      }
      if (runData.usage.totalTokens) {
        output.text(
          `  Tokens:    ${runData.usage.totalTokens} (in: ${runData.usage.inputTokens}, out: ${runData.usage.outputTokens})`
        );
      }

      output.newLine();
      output.text(output.dim(`Run ID: ${runData.runId}`));
      output.text(output.dim(`Quota remaining: ${runData.quotaRemaining} runs/day`));

      // Exit with error code if failed
      if (!runData.success) {
        this.exit(1);
      }
    } catch (error) {
      runSpinner.fail('Failed to run scenario');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
      this.exit(1);
    }
  }
}
