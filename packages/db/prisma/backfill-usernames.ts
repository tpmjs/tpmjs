#!/usr/bin/env tsx
/**
 * Backfill usernames for all users who don't have one.
 * Converts user's name to a URL-friendly slug.
 *
 * Run with: npx tsx packages/db/prisma/backfill-usernames.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RESERVED_USERNAMES = [
  'admin',
  'api',
  'auth',
  'dashboard',
  'help',
  'support',
  'system',
  'www',
  'settings',
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  'agents',
  'collections',
  'tools',
  'tool',
  'playground',
  'explore',
  'search',
  'about',
  'blog',
  'docs',
  'pricing',
  'terms',
  'privacy',
  'contact',
  'status',
  'tpmjs',
  'tpm',
  'official',
];

/**
 * Convert a display name to a URL-friendly username.
 */
function suggestUsername(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-+|-+$/g, '') // Trim hyphens
    .slice(0, 30);
}

/**
 * Generate a unique username by appending numbers if needed.
 */
async function generateUniqueUsername(baseName: string): Promise<string> {
  let username = suggestUsername(baseName);

  // Ensure minimum length
  if (username.length < 3) {
    username = `user-${username || 'anon'}`;
  }

  // Check if reserved
  if (RESERVED_USERNAMES.includes(username)) {
    username = `${username}-user`;
  }

  // Check if already taken
  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!existing) {
    return username;
  }

  // Append numbers until unique
  let counter = 1;
  while (counter < 1000) {
    const candidate = `${username.slice(0, 26)}-${counter}`;
    const exists = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!exists) {
      return candidate;
    }
    counter++;
  }

  // Fallback: use random suffix
  return `${username.slice(0, 22)}-${Date.now().toString(36)}`;
}

async function main() {
  console.log('🔧 Backfilling usernames for users without one...\n');

  // Find all users without a username
  const usersWithoutUsername = await prisma.user.findMany({
    where: { username: null },
    select: { id: true, name: true, email: true },
  });

  console.log(`Found ${usersWithoutUsername.length} users without a username.\n`);

  if (usersWithoutUsername.length === 0) {
    console.log('✅ All users already have usernames!');
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const user of usersWithoutUsername) {
    try {
      const username = await generateUniqueUsername(user.name);

      await prisma.user.update({
        where: { id: user.id },
        data: { username },
      });

      console.log(`✅ ${user.email} → @${username}`);
      updated++;
    } catch (error) {
      console.error(`❌ Failed to update ${user.email}:`, error);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`${'='.repeat(50)}`);
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
