import { Args, Command, Flags } from '@oclif/core';
import { getClient } from '../../lib/api-client.js';
import { createOutput } from '../../lib/output.js';

export default class ScenarioGenerate extends Command {
  static description = 'Generate AI-powered scenarios for a collection';

  static examples = [
    '<%= config.bin %> <%= command.id %> my-collection',
    '<%= config.bin %> <%= command.id %> my-collection --count 3',
    '<%= config.bin %> <%= command.id %> my-collection --skip-similarity-check',
  ];

  static args = {
    collection: Args.string({
      description: 'Collection ID or slug',
      required: true,
    }),
  };

  static flags = {
    count: Flags.integer({
      char: 'n',
      description: 'Number of scenarios to generate (1-10)',
      default: 1,
      min: 1,
      max: 10,
    }),
    'skip-similarity-check': Flags.boolean({
      description: 'Skip checking for similar existing scenarios',
      default: false,
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
    const { args, flags } = await this.parse(ScenarioGenerate);
    const output = createOutput(flags);
    const client = getClient();

    if (!client.isAuthenticated()) {
      output.error('Not authenticated. Run `tpm auth login` first.');
      return;
    }

    // Find collection
    const collectionsSpinner = output.spinner('Finding collection...');
    let collectionId: string;
    let collectionName: string;

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
      collectionName = collection.name;
      collectionsSpinner.stop();
    } catch (error) {
      collectionsSpinner.fail('Failed to find collection');
      output.error(error instanceof Error ? error.message : 'Unknown error');
      return;
    }

    // Generate scenarios
    const generateSpinner = output.spinner(
      `Generating ${flags.count} scenario${flags.count > 1 ? 's' : ''} for "${collectionName}"...`
    );

    try {
      const result = await client.generateScenarios(collectionId, {
        count: flags.count,
        skipSimilarityCheck: flags['skip-similarity-check'],
      });

      const scenarios =
        (
          result as unknown as {
            data: {
              scenarios: Array<{
                scenario: {
                  id: string;
                  name: string;
                  prompt: string;
                  tags: string[];
                };
                similarity?: {
                  hasSimilar: boolean;
                  maxSimilarity: number;
                  similar: Array<{ name: string; similarity: number }>;
                };
              }>;
            };
          }
        ).data?.scenarios || [];

      generateSpinner.succeed(
        `Generated ${scenarios.length} scenario${scenarios.length > 1 ? 's' : ''}`
      );

      if (flags.json) {
        output.json({ collection: collectionName, scenarios });
        return;
      }

      output.newLine();

      for (let i = 0; i < scenarios.length; i++) {
        const item = scenarios[i];
        if (!item) continue;
        const { scenario, similarity } = item;
        output.text(output.bold(`${i + 1}. ${scenario.name}`));
        output.text(`   ID: ${scenario.id}`);

        if (flags.verbose) {
          output.text(`   Prompt: ${scenario.prompt}`);
        } else {
          output.text(`   Prompt: ${scenario.prompt.slice(0, 80)}...`);
        }

        if (scenario.tags.length > 0) {
          output.text(`   Tags: ${scenario.tags.join(', ')}`);
        }

        if (similarity?.hasSimilar) {
          output.text(
            output.yellow(`   ⚠ Similar to existing: ${similarity.maxSimilarity}% match`)
          );
          if (flags.verbose && similarity.similar.length > 0) {
            for (const s of similarity.similar) {
              output.text(output.dim(`     - "${s.name}" (${s.similarity}% similar)`));
            }
          }
        }

        output.newLine();
      }

      output.text(output.dim('Run these scenarios with:'));
      output.text(output.dim(`  tpm scenario run ${args.collection}`));
    } catch (error) {
      generateSpinner.fail('Failed to generate scenarios');
      output.error(
        error instanceof Error ? error.message : 'Unknown error',
        flags.verbose ? String(error) : undefined
      );
    }
  }
}
