/**
 * Migration script: Convert existing Collection.useCases (JSON) to Scenario records
 *
 * This script:
 * 1. Finds all collections with useCases
 * 2. Creates a Scenario for each use case
 * 3. Generates embeddings for similarity detection
 * 4. Generates AI tags for categorization
 *
 * Run with: npx tsx scripts/migrate-use-cases-to-scenarios.ts
 */

// Direct import since this script runs standalone
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Use case structure from the existing generator
interface ToolStep {
  toolName: string;
  packageName: string;
  purpose: string;
  order: number;
}

interface UseCase {
  id: string;
  userPrompt: string;
  description: string;
  toolSequence: ToolStep[];
}

async function computeEmbedding(text: string): Promise<number[] | null> {
  // Skip embedding generation in migration - we'll generate them lazily later
  // This keeps the migration fast and doesn't require API keys
  console.log(`  [skip] Embedding generation deferred for: "${text.slice(0, 50)}..."`);
  return null;
}

async function generateTags(prompt: string, description: string): Promise<string[]> {
  // Generate basic tags from the prompt/description
  // Real AI-based tag generation will happen when scenarios are viewed
  const words = `${prompt} ${description}`.toLowerCase();
  const tags: string[] = [];

  // Simple keyword extraction
  if (words.includes('scrape') || words.includes('crawl') || words.includes('fetch')) {
    tags.push('web-scraping');
  }
  if (words.includes('api') || words.includes('endpoint')) {
    tags.push('api');
  }
  if (words.includes('data') || words.includes('extract')) {
    tags.push('data-extraction');
  }
  if (words.includes('search') || words.includes('find')) {
    tags.push('search');
  }
  if (words.includes('code') || words.includes('debug') || words.includes('fix')) {
    tags.push('development');
  }
  if (words.includes('file') || words.includes('document')) {
    tags.push('files');
  }
  if (words.includes('image') || words.includes('screenshot')) {
    tags.push('media');
  }
  if (words.includes('email') || words.includes('message')) {
    tags.push('communication');
  }
  if (words.includes('monitor') || words.includes('track')) {
    tags.push('monitoring');
  }
  if (words.includes('automate') || words.includes('workflow')) {
    tags.push('automation');
  }

  return tags.length > 0 ? tags : ['general'];
}

async function migrateUseCases() {
  console.log('Starting use cases to scenarios migration...\n');

  // Find all collections with useCases
  const collections = await prisma.collection.findMany({
    where: {
      useCases: { not: null },
    },
    select: {
      id: true,
      name: true,
      useCases: true,
    },
  });

  console.log(`Found ${collections.length} collections with use cases to migrate.\n`);

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const collection of collections) {
    console.log(`Processing collection: "${collection.name}" (${collection.id})`);

    const useCases = collection.useCases as { useCases: UseCase[] } | null;
    if (!useCases || !useCases.useCases || !Array.isArray(useCases.useCases)) {
      console.log(`  [skip] No valid useCases array found\n`);
      totalSkipped++;
      continue;
    }

    for (const useCase of useCases.useCases) {
      try {
        // Check if scenario already exists for this prompt
        const existing = await prisma.scenario.findFirst({
          where: {
            collectionId: collection.id,
            prompt: useCase.userPrompt,
          },
        });

        if (existing) {
          console.log(
            `  [skip] Scenario already exists for: "${useCase.userPrompt.slice(0, 40)}..."`
          );
          totalSkipped++;
          continue;
        }

        // Generate tags
        const tags = await generateTags(useCase.userPrompt, useCase.description);

        // Create the scenario
        const scenario = await prisma.scenario.create({
          data: {
            collectionId: collection.id,
            prompt: useCase.userPrompt,
            name: useCase.description,
            description: `Migrated from legacy use case: ${useCase.id}. Tool sequence: ${useCase.toolSequence.map((t) => t.toolName).join(' → ')}`,
            tags,
          },
        });

        console.log(`  [created] Scenario: "${useCase.description.slice(0, 50)}..."`);
        totalMigrated++;

        // Optionally generate embedding (deferred for now)
        const embedding = await computeEmbedding(useCase.userPrompt);
        if (embedding) {
          await prisma.scenarioEmbedding.create({
            data: {
              scenarioId: scenario.id,
              embedding: embedding as unknown as object,
            },
          });
        }
      } catch (error) {
        console.error(`  [error] Failed to migrate use case "${useCase.id}":`, error);
        totalErrors++;
      }
    }

    console.log('');
  }

  console.log('Migration complete!');
  console.log(`  Total migrated: ${totalMigrated}`);
  console.log(`  Total skipped: ${totalSkipped}`);
  console.log(`  Total errors: ${totalErrors}`);
}

// Run the migration
migrateUseCases()
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
