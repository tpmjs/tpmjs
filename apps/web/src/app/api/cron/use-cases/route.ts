/**
 * Use Cases Generation Cron Endpoint
 *
 * Triggers the nightly use cases generation process to:
 * 1. Find qualifying scenarios (qualityScore >= 0.3, totalRuns >= 1, lastRunStatus = 'pass')
 * 2. Generate marketing content via AI
 * 3. Create/update UseCase records
 * 4. Update SocialProof cache
 * 5. Compute rank scores
 *
 * Schedule: Daily at midnight (configured in vercel.json)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '~/lib/cron-auth';
import {
  computeRankScores,
  generateUseCasesForQualifyingScenarios,
} from '~/lib/use-cases/generate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for AI generation

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // 1. Verify cron secret
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  try {
    // 2. Generate use cases for qualifying scenarios
    const generationResult = await generateUseCasesForQualifyingScenarios();

    // 3. Compute rank scores for all use cases
    const rankedCount = await computeRankScores();

    const durationMs = Date.now() - startTime;

    // 4. Log the result
    const { prisma } = await import('@tpmjs/db');
    await prisma.syncLog.create({
      data: {
        source: 'use-cases-generation',
        status: generationResult.errors > 0 ? 'partial' : 'success',
        processed: generationResult.created + generationResult.updated,
        skipped: generationResult.skipped,
        errors: generationResult.errors,
        message: `Created: ${generationResult.created}, Updated: ${generationResult.updated}, Skipped: ${generationResult.skipped}, Ranked: ${rankedCount}`,
        metadata: {
          durationMs,
          rankedCount,
          errorDetails: generationResult.errorDetails.slice(0, 5), // Keep first 5 errors
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        created: generationResult.created,
        updated: generationResult.updated,
        skipped: generationResult.skipped,
        errors: generationResult.errors,
        ranked: rankedCount,
        durationMs,
      },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;

    // Log error
    const { prisma } = await import('@tpmjs/db');
    await prisma.syncLog.create({
      data: {
        source: 'use-cases-generation',
        status: 'error',
        processed: 0,
        skipped: 0,
        errors: 1,
        message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          durationMs,
        },
      },
    });

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
