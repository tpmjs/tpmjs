#!/usr/bin/env tsx

/**
 * Backfill Health Checks Script
 *
 * Runs health checks on all existing tools in the database to populate
 * initial health status data. This is a one-time script to be run after
 * deploying the health check system.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-health-checks.ts
 *
 * Environment Variables Required:
 *   DATABASE_URL - PostgreSQL connection string
 *   RAILWAY_EXECUTOR_URL - Railway executor service URL
 */

import { prisma } from '@tpmjs/db';
import { performBatchHealthCheck } from '../apps/web/src/lib/health-check/health-check-service';

async function main() {
  console.log('🏥 Starting health check backfill...\n');

  try {
    // Fetch all tool IDs
    console.log('📊 Fetching all tools from database...');
    const tools = await prisma.tool.findMany({
      select: {
        id: true,
        name: true,
        package: {
          select: {
            npmPackageName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`✅ Found ${tools.length} tools to check\n`);

    if (tools.length === 0) {
      console.log('No tools found in database. Exiting.');
      return;
    }

    // Extract tool IDs
    const toolIds = tools.map((t) => t.id);

    // Run batch health check with 5 concurrent checks and 1s delay between batches
    console.log('🔄 Running batch health checks...');
    console.log('   Batch size: 5 concurrent checks');
    console.log('   Delay between batches: 1000ms\n');

    const startTime = Date.now();

    await performBatchHealthCheck(toolIds, 'backfill', 5);

    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log('\n✅ Backfill complete!');
    console.log(`   Total tools checked: ${tools.length}`);
    console.log(`   Duration: ${durationSeconds}s`);
    console.log(`   Average time per tool: ${(duration / tools.length / 1000).toFixed(2)}s\n`);

    // Show summary of health status
    console.log('📊 Health Status Summary:');
    const healthSummary = await prisma.tool.groupBy({
      by: ['importHealth', 'executionHealth'],
      _count: true,
    });

    console.log('\nImport Health:');
    const importHealthCounts = await prisma.tool.groupBy({
      by: ['importHealth'],
      _count: true,
    });
    for (const row of importHealthCounts) {
      console.log(`   ${row.importHealth || 'UNKNOWN'}: ${row._count}`);
    }

    console.log('\nExecution Health:');
    const executionHealthCounts = await prisma.tool.groupBy({
      by: ['executionHealth'],
      _count: true,
    });
    for (const row of executionHealthCounts) {
      console.log(`   ${row.executionHealth || 'UNKNOWN'}: ${row._count}`);
    }

    // Show broken tools
    const brokenTools = await prisma.tool.findMany({
      where: {
        OR: [{ importHealth: 'BROKEN' }, { executionHealth: 'BROKEN' }],
      },
      select: {
        name: true,
        package: {
          select: {
            npmPackageName: true,
          },
        },
        importHealth: true,
        executionHealth: true,
        healthCheckError: true,
      },
    });

    if (brokenTools.length > 0) {
      console.log(`\n⚠️  Broken Tools (${brokenTools.length}):`);
      for (const tool of brokenTools) {
        console.log(
          `   - ${tool.package.npmPackageName}/${tool.name} (Import: ${tool.importHealth}, Execution: ${tool.executionHealth})`
        );
        if (tool.healthCheckError) {
          console.log(`     Error: ${tool.healthCheckError.slice(0, 100)}...`);
        }
      }
    } else {
      console.log('\n✅ All tools are healthy!');
    }
  } catch (error) {
    console.error('\n❌ Backfill failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
