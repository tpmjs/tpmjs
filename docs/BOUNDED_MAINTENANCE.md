# Bounded maintenance at registry scale

TPMJS maintenance is designed for a registry that may contain billions of
tools. A timer invocation therefore has a fixed work budget. Registry size may
increase queue depth, but it must not increase the amount of work performed by
one request.

## Scheduling contract

Health and package-metric freshness are stored on their source rows:

- tools expose `health_check_next_at` plus an expiring lease;
- packages expose `metrics_next_at` plus an expiring lease;
- changed package metrics increment `metrics_version`;
- each tool records the package metric version reflected in its quality score.

Workers atomically claim due rows with `FOR UPDATE SKIP LOCKED`. A crashed
worker cannot strand work because its lease expires after 20 minutes. Healthy
tools are revisited after roughly seven days, broken tools after roughly one
day, and unknown/transient failures sooner. Deterministic jitter prevents a
publication or migration wave from becoming a synchronized refresh wave.

Production slices are intentionally small:

| Lane | Per invocation | Poll cadence |
| --- | ---: | ---: |
| Tool health | 20 due tools | 5 minutes |
| Package metrics | 5 due packages | 15 minutes |
| Quality projection | 500 dirty tools | with package metrics |

Request parameters are capped server-side; callers cannot turn a slice back
into a sweep.

## Transactional projections

Values that were previously rebuilt by scanning complete history are now
updated in the same transaction as their source event:

- page views update tool, collection, and agent view counters;
- execution events update execution counters;
- conversation/message writes update agent counters;
- registry writes update totals and low-cardinality distributions in
  `registry_counters`.
- daily use-case generation selects only five due scenarios; rank refresh uses
  one 500-row dirty slice rather than loading and updating every use case.

The daily stats snapshot reads those projections and only scans explicitly
time-bounded event windows. View and execution rollup endpoints remain as
cheap compatibility responses; they no longer perform work.

## Migration discipline

`packages/db/prisma/migrations/20260719000000_baseline` is the immutable
baseline for the schema that predated migration tracking. The following
`20260719010000_bounded_maintenance` migration is additive and performs a
single exact backfill before installing transactional triggers. It does not
delete source or history rows.

CI proves both properties on a fresh pgvector Postgres database:

1. every migration applies in order;
2. the resulting database has no drift from `schema.prisma`.

For an existing database created before the migration history, mark only the
baseline as applied, then run `prisma migrate deploy`. Always take and verify a
database dump first.

## Operator checks

The durable queues are directly observable:

```sql
SELECT count(*) FILTER (WHERE health_check_next_at <= now()) AS due,
       count(*) FILTER (WHERE health_check_lease_until > now()) AS leased
FROM tools;

SELECT count(*) FILTER (WHERE metrics_next_at <= now()) AS due,
       count(*) FILTER (WHERE metrics_lease_until > now()) AS leased
FROM packages;

SELECT count(*) AS dirty_quality_rows
FROM tools t JOIN packages p ON p.id = t.package_id
WHERE t.quality_metrics_version < p.metrics_version;
```

Correctness is checked against source rows after deployment. A projection
reconciliation is a diagnostic, not a recurring cron job.
