-- Persist the trailing import-failure streak so default discovery can exclude
-- repeatedly broken tools without replaying the health audit ledger per query.
ALTER TABLE "tools"
ADD COLUMN "consecutive_import_failures" INTEGER NOT NULL DEFAULT 0;

-- Backfill from the evidence ledger. UNKNOWN checks are deliberately ignored:
-- they represent inconclusive infrastructure failures and neither confirm nor
-- break a definitive import-failure streak.
WITH latest_healthy AS (
  SELECT "tool_id", MAX("created_at") AS "last_healthy_at"
  FROM "health_checks"
  WHERE "import_status" = 'HEALTHY'
  GROUP BY "tool_id"
), trailing_broken AS (
  SELECT h."tool_id", COUNT(*)::INTEGER AS "failure_count"
  FROM "health_checks" h
  LEFT JOIN latest_healthy healthy ON healthy."tool_id" = h."tool_id"
  WHERE h."import_status" = 'BROKEN'
    AND h."created_at" > COALESCE(healthy."last_healthy_at", '-infinity'::timestamp)
  GROUP BY h."tool_id"
)
UPDATE "tools" tool
SET "consecutive_import_failures" = streak."failure_count"
FROM trailing_broken streak
WHERE tool."id" = streak."tool_id"
  AND tool."import_health" = 'BROKEN';

CREATE INDEX "tools_consecutive_import_failures_idx"
ON "tools"("consecutive_import_failures");
