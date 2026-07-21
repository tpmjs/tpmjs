import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sync checkpoints...');

  const seededToolCount = await prisma.$transaction(async (tx) => {
    // Create initial sync checkpoints
    await tx.syncCheckpoint.upsert({
      where: { source: 'changes-feed' },
      update: {},
      create: {
        source: 'changes-feed',
        checkpoint: {
          sequence: '0',
          lastProcessed: null,
        },
      },
    });

    await tx.syncCheckpoint.upsert({
      where: { source: 'keyword-search' },
      update: {},
      create: {
        source: 'keyword-search',
        checkpoint: {
          lastRun: null,
          totalProcessed: 0,
        },
      },
    });

    await tx.syncCheckpoint.upsert({
      where: { source: 'metrics' },
      update: {},
      create: {
        source: 'metrics',
        checkpoint: {
          lastRun: null,
          totalProcessed: 0,
        },
      },
    });

    console.log('Seeding the offline starter registry...');

    const starterPackage = await tx.package.upsert({
      where: { npmPackageName: '@tpmjs/hello' },
      update: {},
      create: {
        npmPackageName: '@tpmjs/hello',
        npmVersion: '0.0.3',
        npmPublishedAt: new Date('2026-01-25T01:59:09.872Z'),
        npmDescription: 'Example TPMJS tools - Hello World and Hello Name',
        npmRepository: { type: 'git', url: 'https://github.com/tpmjs/tpmjs.git' },
        npmHomepage: 'https://tpmjs.com',
        npmLicense: 'MIT',
        npmKeywords: ['tpmjs', 'ai-sdk', 'hello', 'example'],
        category: 'text-analysis',
        frameworks: ['vercel-ai'],
        tier: 'rich',
        discoveryMethod: 'seed',
        isOfficial: true,
      },
    });

    const starterTools = [
      {
        name: 'helloWorldTool',
        description: 'Returns a simple Hello, World! greeting with an optional timestamp',
        inputSchema: {
          type: 'object',
          properties: {
            includeTimestamp: {
              type: 'boolean',
              description: 'Whether to include a timestamp in the response',
            },
          },
          additionalProperties: false,
        },
        signature:
          '(includeTimestamp?: boolean) => Promise<{ message: string; timestamp?: string }>',
        tags: ['example', 'greeting', 'text'],
      },
      {
        name: 'helloNameTool',
        description: 'Returns a personalized greeting for the provided name',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'The name of the person to greet' },
          },
          required: ['name'],
          additionalProperties: false,
        },
        signature: '(name: string) => Promise<{ message: string; timestamp: string }>',
        tags: ['example', 'greeting', 'text'],
      },
    ] as const;

    for (const starterTool of starterTools) {
      await tx.tool.upsert({
        where: {
          packageId_name: { packageId: starterPackage.id, name: starterTool.name },
        },
        update: {},
        create: {
          packageId: starterPackage.id,
          name: starterTool.name,
          description: starterTool.description,
          inputSchema: starterTool.inputSchema,
          schemaSource: 'author',
          toolDiscoverySource: 'manual',
          signature: starterTool.signature,
          tags: [...starterTool.tags],
          lastSeenVersion: '0.0.3',
        },
      });
    }

    const transactionToolCount = await tx.tool.count({
      where: { packageId: starterPackage.id, name: { in: starterTools.map((tool) => tool.name) } },
    });
    if (transactionToolCount !== starterTools.length) {
      throw new Error(
        `Starter registry verification failed: expected ${starterTools.length} tools, found ${transactionToolCount}`
      );
    }
    return transactionToolCount;
  });

  console.log(`Seed completed successfully (${seededToolCount} executable starter tools)`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
