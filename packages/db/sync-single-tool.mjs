import { PrismaClient } from '@prisma/client';
import { fetchLatestPackageWithMetadata } from '@tpmjs/npm-client';

const prisma = new PrismaClient();

async function main() {
  const packageName = '@tpmjs/text-transformer';

  console.log(`Fetching metadata for ${packageName}...`);
  const pkg = await fetchLatestPackageWithMetadata(packageName);

  if (!pkg) {
    console.error('Package not found!');
    return;
  }

  console.log(`Found ${packageName} v${pkg.version}`);
  console.log(`README length: ${pkg.readme ? pkg.readme.length : 0} chars`);
  console.log(`Keywords: ${(pkg.topLevelKeywords || pkg.keywords || []).join(', ')}`);

  // Update the tool in the database
  await prisma.tool.update({
    where: { npmPackageName: packageName },
    data: {
      npmReadme: pkg.readme || null,
      npmKeywords: pkg.topLevelKeywords || pkg.keywords || [],
      npmAuthor: pkg.author || null,
      npmMaintainers: pkg.maintainers || null,
    }
  });

  console.log('\n✅ Tool updated successfully!');
}

main().finally(() => prisma.$disconnect());
