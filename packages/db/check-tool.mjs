import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tool = await prisma.tool.findUnique({
    where: { npmPackageName: '@tpmjs/text-transformer' },
    select: {
      npmPackageName: true,
      npmVersion: true,
      npmReadme: true,
    }
  });
  
  if (tool) {
    console.log('Tool found:', tool.npmPackageName, tool.npmVersion);
    console.log('Has README:', tool.npmReadme ? `Yes (${tool.npmReadme.length} chars)` : 'No');
  } else {
    console.log('Tool @tpmjs/text-transformer not found in database');
    
    // List all tools to see what's available
    const allTools = await prisma.tool.findMany({
      select: { npmPackageName: true },
      take: 10
    });
    console.log('\nAvailable tools:');
    allTools.forEach(t => console.log(' -', t.npmPackageName));
  }
}

main().finally(() => prisma.$disconnect());
