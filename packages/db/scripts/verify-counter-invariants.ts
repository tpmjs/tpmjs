import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '../src/index';

const prisma = new PrismaClient();

type CounterReader = Pick<Prisma.TransactionClient, 'registryCounter'>;
type CounterKey = readonly [metric: string, dimension: string];
type CounterSnapshot = Map<string, bigint>;

class ExpectedRollback extends Error {}

function serializeKey([metric, dimension]: CounterKey): string {
  return JSON.stringify([metric, dimension]);
}

async function readCounters(client: CounterReader, keys: CounterKey[]): Promise<CounterSnapshot> {
  const rows = await client.registryCounter.findMany({
    where: {
      OR: keys.map(([metric, dimension]) => ({ metric, dimension })),
    },
    select: { metric: true, dimension: true, value: true },
  });
  const values = new Map(rows.map((row) => [serializeKey([row.metric, row.dimension]), row.value]));

  return new Map(keys.map((key) => [serializeKey(key), values.get(serializeKey(key)) ?? 0n]));
}

function withDeltas(
  baseline: CounterSnapshot,
  deltas: Array<readonly [CounterKey, bigint]>
): CounterSnapshot {
  const expected = new Map(baseline);
  for (const [key, delta] of deltas) {
    const serialized = serializeKey(key);
    expected.set(serialized, (expected.get(serialized) ?? 0n) + delta);
  }
  return expected;
}

function assertSnapshot(actual: CounterSnapshot, expected: CounterSnapshot, phase: string): void {
  assert.deepEqual(Object.fromEntries(actual), Object.fromEntries(expected), phase);
}

async function verifyUpsertAndCascadeBalance(): Promise<void> {
  const suffix = randomUUID();
  const packageId = `counter-probe-package-${suffix}`;
  const toolId = `counter-probe-tool-${suffix}`;
  const packageName = `@tpmjs/counter-probe-${suffix}`;
  const categoryA = `probe-a-${suffix.slice(0, 8)}`;
  const categoryB = `probe-b-${suffix.slice(0, 8)}`;

  const keys: CounterKey[] = [
    ['total_packages', ''],
    ['official_packages', ''],
    ['total_tools', ''],
    ['official_tools', ''],
    ['tier_packages', 'minimal'],
    ['tier_packages', 'rich'],
    ['total_npm_downloads', ''],
    ['total_github_stars', ''],
    ['total_simulations', ''],
    ['package_tools', packageId],
    ['category_tools', categoryA],
    ['category_tools', categoryB],
    ['tools_with_schema', ''],
    ['import_health', 'UNKNOWN'],
    ['import_health', 'HEALTHY'],
    ['execution_health', 'UNKNOWN'],
    ['execution_health', 'BROKEN'],
    ['quality_bucket', 'unscored'],
    ['quality_bucket', 'high'],
  ];

  const committedBaseline = await readCounters(prisma, keys);

  try {
    await prisma.$transaction(async (tx) => {
      const baseline = await readCounters(tx, keys);

      await tx.package.create({
        data: {
          id: packageId,
          npmPackageName: packageName,
          npmVersion: '1.0.0',
          npmPublishedAt: new Date(),
          category: categoryA,
          tier: 'minimal',
          discoveryMethod: 'counter-probe',
          isOfficial: false,
          npmDownloadsLastMonth: 7,
          githubStars: 3,
        },
      });
      await tx.tool.create({
        data: {
          id: toolId,
          packageId,
          name: 'probe',
          description: 'Counter invariant probe',
        },
      });

      const afterInsert = await readCounters(tx, keys);
      const expectedAfterInsert = withDeltas(baseline, [
        [['total_packages', ''], 1n],
        [['total_tools', ''], 1n],
        [['tier_packages', 'minimal'], 1n],
        [['total_npm_downloads', ''], 7n],
        [['total_github_stars', ''], 3n],
        [['package_tools', packageId], 1n],
        [['category_tools', categoryA], 1n],
        [['import_health', 'UNKNOWN'], 1n],
        [['execution_health', 'UNKNOWN'], 1n],
        [['quality_bucket', 'unscored'], 1n],
      ]);
      assertSnapshot(afterInsert, expectedAfterInsert, 'real inserts must increment once');

      await tx.package.upsert({
        where: { npmPackageName: packageName },
        create: {
          id: packageId,
          npmPackageName: packageName,
          npmVersion: '1.0.1',
          npmPublishedAt: new Date(),
          category: categoryA,
          tier: 'minimal',
          discoveryMethod: 'counter-probe',
          isOfficial: false,
          npmDownloadsLastMonth: 7,
          githubStars: 3,
        },
        update: { npmVersion: '1.0.1' },
      });
      await tx.tool.upsert({
        where: { packageId_name: { packageId, name: 'probe' } },
        create: {
          id: toolId,
          packageId,
          name: 'probe',
          description: 'Updated counter invariant probe',
        },
        update: { description: 'Updated counter invariant probe' },
      });

      assertSnapshot(
        await readCounters(tx, keys),
        expectedAfterInsert,
        'conflicting upserts must not increment inserts'
      );

      await tx.package.update({
        where: { id: packageId },
        data: {
          category: categoryB,
          tier: 'rich',
          isOfficial: true,
          npmDownloadsLastMonth: 11,
          githubStars: 5,
        },
      });
      await tx.tool.update({
        where: { id: toolId },
        data: {
          schemaSource: 'extracted',
          importHealth: 'HEALTHY',
          executionHealth: 'BROKEN',
          qualityScore: new Prisma.Decimal('0.75'),
        },
      });

      const expectedAfterUpdate = withDeltas(expectedAfterInsert, [
        [['official_packages', ''], 1n],
        [['official_tools', ''], 1n],
        [['tier_packages', 'minimal'], -1n],
        [['tier_packages', 'rich'], 1n],
        [['total_npm_downloads', ''], 4n],
        [['total_github_stars', ''], 2n],
        [['category_tools', categoryA], -1n],
        [['category_tools', categoryB], 1n],
        [['tools_with_schema', ''], 1n],
        [['import_health', 'UNKNOWN'], -1n],
        [['import_health', 'HEALTHY'], 1n],
        [['execution_health', 'UNKNOWN'], -1n],
        [['execution_health', 'BROKEN'], 1n],
        [['quality_bucket', 'unscored'], -1n],
        [['quality_bucket', 'high'], 1n],
      ]);
      assertSnapshot(
        await readCounters(tx, keys),
        expectedAfterUpdate,
        'dimension changes must move, not duplicate, projected counts'
      );

      await tx.tool.update({
        where: { id: toolId },
        data: { isActive: false, retiredAt: new Date() },
      });
      const expectedWhileRetired = withDeltas(expectedAfterUpdate, [
        [['total_tools', ''], -1n],
        [['official_tools', ''], -1n],
        [['package_tools', packageId], -1n],
        [['category_tools', categoryB], -1n],
        [['tools_with_schema', ''], -1n],
        [['import_health', 'HEALTHY'], -1n],
        [['execution_health', 'BROKEN'], -1n],
        [['quality_bucket', 'high'], -1n],
      ]);
      assertSnapshot(
        await readCounters(tx, keys),
        expectedWhileRetired,
        'retiring a tool must remove only its active-registry projections'
      );

      await tx.tool.update({
        where: { id: toolId },
        data: {
          description: 'Mutable historical evidence',
          importHealth: 'UNKNOWN',
          executionHealth: 'UNKNOWN',
          schemaSource: null,
          qualityScore: null,
        },
      });
      assertSnapshot(
        await readCounters(tx, keys),
        expectedWhileRetired,
        'mutating retired evidence must not leak into active-registry projections'
      );

      await tx.tool.update({
        where: { id: toolId },
        data: {
          isActive: true,
          retiredAt: null,
          importHealth: 'HEALTHY',
          executionHealth: 'BROKEN',
          schemaSource: 'extracted',
          qualityScore: new Prisma.Decimal('0.75'),
        },
      });
      assertSnapshot(
        await readCounters(tx, keys),
        expectedAfterUpdate,
        'reactivating a tool must restore its current active-registry projections once'
      );

      const driftedKeys: CounterKey[] = [
        ['total_packages', ''],
        ['tier_packages', 'rich'],
        ['total_npm_downloads', ''],
        ['total_github_stars', ''],
        ['total_simulations', ''],
        ['category_tools', categoryB],
        ['quality_bucket', 'high'],
      ];
      for (const [metric, dimension] of driftedKeys) {
        await tx.$executeRaw`SELECT tpmjs_counter_add(${metric}, ${dimension}, ${5n}::bigint)`;
      }
      assertSnapshot(
        await readCounters(tx, keys),
        withDeltas(
          expectedAfterUpdate,
          driftedKeys.map((key) => [key, 5n])
        ),
        'the probe must create detectable drift before reconciliation'
      );

      await tx.$executeRawUnsafe('SELECT tpmjs_reconcile_counters()');
      assertSnapshot(
        await readCounters(tx, keys),
        expectedAfterUpdate,
        'exact reconciliation must repair every projected metric family'
      );

      await tx.package.delete({ where: { id: packageId } });
      assertSnapshot(
        await readCounters(tx, keys),
        baseline,
        'package cascade deletion must restore every counter'
      );

      throw new ExpectedRollback('rollback counter invariant probe');
    });
  } catch (error) {
    if (!(error instanceof ExpectedRollback)) throw error;
  }

  assert.equal(
    await prisma.package.count({ where: { id: packageId } }),
    0,
    'probe package must not persist'
  );
  assert.equal(
    await prisma.tool.count({ where: { id: toolId } }),
    0,
    'probe tool must not persist'
  );
  assertSnapshot(
    await readCounters(prisma, keys),
    committedBaseline,
    'rolled-back probe must leave committed counters unchanged'
  );
}

async function verifyUnderflowFailsLoudly(): Promise<void> {
  const metric = `underflow_probe_${randomUUID().slice(0, 8)}`;
  const dimension = randomUUID();

  await assert.rejects(
    prisma.$executeRaw`SELECT tpmjs_counter_add(${metric}, ${dimension}, ${-1n}::bigint)`,
    'a missing decrement must fail instead of being clamped to zero'
  );
  assert.equal(
    await prisma.registryCounter.count({ where: { metric, dimension } }),
    0,
    'failed underflow must not persist a projection row'
  );
}

async function main(): Promise<void> {
  await verifyUpsertAndCascadeBalance();
  await verifyUnderflowFailsLoudly();
  console.log('registry counter invariants: pass');
}

main()
  .catch((error) => {
    console.error('registry counter invariants: fail', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
