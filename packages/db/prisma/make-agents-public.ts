/**
 * One-off script to update all existing agents to be public.
 * Run with: pnpm --filter=@tpmjs/db exec tsx prisma/make-agents-public.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating all agents to be public...');

  const result = await prisma.agent.updateMany({
    where: { isPublic: false },
    data: { isPublic: true },
  });

  console.log(`Updated ${result.count} agents to isPublic=true`);

  // Show all agents now
  const agents = await prisma.agent.findMany({
    select: { id: true, name: true, isPublic: true },
  });
  console.log('\nAll agents:');
  for (const agent of agents) {
    console.log(`  - ${agent.name} (isPublic: ${agent.isPublic})`);
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
