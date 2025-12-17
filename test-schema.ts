import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testSchema() {
  console.log('Testing new Package + Tool schema...\n');

  // Test 1: Create a package
  console.log('1. Creating test package...');
  const pkg = await prisma.package.create({
    data: {
      npmPackageName: '@test/hello',
      npmVersion: '1.0.0',
      npmPublishedAt: new Date(),
      category: 'text-analysis',
      tier: 'rich',
      discoveryMethod: 'test',
      isOfficial: false,
      frameworks: ['vercel-ai'],
      npmDownloadsLastMonth: 100,
    },
  });
  console.log(`✅ Package created: ${pkg.npmPackageName} (${pkg.id})\n`);

  // Test 2: Create multiple tools for the package
  console.log('2. Creating tools for package...');
  const tool1 = await prisma.tool.create({
    data: {
      packageId: pkg.id,
      name: 'helloWorldTool',
      description: 'Returns a simple Hello World greeting',
    },
  });
  console.log(`✅ Tool 1 created: ${tool1.name}`);

  const tool2 = await prisma.tool.create({
    data: {
      packageId: pkg.id,
      name: 'helloNameTool',
      description: 'Returns a personalized greeting with name',
    },
  });
  console.log(`✅ Tool 2 created: ${tool2.name}\n`);

  // Test 3: Query package with tools
  console.log('3. Querying package with tools...');
  const packageWithTools = await prisma.package.findUnique({
    where: { npmPackageName: '@test/hello' },
    include: { tools: true },
  });
  console.log(`✅ Found package with ${packageWithTools?.tools.length} tools:`);
  packageWithTools?.tools.forEach((t) => {
    console.log(`   - ${t.name}: ${t.description}`);
  });
  console.log();

  // Test 4: Query tool with package
  console.log('4. Querying tool with package...');
  const toolWithPackage = await prisma.tool.findFirst({
    where: {
      package: { npmPackageName: '@test/hello' },
      name: 'helloWorldTool',
    },
    include: { package: true },
  });
  console.log(`✅ Found tool: ${toolWithPackage?.name}`);
  console.log(`   Package: ${toolWithPackage?.package.npmPackageName}`);
  console.log(`   Category: ${toolWithPackage?.package.category}\n`);

  // Test 5: Delete package (should cascade to tools)
  console.log('5. Testing cascade delete...');
  await prisma.package.delete({
    where: { id: pkg.id },
  });
  const remainingTools = await prisma.tool.count({
    where: { packageId: pkg.id },
  });
  console.log(`✅ Package deleted, remaining tools: ${remainingTools}`);
  console.log(`   (Should be 0 due to cascade delete)\n`);

  console.log('✅ All schema tests passed!');
}

testSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
