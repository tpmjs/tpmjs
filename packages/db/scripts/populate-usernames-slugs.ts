/**
 * Migration script to populate usernames and collection slugs for existing data.
 *
 * Run with: pnpm --filter=@tpmjs/db tsx scripts/populate-usernames-slugs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Convert a display name to a URL-friendly slug/username.
 * - Lowercase
 * - Replace spaces and special chars with hyphens
 * - Remove consecutive hyphens
 * - Trim hyphens from start/end
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-+|-+$/g, '') // Trim hyphens from start/end
    .slice(0, 30); // Max length for username/slug
}

/**
 * Generate a unique username by appending a number suffix if needed.
 */
async function generateUniqueUsername(baseName: string): Promise<string> {
  let username = slugify(baseName);

  // If empty after slugify, use a default
  if (!username) {
    username = 'user';
  }

  // Check if username exists
  const existing = await prisma.user.findUnique({ where: { username } });
  if (!existing) {
    return username;
  }

  // Append numbers until unique
  let counter = 1;
  while (true) {
    const candidate = `${username.slice(0, 26)}-${counter}`; // Leave room for suffix
    const exists = await prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) {
      return candidate;
    }
    counter++;
    if (counter > 1000) {
      throw new Error(`Could not generate unique username for ${baseName}`);
    }
  }
}

/**
 * Generate a unique slug for a collection within a user's scope.
 */
async function generateUniqueSlug(userId: string, baseName: string): Promise<string> {
  let slug = slugify(baseName);

  // If empty after slugify, use a default
  if (!slug) {
    slug = 'collection';
  }

  // Check if slug exists for this user
  const existing = await prisma.collection.findFirst({
    where: { userId, slug },
  });
  if (!existing) {
    return slug;
  }

  // Append numbers until unique within user scope
  let counter = 1;
  while (true) {
    const candidate = `${slug.slice(0, 46)}-${counter}`; // Leave room for suffix
    const exists = await prisma.collection.findFirst({
      where: { userId, slug: candidate },
    });
    if (!exists) {
      return candidate;
    }
    counter++;
    if (counter > 1000) {
      throw new Error(`Could not generate unique slug for ${baseName}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting username and slug population...\n');

  // Populate usernames for users without one
  const usersWithoutUsername = await prisma.user.findMany({
    where: { username: null },
  });

  console.log(`Found ${usersWithoutUsername.length} users without usernames`);

  for (const user of usersWithoutUsername) {
    const username = await generateUniqueUsername(user.name || user.email.split('@')[0]);
    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });
    console.log(`  ✓ User "${user.name || user.email}" → @${username}`);
  }

  // Populate slugs for collections without one
  const collectionsWithoutSlug = await prisma.collection.findMany({
    where: { slug: null },
    include: { user: true },
  });

  console.log(`\nFound ${collectionsWithoutSlug.length} collections without slugs`);

  for (const collection of collectionsWithoutSlug) {
    const slug = await generateUniqueSlug(collection.userId, collection.name);
    await prisma.collection.update({
      where: { id: collection.id },
      data: { slug },
    });
    console.log(`  ✓ Collection "${collection.name}" → ${slug}`);
  }

  console.log('\n✅ Migration complete!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
