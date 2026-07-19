import { randomUUID } from 'node:crypto';
import { prisma } from '@tpmjs/db';
import { fetchDownloadStats, fetchGitHubStarsFromRepository } from '@tpmjs/npm-client';
import { type NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '~/lib/cron-auth';
import {
  boundedPositiveInt,
  leaseDuePackageIds,
  METRICS_SLICE_DEFAULT,
  METRICS_SLICE_MAX,
  nextMetricsAt,
  QUALITY_SLICE_DEFAULT,
  QUALITY_SLICE_MAX,
  refreshQualityScoreSlice,
  releaseMetricsLease,
} from '~/lib/maintenance/bounded-work';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const EXTERNAL_CONCURRENCY = 5;

interface MetricPackage {
  id: string;
  npmPackageName: string;
  npmRepository: unknown;
  npmDownloadsLastMonth: number | null;
  githubStars: number | null;
}

interface BatchSummary {
  processed: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
}

async function refreshPackageMetrics(
  pkg: MetricPackage,
  leaseOwner: string
): Promise<'processed' | 'skipped'> {
  const [downloads, githubStars] = await Promise.all([
    fetchDownloadStats(pkg.npmPackageName),
    fetchGitHubStarsFromRepository(
      pkg.npmRepository as { type?: string; url?: string } | string | null
    ),
  ]);

  if (downloads === null && githubStars === null) {
    await releaseMetricsLease(pkg.id, leaseOwner);
    return 'skipped';
  }

  const changed =
    (downloads !== null && downloads !== pkg.npmDownloadsLastMonth) ||
    (githubStars !== null && githubStars !== pkg.githubStars);
  const updated = await prisma.package.updateMany({
    where: { id: pkg.id, metricsLeasedBy: leaseOwner },
    data: {
      ...(downloads !== null ? { npmDownloadsLastMonth: downloads } : {}),
      ...(githubStars !== null ? { githubStars } : {}),
      ...(changed ? { metricsVersion: { increment: 1 } } : {}),
      metricsNextAt: nextMetricsAt(pkg.id),
      metricsLeaseUntil: null,
      metricsLeasedBy: null,
    },
  });
  if (updated.count !== 1) throw new Error(`Metrics lease lost for ${pkg.id}`);
  return 'processed';
}

async function refreshPackageBatch(
  packages: MetricPackage[],
  leaseOwner: string
): Promise<BatchSummary> {
  const results = await Promise.allSettled(
    packages.map((pkg) => refreshPackageMetrics(pkg, leaseOwner))
  );
  const summary: BatchSummary = { processed: 0, skipped: 0, errors: 0, errorMessages: [] };

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const pkg = packages[i];
    if (!result || !pkg) continue;
    if (result.status === 'fulfilled') {
      summary[result.value]++;
      continue;
    }
    summary.errors++;
    const message = result.reason instanceof Error ? result.reason.message : 'Unknown error';
    summary.errorMessages.push(`Failed to process ${pkg.npmPackageName}: ${message}`);
    await releaseMetricsLease(pkg.id, leaseOwner).catch(console.error);
  }
  return summary;
}

/**
 * POST /api/sync/metrics
 *
 * Leases a finite oldest-due package slice. Package metrics and the lease are
 * committed together; quality scores propagate through a separate bounded SQL
 * slice keyed by package metrics_version. There is no whole-registry findMany
 * and no row-at-a-time tool update loop.
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  const startTime = Date.now();
  const packageLimit = boundedPositiveInt(
    request.nextUrl.searchParams.get('limit'),
    METRICS_SLICE_DEFAULT,
    METRICS_SLICE_MAX
  );
  const qualityLimit = boundedPositiveInt(
    request.nextUrl.searchParams.get('qualityLimit'),
    QUALITY_SLICE_DEFAULT,
    QUALITY_SLICE_MAX
  );
  const leaseOwner = `metrics:${process.pid}:${randomUUID()}`;
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  try {
    const packageIds = await leaseDuePackageIds(leaseOwner, packageLimit);
    const packages = await prisma.package.findMany({
      where: { id: { in: packageIds } },
      select: {
        id: true,
        npmPackageName: true,
        npmRepository: true,
        npmDownloadsLastMonth: true,
        githubStars: true,
      },
    });

    for (let i = 0; i < packages.length; i += EXTERNAL_CONCURRENCY) {
      const summary = await refreshPackageBatch(
        packages.slice(i, i + EXTERNAL_CONCURRENCY),
        leaseOwner
      );
      processed += summary.processed;
      skipped += summary.skipped;
      errors += summary.errors;
      errorMessages.push(...summary.errorMessages);
    }

    const qualityUpdated = await refreshQualityScoreSlice(qualityLimit);
    const durationMs = Date.now() - startTime;

    await prisma.syncCheckpoint.upsert({
      where: { source: 'metrics' },
      create: {
        source: 'metrics',
        checkpoint: {
          lastSliceAt: new Date().toISOString(),
          leased: packageIds.length,
          qualityUpdated,
        },
      },
      update: {
        checkpoint: {
          lastSliceAt: new Date().toISOString(),
          leased: packageIds.length,
          qualityUpdated,
        },
      },
    });

    await prisma.syncLog.create({
      data: {
        source: 'metrics',
        status: errors > 0 ? 'partial' : 'success',
        processed,
        skipped,
        errors,
        message: `Bounded slice leased ${packageIds.length}/${packageLimit}; refreshed ${qualityUpdated}/${qualityLimit} quality rows`,
        metadata: {
          durationMs,
          packageLimit,
          qualityLimit,
          qualityUpdated,
          errorMessages: errorMessages.slice(0, 5),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        leased: packageIds.length,
        processed,
        skipped,
        errors,
        qualityUpdated,
        packageLimit,
        qualityLimit,
        durationMs,
      },
    });
  } catch (error) {
    console.error('Metrics slice failed:', error);
    await prisma.syncLog
      .create({
        data: {
          source: 'metrics',
          status: 'error',
          processed,
          skipped,
          errors: errors + 1,
          message: error instanceof Error ? error.message : 'Unknown error',
          metadata: { durationMs: Date.now() - startTime },
        },
      })
      .catch(console.error);

    return NextResponse.json({ success: false, error: 'Metrics slice failed' }, { status: 500 });
  }
}
