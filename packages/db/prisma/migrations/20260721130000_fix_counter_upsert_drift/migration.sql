-- Make registry-counter projections safe for PostgreSQL upserts.
--
-- Row-level BEFORE INSERT triggers run before ON CONFLICT arbitration. The
-- previous triggers therefore counted every Prisma upsert as an INSERT even
-- when PostgreSQL ultimately updated the existing package or tool. AFTER row
-- triggers observe only the operation that actually happened.

DROP TRIGGER IF EXISTS tpmjs_package_counters ON packages;
CREATE TRIGGER tpmjs_package_counters
AFTER INSERT OR UPDATE OR DELETE ON packages
FOR EACH ROW EXECUTE FUNCTION tpmjs_count_package();

DROP TRIGGER IF EXISTS tpmjs_tool_counters ON tools;
CREATE TRIGGER tpmjs_tool_counters
AFTER INSERT OR UPDATE OR DELETE ON tools
FOR EACH ROW EXECUTE FUNCTION tpmjs_count_tool();

DROP TRIGGER IF EXISTS tpmjs_collection_counter ON collections;
CREATE TRIGGER tpmjs_collection_counter
AFTER INSERT OR UPDATE OR DELETE ON collections
FOR EACH ROW EXECUTE FUNCTION tpmjs_count_collection();

DROP TRIGGER IF EXISTS tpmjs_agent_counter ON agents;
CREATE TRIGGER tpmjs_agent_counter
AFTER INSERT OR UPDATE OR DELETE ON agents
FOR EACH ROW EXECUTE FUNCTION tpmjs_count_agent();

DROP TRIGGER IF EXISTS tpmjs_simulation_counter ON simulations;
CREATE TRIGGER tpmjs_simulation_counter
AFTER INSERT OR DELETE ON simulations
FOR EACH ROW EXECUTE FUNCTION tpmjs_count_simulation();

-- Counter underflow is an invariant violation. Clamping it to zero hid a lost
-- decrement and made every later increment permanently wrong; fail the source
-- transaction instead so drift cannot silently become durable state.
CREATE OR REPLACE FUNCTION tpmjs_counter_add(
  p_metric text,
  p_dimension text,
  p_delta bigint
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_delta = 0 THEN RETURN; END IF;

  IF p_delta < 0 THEN
    UPDATE registry_counters
    SET value = value + p_delta,
        updated_at = CURRENT_TIMESTAMP
    WHERE metric = p_metric
      AND dimension = COALESCE(p_dimension, '');

    IF NOT FOUND THEN
      RAISE EXCEPTION 'cannot decrement missing registry counter (% / %) by %',
        p_metric, COALESCE(p_dimension, ''), p_delta;
    END IF;
  ELSE
    INSERT INTO registry_counters(metric, dimension, value, updated_at)
    VALUES (p_metric, COALESCE(p_dimension, ''), p_delta, CURRENT_TIMESTAMP)
    ON CONFLICT (metric, dimension) DO UPDATE
    SET value = registry_counters.value + EXCLUDED.value,
        updated_at = CURRENT_TIMESTAMP;
  END IF;
END;
$$;

-- Replace every projection row from one locked source snapshot. Taking source
-- locks before touching the projection avoids losing a concurrent write
-- between DELETE and re-seed. This is a repair/audit path; normal writes stay
-- O(1) through the triggers above.
CREATE OR REPLACE FUNCTION tpmjs_reconcile_counters()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Keep the lock order identical to trigger write dependencies: package
  -- mutations can update package + tool dimensions, while tool mutations only
  -- touch their own projection. A single deterministic order avoids deadlocks
  -- if this audit overlaps application traffic.
  LOCK TABLE packages, tools, collections, agents, simulations IN SHARE MODE;

  DELETE FROM registry_counters;

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT metric, dimension, value, CURRENT_TIMESTAMP
  FROM (
    SELECT 'total_packages'::text AS metric, ''::text AS dimension, count(*)::bigint AS value FROM packages
    UNION ALL SELECT 'official_packages', '', count(*) FROM packages WHERE is_official
    UNION ALL SELECT 'total_tools', '', count(*) FROM tools
    UNION ALL SELECT 'official_tools', '', count(*) FROM tools t JOIN packages p ON p.id = t.package_id WHERE p.is_official
    UNION ALL SELECT 'tools_with_schema', '', count(*) FROM tools WHERE schema_source = 'extracted'
    UNION ALL SELECT 'total_npm_downloads', '', COALESCE(sum(npm_downloads_last_month), 0) FROM packages
    UNION ALL SELECT 'total_github_stars', '', COALESCE(sum(github_stars), 0) FROM packages
    UNION ALL SELECT 'public_collections', '', count(*) FROM collections WHERE is_public
    UNION ALL SELECT 'public_agents', '', count(*) FROM agents WHERE is_public
    UNION ALL SELECT 'total_simulations', '', count(*) FROM simulations
  ) fixed;

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT 'tier_packages', tier, count(*), CURRENT_TIMESTAMP
  FROM packages
  GROUP BY tier;

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT 'package_tools', package_id, count(*), CURRENT_TIMESTAMP
  FROM tools
  GROUP BY package_id;

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT 'category_tools', COALESCE(p.category, ''), count(*), CURRENT_TIMESTAMP
  FROM tools t
  JOIN packages p ON p.id = t.package_id
  GROUP BY p.category;

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT 'import_health', COALESCE(import_health::text, 'UNKNOWN'), count(*), CURRENT_TIMESTAMP
  FROM tools
  GROUP BY COALESCE(import_health::text, 'UNKNOWN');

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT 'execution_health', COALESCE(execution_health::text, 'UNKNOWN'), count(*), CURRENT_TIMESTAMP
  FROM tools
  GROUP BY COALESCE(execution_health::text, 'UNKNOWN');

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT 'quality_bucket', tpmjs_quality_bucket(quality_score), count(*), CURRENT_TIMESTAMP
  FROM tools
  GROUP BY tpmjs_quality_bucket(quality_score);
END;
$$;

-- First restore the projection exactly, including the metrics omitted by the
-- earlier partial reconciler, then make future underflow impossible to hide.
SELECT tpmjs_reconcile_counters();

ALTER TABLE registry_counters
ADD CONSTRAINT registry_counters_value_nonnegative CHECK (value >= 0);

-- Repair the two daily snapshots written while the broken triggers were live.
-- This is intentionally guarded by the known-good 2026-07-19 bookend, the
-- unchanged source population, and the inflated-total signature. Downloads,
-- stars, and the real quality buckets remain untouched because they legitimately
-- vary over time; only the synthetic unscored excess is removed.
WITH actual AS (
  SELECT
    (SELECT count(*)::integer FROM packages) AS total_packages,
    (SELECT count(*)::integer FROM packages WHERE is_official) AS official_packages,
    (SELECT count(*)::integer FROM tools) AS total_tools,
    (
      SELECT count(*)::integer
      FROM tools t
      JOIN packages p ON p.id = t.package_id
      WHERE p.is_official
    ) AS official_tools,
    (SELECT count(*)::integer FROM packages WHERE tier = 'minimal') AS tiers_minimal,
    (SELECT count(*)::integer FROM packages WHERE tier = 'rich') AS tiers_rich
),
category_counts AS (
  SELECT p.category, count(*)::integer AS value
  FROM tools t
  JOIN packages p ON p.id = t.package_id
  GROUP BY p.category
),
current_categories AS (
  SELECT COALESCE(jsonb_object_agg(category, value ORDER BY category), '{}'::jsonb) AS value
  FROM category_counts
)
UPDATE stats_snapshots s
SET total_packages = a.total_packages,
    official_packages = a.official_packages,
    total_tools = a.total_tools,
    official_tools = a.official_tools,
    tiers_minimal = a.tiers_minimal,
    tiers_rich = a.tiers_rich,
    categories = categories.value,
    import_unknown = GREATEST(a.total_tools - s.import_healthy - s.import_broken, 0),
    execution_unknown = GREATEST(
      a.total_tools - s.execution_healthy - s.execution_broken,
      0
    ),
    quality_distribution = (
      SELECT CASE
        WHEN a.total_tools > q.non_unscored THEN
          jsonb_set(
            COALESCE(s.quality_distribution, '{}'::jsonb) - 'unscored',
            '{unscored}',
            to_jsonb(a.total_tools - q.non_unscored),
            true
          )
        ELSE COALESCE(s.quality_distribution, '{}'::jsonb) - 'unscored'
      END
      FROM (
        SELECT COALESCE(sum(value::integer), 0)::integer AS non_unscored
        FROM jsonb_each_text(COALESCE(s.quality_distribution, '{}'::jsonb))
        WHERE key <> 'unscored'
      ) q
    )
FROM actual a
CROSS JOIN current_categories categories
WHERE s.date BETWEEN DATE '2026-07-20' AND DATE '2026-07-21'
  AND s.total_packages > a.total_packages
  AND s.total_tools > a.total_tools
  AND NOT EXISTS (
    SELECT 1 FROM packages WHERE created_at >= TIMESTAMP '2026-07-18 00:00:00'
  )
  AND NOT EXISTS (
    SELECT 1 FROM tools WHERE created_at >= TIMESTAMP '2026-07-18 00:00:00'
  )
  AND EXISTS (
    SELECT 1
    FROM stats_snapshots good
    WHERE good.date = DATE '2026-07-19'
      AND good.total_packages = a.total_packages
      AND good.official_packages = a.official_packages
      AND good.total_tools = a.total_tools
      AND good.official_tools = a.official_tools
      AND good.tiers_minimal = a.tiers_minimal
      AND good.tiers_rich = a.tiers_rich
      AND (
        SELECT COALESCE(jsonb_object_agg(entry.key, entry.value ORDER BY entry.key), '{}'::jsonb)
        FROM jsonb_each(COALESCE(good.categories, '{}'::jsonb)) entry
        WHERE (entry.value #>> '{}')::integer > 0
      ) = categories.value
  );
