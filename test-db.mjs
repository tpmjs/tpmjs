import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Testing database connection...');

  // Test 1: Count tools
  console.time('Count tools');
  const count = await prisma.tool.count();
  console.timeEnd('Count tools');
  console.log(`Total tools: ${count}`);

  // Test 2: Fetch first 20 tools (same as API)
  console.time('Fetch 20 tools');
  const tools = await prisma.tool.findMany({
    orderBy: [{ qualityScore: 'desc' }, { npmDownloadsLastMonth: 'desc' }, { createdAt: 'desc' }],
    take: 20,
  });
  console.timeEnd('Fetch 20 tools');
  console.log(`Fetched ${tools.length} tools`);

  // Test 3: Check if there are indexes
  console.log('\nFirst tool:', tools[0]?.npmPackageName || 'No tools found');
}

main()
  .catch((e) => {
    console.error('Database error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
