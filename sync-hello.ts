import { PrismaClient } from '@prisma/client';
import { validateTpmjsField } from '@tpmjs/types/tpmjs';

const prisma = new PrismaClient();

async function syncHello() {
  try {
    console.log('Fetching @tpmjs/hello from npm...');

    const response = await fetch('https://registry.npmjs.org/@tpmjs/hello');
    const data = await response.json();

    const latest = data['dist-tags'].latest;
    const pkg = data.versions[latest];

    console.log(`\nPackage: ${pkg.name}@${pkg.version}`);
    console.log(`Keywords: ${pkg.keywords.join(', ')}`);
    console.log(`\ntpmjs field:`, JSON.stringify(pkg.tpmjs, null, 2));

    // Validate
    const validation = validateTpmjsField(pkg.tpmjs);

    if (!validation.valid) {
      console.error('\n❌ Invalid tpmjs field:', validation.errors);
      process.exit(1);
    }

    console.log(`\n✅ Valid tpmjs field (${validation.tier} tier)`);
    console.log(`Tools to create: ${validation.tools?.length || 0}`);

    // Upsert Package
    const packageRecord = await prisma.package.upsert({
      where: { npmPackageName: pkg.name },
      create: {
        npmPackageName: pkg.name,
        npmVersion: pkg.version,
        npmPublishedAt: new Date(pkg.time[pkg.version]),
        npmDownloadsLastMonth: 0,
        category: validation.packageData!.category,
        env: validation.packageData!.env || null,
        frameworks: validation.packageData!.frameworks || [],
        tier: validation.tier!,
        discoveryMethod: 'manual',
        isOfficial: pkg.name.startsWith('@tpmjs/'),
      },
      update: {
        npmVersion: pkg.version,
        npmPublishedAt: new Date(pkg.time[pkg.version]),
        category: validation.packageData!.category,
        env: validation.packageData!.env || null,
        frameworks: validation.packageData!.frameworks || [],
        tier: validation.tier!,
      },
    });

    console.log(`\n✅ Package upserted: ${packageRecord.id}`);

    // Get existing tools
    const existingTools = await prisma.tool.findMany({
      where: { packageId: packageRecord.id },
    });

    console.log(`\nExisting tools: ${existingTools.length}`);

    // Upsert each tool
    for (const toolDef of validation.tools || []) {
      const tool = await prisma.tool.upsert({
        where: {
          packageId_name: {
            packageId: packageRecord.id,
            name: toolDef.name,
          },
        },
        create: {
          packageId: packageRecord.id,
          name: toolDef.name,
          description: toolDef.description,
          parameters: toolDef.parameters ? (toolDef.parameters as any) : undefined,
          returns: toolDef.returns ? (toolDef.returns as any) : undefined,
          aiAgent: toolDef.aiAgent ? (toolDef.aiAgent as any) : undefined,
          qualityScore: null,
        },
        update: {
          description: toolDef.description,
          parameters: toolDef.parameters ? (toolDef.parameters as any) : undefined,
          returns: toolDef.returns ? (toolDef.returns as any) : undefined,
          aiAgent: toolDef.aiAgent ? (toolDef.aiAgent as any) : undefined,
        },
      });

      console.log(`✅ Tool upserted: ${tool.name} (${tool.id})`);
    }

    // Delete orphaned tools
    const orphanedTools = existingTools.filter(
      (existingTool) => !validation.tools?.some((toolDef) => toolDef.name === existingTool.name)
    );

    if (orphanedTools.length > 0) {
      await prisma.tool.deleteMany({
        where: { id: { in: orphanedTools.map((t) => t.id) } },
      });
      console.log(`\n🗑️  Deleted ${orphanedTools.length} orphaned tools`);
    }

    console.log('\n✅ Sync complete!');
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncHello();
