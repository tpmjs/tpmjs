import { Args, Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class ScenarioRun extends Command {
  static description = 'Run all scenarios for a collection';

  static examples = [
    '<%= config.bin %> <%= command.id %> my-collection',
    '<%= config.bin %> <%= command.id %> my-collection --json',
    '<%= config.bin %> <%= command.id %> my-collection --verbose',
  ];

  static args = {
    collection: Args.string({
      description: 'Collection ID or slug',
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
      description: 'Show verbose output',
      default: false,
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of scenarios to run',
      default: 50,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ScenarioRun);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    // Find collection
    const collectionsSpinner = output.spinner('Finding collection...');
    let collectionId: string;

    try {
      const collections = await client.listCollections({ limit: 100 });
      const collection = collections.data.find(
        (c) => c.id === args.collection || c.slug === args.collection
      );

      if (!collection) {
        collectionsSpinner.fail('Collection not found');
        output.error(`No collection found with ID or slug: ${args.collection}`);
        return;
      }

      collectionId = collection.id;
      collectionsSpinner.stop();
      output.text(output.bold(`Running scenarios for: ${collection.name}\n`));
    } catch (error) {
      collectionsSpinner.fail('Failed to find collection');
      output.error(error instanceof Error ? error.message : 'Unknown error');
      return;
    }

    // Fetch scenarios
    const scenariosSpinner = output.spinner('Fetching scenarios...');
    let scenarios: Array<{
      id: string;
      name: string | null;
      prompt: string;
    }>;

    try {
      const response = await client.listCollectionScenarios(collectionId, { limit: flags.limit });
      scenarios =
        (
          response as unknown as {
            data: {
              scenarios: Array<{
                id: string;
                name: string | null;
                prompt: string;
              }>;
            };
          }
        ).data?.scenarios || [];

      if (scenarios.length === 0) {
        scenariosSpinner.fail('No scenarios found');
        output.info('This collection has no scenarios. Generate some with:');
        output.text(`  tpm scenario generate ${args.collection}`);
        return;
      }

      scenariosSpinner.stop();
      output.info(`Found ${scenarios.length} scenario(s) to run\n`);
    } catch (error) {
      scenariosSpinner.fail('Failed to fetch scenarios');
      output.error(error instanceof Error ? error.message : 'Unknown error');
      return;
    }

    // Run each scenario
    const results: Array<{
      name: string;
      status: string;
      verdict: string | null;
      reason: string | null;
      timeMs: number | null;
    }> = [];
    let passed = 0;
    let failed = 0;
    let errors = 0;

    for (const scenario of scenarios) {
      const name = scenario.name || scenario.prompt.slice(0, 40) + '...';
      const runSpinner = output.spinner(`Running: ${name}`);

      try {
        const result = await client.runScenario(scenario.id);
        const runData = (
          result as unknown as {
            data: {
              status: string;
              success: boolean;
              evaluator: { verdict: string | null; reason: string | null };
              usage: { executionTimeMs: number | null };
            };
          }
        ).data;

        if (runData.success) {
          passed++;
          runSpinner.succeed(`${output.green('✓')} ${name}`);
        } else if (runData.status === 'error') {
          errors++;
          runSpinner.fail(`${output.red('✗')} ${name} (error)`);
        } else {
          failed++;
          runSpinner.fail(`${output.red('✗')} ${name}`);
        }

        if (flags.verbose && runData.evaluator?.reason) {
          output.text(output.dim(`  → ${runData.evaluator.reason}`));
        }

        results.push({
          name,
          status: runData.status,
          verdict: runData.evaluator?.verdict ?? null,
          reason: runData.evaluator?.reason ?? null,
          timeMs: runData.usage?.executionTimeMs ?? null,
        });
      } catch (error) {
        errors++;
        runSpinner.fail(`${output.red('✗')} ${name} (error)`);
        results.push({
          name,
          status: 'error',
          verdict: null,
          reason: error instanceof Error ? error.message : 'Unknown error',
          timeMs: null,
        });
      }
    }

    // Output summary
    output.newLine();
    output.text(output.bold('─'.repeat(50)));
    output.text(output.bold('Summary'));
    output.text(`  ${output.green('Passed:')} ${passed}`);
    output.text(`  ${output.red('Failed:')} ${failed}`);
    if (errors > 0) {
      output.text(`  ${output.yellow('Errors:')} ${errors}`);
    }
    output.text(`  ${output.dim('Total:')} ${scenarios.length}`);

    const passRate = scenarios.length > 0 ? (passed / scenarios.length) * 100 : 0;
    output.newLine();
    output.text(`Pass rate: ${passRate.toFixed(1)}%`);

    if (flags.json) {
      output.newLine();
      output.json({
        collection: args.collection,
        total: scenarios.length,
        passed,
        failed,
        errors,
        passRate: passRate.toFixed(1),
        results,
      });
    }

    // Exit with error code if any failures
    if (failed > 0 || errors > 0) {
      this.exit(1);
    }
  }
}
