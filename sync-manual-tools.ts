import { prisma } from './packages/db/src/index.js';
import { manualTools } from './manual-tools.js';
import { fetchLatestPackageWithMetadata } from './packages/npm-client/src/package.js';

async function syncManualTools() {
  console.log('\n🔧 Starting manual tools sync...\n');

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const manualTool of manualTools) {
    try {
      console.log(`Processing: ${manualTool.npmPackageName} (${manualTool.exportName})`);

      // Fetch package metadata from npm
      const npmData = await fetchLatestPackageWithMetadata(manualTool.npmPackageName);

      if (!npmData) {
        console.error(`  ❌ Package not found on npm: ${manualTool.npmPackageName}`);
        errors++;
        continue;
      }

      // Use manual version if specified, otherwise use latest from npm
      const version = manualTool.npmVersion || npmData.version;

      // Get published date
      const publishedAt = npmData.time?.[version] || npmData.time?.modified || new Date().toISOString();

      // Upsert Package record
      const packageRecord = await prisma.package.upsert({
        where: { npmPackageName: manualTool.npmPackageName },
        create: {
          npmPackageName: manualTool.npmPackageName,
          npmVersion: version,
          npmPublishedAt: new Date(publishedAt),
          npmDescription: npmData.description || null,
          npmRepository: npmData.repository || null,
          npmHomepage: npmData.homepage || manualTool.websiteUrl || null,
          npmLicense: npmData.license || null,
          npmKeywords: npmData.keywords || [],
          npmReadme: npmData.readme || null,
          npmAuthor: npmData.author || null,
          npmMaintainers: npmData.maintainers || null,
          category: manualTool.category,
          env: manualTool.env ? (manualTool.env as any) : null,
          frameworks: manualTool.frameworks,
          tier: calculateTier(manualTool),
          discoveryMethod: 'manual',
          isOfficial: manualTool.npmPackageName.startsWith('@tpmjs/'),
          npmDownloadsLastMonth: 0,
        },
        update: {
          npmVersion: version,
          npmPublishedAt: new Date(publishedAt),
          npmDescription: npmData.description || null,
          npmRepository: npmData.repository || null,
          npmHomepage: npmData.homepage || manualTool.websiteUrl || null,
          npmLicense: npmData.license || null,
          npmKeywords: npmData.keywords || [],
          npmReadme: npmData.readme || null,
          npmAuthor: npmData.author || null,
          npmMaintainers: npmData.maintainers || null,
          category: manualTool.category,
          env: manualTool.env ? (manualTool.env as any) : null,
          frameworks: manualTool.frameworks,
          tier: calculateTier(manualTool),
          isOfficial: manualTool.npmPackageName.startsWith('@tpmjs/'),
        },
      });

      console.log(`  ✅ Package upserted: ${packageRecord.id}`);

      // Get existing tools for this package
      const existingTools = await prisma.tool.findMany({
        where: { packageId: packageRecord.id },
      });

      // Upsert the tool
      const tool = await prisma.tool.upsert({
        where: {
          packageId_exportName: {
            packageId: packageRecord.id,
            exportName: manualTool.exportName,
          },
        },
        create: {
          packageId: packageRecord.id,
          exportName: manualTool.exportName,
          description: manualTool.description,
          parameters: manualTool.parameters ? (manualTool.parameters as any) : null,
          returns: manualTool.returns ? (manualTool.returns as any) : null,
          aiAgent: manualTool.aiAgent ? (manualTool.aiAgent as any) : null,
        },
        update: {
          description: manualTool.description,
          parameters: manualTool.parameters ? (manualTool.parameters as any) : null,
          returns: manualTool.returns ? (manualTool.returns as any) : null,
          aiAgent: manualTool.aiAgent ? (manualTool.aiAgent as any) : null,
        },
      });

      console.log(`  ✅ Tool upserted: ${tool.exportName} (${tool.id})`);
      processed++;
    } catch (error) {
      console.error(
        `  ❌ Error processing ${manualTool.npmPackageName} (${manualTool.exportName}):`,
        error
      );
      errors++;
    }
  }

  console.log('\n📊 Manual sync complete!');
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total manual tools: ${manualTools.length}\n`);
}

function calculateTier(tool: typeof manualTools[0]): 'minimal' | 'rich' {
  // Tier is 'rich' if tool has parameters OR returns OR aiAgent
  if (tool.parameters || tool.returns || tool.aiAgent) {
    return 'rich';
  }
  return 'minimal';
}

syncManualTools()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Manual sync failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
