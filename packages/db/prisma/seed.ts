import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sync checkpoints...');

  // Create initial sync checkpoints
  await prisma.syncCheckpoint.upsert({
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

  await prisma.syncCheckpoint.upsert({
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

  await prisma.syncCheckpoint.upsert({
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

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
