-- Replace whole-registry timer sweeps with due-time leases and transactional
-- read-model counters. All changes are additive; no source or history row is
-- deleted or rewritten.

ALTER TABLE "packages"
  ADD COLUMN "metrics_next_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "metrics_lease_until" TIMESTAMP(3),
  ADD COLUMN "metrics_leased_by" VARCHAR(100),
  ADD COLUMN "metrics_version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "tools"
  ADD COLUMN "health_check_next_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "health_check_lease_until" TIMESTAMP(3),
  ADD COLUMN "health_check_leased_by" VARCHAR(100),
  ADD COLUMN "quality_metrics_version" INTEGER NOT NULL DEFAULT 0;

-- Preserve the meaning of the existing last check while distributing already
-- healthy rows over their normal seven-day refresh window. Never-checked tools
-- are immediately eligible.
UPDATE "tools"
SET "health_check_next_at" = COALESCE("last_health_check" + INTERVAL '7 days', CURRENT_TIMESTAMP);

CREATE INDEX "packages_metrics_next_at_id_idx"
  ON "packages"("metrics_next_at", "id");
CREATE INDEX "tools_health_check_next_at_id_idx"
  ON "tools"("health_check_next_at", "id");
CREATE INDEX "tools_quality_metrics_version_id_idx"
  ON "tools"("quality_metrics_version", "id");

-- Denormalized view counters are projections, not batch-maintained sources of
-- truth. These triggers apply the exact delta in the same transaction as each
-- durable event, eliminating daily all-history GROUP BY + row-at-a-time updates.
CREATE OR REPLACE FUNCTION tpmjs_apply_page_view_delta()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  delta integer;
  target_type text;
  target_id text;
BEGIN
  delta := CASE
    WHEN TG_OP = 'INSERT' THEN NEW.view_count
    WHEN TG_OP = 'DELETE' THEN -OLD.view_count
    ELSE NEW.view_count - OLD.view_count
  END;
  target_type := CASE WHEN TG_OP = 'DELETE' THEN OLD.entity_type ELSE NEW.entity_type END;
  target_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.entity_id ELSE NEW.entity_id END;

  IF delta = 0 THEN
    RETURN NEW;
  END IF;

  IF target_type = 'tool' THEN
    UPDATE tools SET view_count = GREATEST(0, view_count + delta) WHERE id = target_id;
  ELSIF target_type = 'collection' THEN
    UPDATE collections SET view_count = GREATEST(0, view_count + delta) WHERE id = target_id;
  ELSIF target_type = 'agent' THEN
    UPDATE agents SET view_count = GREATEST(0, view_count + delta) WHERE id = target_id;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER tpmjs_page_view_delta
AFTER INSERT OR DELETE OR UPDATE OF view_count ON page_views
FOR EACH ROW EXECUTE FUNCTION tpmjs_apply_page_view_delta();

CREATE OR REPLACE FUNCTION tpmjs_apply_execution_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_tool text;
  target_collection text;
  target_agent text;
  delta integer;
BEGIN
  target_tool := CASE WHEN TG_OP = 'DELETE' THEN OLD.tool_id ELSE NEW.tool_id END;
  target_collection := CASE WHEN TG_OP = 'DELETE' THEN OLD.collection_id ELSE NEW.collection_id END;
  target_agent := CASE WHEN TG_OP = 'DELETE' THEN OLD.agent_id ELSE NEW.agent_id END;
  delta := CASE WHEN TG_OP = 'DELETE' THEN -1 ELSE 1 END;

  IF target_tool IS NOT NULL THEN
    UPDATE tools SET execution_count = GREATEST(0, execution_count + delta) WHERE id = target_tool;
  END IF;
  IF target_collection IS NOT NULL THEN
    UPDATE collections SET execution_count = GREATEST(0, execution_count + delta) WHERE id = target_collection;
  END IF;
  IF target_agent IS NOT NULL THEN
    UPDATE agents SET execution_count = GREATEST(0, execution_count + delta) WHERE id = target_agent;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER tpmjs_execution_event_count
AFTER INSERT OR DELETE ON execution_events
FOR EACH ROW EXECUTE FUNCTION tpmjs_apply_execution_event();

CREATE OR REPLACE FUNCTION tpmjs_apply_conversation_delta()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE agents SET conversation_count = conversation_count + 1 WHERE id = NEW.agent_id;
    RETURN NEW;
  END IF;
  UPDATE agents SET conversation_count = GREATEST(0, conversation_count - 1) WHERE id = OLD.agent_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER tpmjs_conversation_count
AFTER INSERT OR DELETE ON conversations
FOR EACH ROW EXECUTE FUNCTION tpmjs_apply_conversation_delta();

CREATE OR REPLACE FUNCTION tpmjs_apply_message_delta()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  owning_agent text;
BEGIN
  SELECT agent_id INTO owning_agent
  FROM conversations
  WHERE id = CASE WHEN TG_OP = 'INSERT' THEN NEW.conversation_id ELSE OLD.conversation_id END;

  IF owning_agent IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE agents SET message_count = message_count + 1 WHERE id = owning_agent;
    ELSE
      UPDATE agents SET message_count = GREATEST(0, message_count - 1) WHERE id = owning_agent;
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'INSERT' THEN NEW ELSE OLD END;
END;
$$;

CREATE TRIGGER tpmjs_message_count
AFTER INSERT OR DELETE ON messages
FOR EACH ROW EXECUTE FUNCTION tpmjs_apply_message_delta();

-- Registry totals and low-cardinality distributions are updated at write time.
-- The internal package_tools dimension lets a package category/official flag
-- move all of its exported tools between counters in O(1), without scanning
-- that package's tools.
CREATE TABLE registry_counters (
  metric VARCHAR(50) NOT NULL,
  dimension VARCHAR(214) NOT NULL DEFAULT '',
  value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT registry_counters_pkey PRIMARY KEY (metric, dimension)
);
CREATE INDEX registry_counters_metric_value_idx ON registry_counters(metric, value);

CREATE OR REPLACE FUNCTION tpmjs_counter_add(p_metric text, p_dimension text, p_delta bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_delta = 0 THEN RETURN; END IF;
  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  VALUES (p_metric, COALESCE(p_dimension, ''), GREATEST(0, p_delta), CURRENT_TIMESTAMP)
  ON CONFLICT (metric, dimension) DO UPDATE
  SET value = GREATEST(0, registry_counters.value + p_delta),
      updated_at = CURRENT_TIMESTAMP;
END;
$$;

CREATE OR REPLACE FUNCTION tpmjs_quality_bucket(p_score numeric)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_score IS NULL THEN 'unscored'
    WHEN p_score < 0.3 THEN 'low'
    WHEN p_score < 0.5 THEN 'medium-low'
    WHEN p_score < 0.7 THEN 'medium'
    WHEN p_score < 0.9 THEN 'high'
    ELSE 'excellent'
  END
$$;

-- Seed the counter projection once from the small current production tables.
INSERT INTO registry_counters(metric, dimension, value)
SELECT 'total_packages', '', count(*) FROM packages
UNION ALL SELECT 'official_packages', '', count(*) FROM packages WHERE is_official
UNION ALL SELECT 'total_tools', '', count(*) FROM tools
UNION ALL SELECT 'official_tools', '', count(*) FROM tools t JOIN packages p ON p.id=t.package_id WHERE p.is_official
UNION ALL SELECT 'tools_with_schema', '', count(*) FROM tools WHERE schema_source='extracted'
UNION ALL SELECT 'total_npm_downloads', '', COALESCE(sum(npm_downloads_last_month),0) FROM packages
UNION ALL SELECT 'total_github_stars', '', COALESCE(sum(github_stars),0) FROM packages
UNION ALL SELECT 'public_collections', '', count(*) FROM collections WHERE is_public
UNION ALL SELECT 'public_agents', '', count(*) FROM agents WHERE is_public
UNION ALL SELECT 'total_simulations', '', count(*) FROM simulations;

INSERT INTO registry_counters(metric, dimension, value)
SELECT 'tier_packages', tier, count(*) FROM packages GROUP BY tier
UNION ALL SELECT 'package_tools', package_id, count(*) FROM tools GROUP BY package_id
UNION ALL SELECT 'category_tools', p.category, count(*) FROM tools t JOIN packages p ON p.id=t.package_id GROUP BY p.category
UNION ALL SELECT 'import_health', COALESCE(import_health::text,'UNKNOWN'), count(*) FROM tools GROUP BY COALESCE(import_health::text,'UNKNOWN')
UNION ALL SELECT 'execution_health', COALESCE(execution_health::text,'UNKNOWN'), count(*) FROM tools GROUP BY COALESCE(execution_health::text,'UNKNOWN')
UNION ALL SELECT 'quality_bucket', tpmjs_quality_bucket(quality_score), count(*) FROM tools GROUP BY tpmjs_quality_bucket(quality_score);

CREATE OR REPLACE FUNCTION tpmjs_count_package()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  tool_total bigint := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM tpmjs_counter_add('total_packages', '', 1);
    PERFORM tpmjs_counter_add('official_packages', '', CASE WHEN NEW.is_official THEN 1 ELSE 0 END);
    PERFORM tpmjs_counter_add('tier_packages', NEW.tier, 1);
    PERFORM tpmjs_counter_add('total_npm_downloads', '', COALESCE(NEW.npm_downloads_last_month,0));
    PERFORM tpmjs_counter_add('total_github_stars', '', COALESCE(NEW.github_stars,0));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT value INTO tool_total FROM registry_counters
    WHERE metric='package_tools' AND dimension=OLD.id;
    tool_total := COALESCE(tool_total, 0);
    PERFORM tpmjs_counter_add('total_packages', '', -1);
    PERFORM tpmjs_counter_add('official_packages', '', CASE WHEN OLD.is_official THEN -1 ELSE 0 END);
    PERFORM tpmjs_counter_add('tier_packages', OLD.tier, -1);
    PERFORM tpmjs_counter_add('total_npm_downloads', '', -COALESCE(OLD.npm_downloads_last_month,0));
    PERFORM tpmjs_counter_add('total_github_stars', '', -COALESCE(OLD.github_stars,0));
    -- Cascade-deleted tools can no longer resolve their parent row. Account
    -- for parent-derived dimensions here; their own trigger still maintains
    -- tool-local health/schema/quality totals.
    PERFORM tpmjs_counter_add('package_tools', OLD.id, -tool_total);
    PERFORM tpmjs_counter_add('category_tools', OLD.category, -tool_total);
    PERFORM tpmjs_counter_add('official_tools', '', CASE WHEN OLD.is_official THEN -tool_total ELSE 0 END);
    RETURN OLD;
  END IF;

  SELECT value INTO tool_total FROM registry_counters
  WHERE metric='package_tools' AND dimension=NEW.id;
  tool_total := COALESCE(tool_total, 0);

  IF OLD.is_official IS DISTINCT FROM NEW.is_official THEN
    PERFORM tpmjs_counter_add('official_packages', '', CASE WHEN NEW.is_official THEN 1 ELSE -1 END);
    PERFORM tpmjs_counter_add('official_tools', '', CASE WHEN NEW.is_official THEN tool_total ELSE -tool_total END);
  END IF;
  IF OLD.tier IS DISTINCT FROM NEW.tier THEN
    PERFORM tpmjs_counter_add('tier_packages', OLD.tier, -1);
    PERFORM tpmjs_counter_add('tier_packages', NEW.tier, 1);
  END IF;
  IF OLD.category IS DISTINCT FROM NEW.category THEN
    PERFORM tpmjs_counter_add('category_tools', OLD.category, -tool_total);
    PERFORM tpmjs_counter_add('category_tools', NEW.category, tool_total);
  END IF;
  PERFORM tpmjs_counter_add('total_npm_downloads', '', COALESCE(NEW.npm_downloads_last_month,0)::bigint - COALESCE(OLD.npm_downloads_last_month,0)::bigint);
  PERFORM tpmjs_counter_add('total_github_stars', '', COALESCE(NEW.github_stars,0)::bigint - COALESCE(OLD.github_stars,0)::bigint);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tpmjs_package_counters
BEFORE INSERT OR UPDATE OR DELETE ON packages
FOR EACH ROW EXECUTE FUNCTION tpmjs_count_package();

CREATE OR REPLACE FUNCTION tpmjs_count_tool()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  old_category text;
  new_category text;
  old_official boolean := false;
  new_official boolean := false;
  old_import text;
  new_import text;
  old_execution text;
  new_execution text;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    SELECT category,is_official INTO old_category,old_official FROM packages WHERE id=OLD.package_id;
    old_import := COALESCE(OLD.import_health::text,'UNKNOWN');
    old_execution := COALESCE(OLD.execution_health::text,'UNKNOWN');
  END IF;
  IF TG_OP <> 'DELETE' THEN
    SELECT category,is_official INTO new_category,new_official FROM packages WHERE id=NEW.package_id;
    new_import := COALESCE(NEW.import_health::text,'UNKNOWN');
    new_execution := COALESCE(NEW.execution_health::text,'UNKNOWN');
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM tpmjs_counter_add('total_tools','',1);
    PERFORM tpmjs_counter_add('package_tools',NEW.package_id,1);
    PERFORM tpmjs_counter_add('category_tools',new_category,1);
    PERFORM tpmjs_counter_add('official_tools','',CASE WHEN new_official THEN 1 ELSE 0 END);
    PERFORM tpmjs_counter_add('tools_with_schema','',CASE WHEN NEW.schema_source='extracted' THEN 1 ELSE 0 END);
    PERFORM tpmjs_counter_add('import_health',new_import,1);
    PERFORM tpmjs_counter_add('execution_health',new_execution,1);
    PERFORM tpmjs_counter_add('quality_bucket',tpmjs_quality_bucket(NEW.quality_score),1);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM tpmjs_counter_add('total_tools','',-1);
    IF old_category IS NOT NULL THEN
      PERFORM tpmjs_counter_add('package_tools',OLD.package_id,-1);
      PERFORM tpmjs_counter_add('category_tools',old_category,-1);
      PERFORM tpmjs_counter_add('official_tools','',CASE WHEN old_official THEN -1 ELSE 0 END);
    END IF;
    PERFORM tpmjs_counter_add('tools_with_schema','',CASE WHEN OLD.schema_source='extracted' THEN -1 ELSE 0 END);
    PERFORM tpmjs_counter_add('import_health',old_import,-1);
    PERFORM tpmjs_counter_add('execution_health',old_execution,-1);
    PERFORM tpmjs_counter_add('quality_bucket',tpmjs_quality_bucket(OLD.quality_score),-1);
    RETURN OLD;
  END IF;

  IF OLD.package_id IS DISTINCT FROM NEW.package_id THEN
    PERFORM tpmjs_counter_add('package_tools',OLD.package_id,-1);
    PERFORM tpmjs_counter_add('package_tools',NEW.package_id,1);
    PERFORM tpmjs_counter_add('category_tools',old_category,-1);
    PERFORM tpmjs_counter_add('category_tools',new_category,1);
    PERFORM tpmjs_counter_add('official_tools','',CASE WHEN old_official THEN -1 ELSE 0 END + CASE WHEN new_official THEN 1 ELSE 0 END);
  END IF;
  IF OLD.schema_source IS DISTINCT FROM NEW.schema_source THEN
    PERFORM tpmjs_counter_add('tools_with_schema','',CASE WHEN OLD.schema_source='extracted' THEN -1 ELSE 0 END + CASE WHEN NEW.schema_source='extracted' THEN 1 ELSE 0 END);
  END IF;
  IF old_import IS DISTINCT FROM new_import THEN
    PERFORM tpmjs_counter_add('import_health',old_import,-1);
    PERFORM tpmjs_counter_add('import_health',new_import,1);
  END IF;
  IF old_execution IS DISTINCT FROM new_execution THEN
    PERFORM tpmjs_counter_add('execution_health',old_execution,-1);
    PERFORM tpmjs_counter_add('execution_health',new_execution,1);
  END IF;
  IF tpmjs_quality_bucket(OLD.quality_score) IS DISTINCT FROM tpmjs_quality_bucket(NEW.quality_score) THEN
    PERFORM tpmjs_counter_add('quality_bucket',tpmjs_quality_bucket(OLD.quality_score),-1);
    PERFORM tpmjs_counter_add('quality_bucket',tpmjs_quality_bucket(NEW.quality_score),1);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tpmjs_tool_counters
BEFORE INSERT OR UPDATE OR DELETE ON tools
FOR EACH ROW EXECUTE FUNCTION tpmjs_count_tool();

CREATE OR REPLACE FUNCTION tpmjs_count_collection()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM tpmjs_counter_add('public_collections','',CASE WHEN NEW.is_public THEN 1 ELSE 0 END);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM tpmjs_counter_add('public_collections','',CASE WHEN OLD.is_public THEN -1 ELSE 0 END);
    RETURN OLD;
  END IF;
  IF OLD.is_public IS DISTINCT FROM NEW.is_public THEN
    PERFORM tpmjs_counter_add('public_collections','',CASE WHEN NEW.is_public THEN 1 ELSE -1 END);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tpmjs_collection_counter
BEFORE INSERT OR UPDATE OR DELETE ON collections
FOR EACH ROW EXECUTE FUNCTION tpmjs_count_collection();

CREATE OR REPLACE FUNCTION tpmjs_count_agent()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM tpmjs_counter_add('public_agents','',CASE WHEN NEW.is_public THEN 1 ELSE 0 END);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM tpmjs_counter_add('public_agents','',CASE WHEN OLD.is_public THEN -1 ELSE 0 END);
    RETURN OLD;
  END IF;
  IF OLD.is_public IS DISTINCT FROM NEW.is_public THEN
    PERFORM tpmjs_counter_add('public_agents','',CASE WHEN NEW.is_public THEN 1 ELSE -1 END);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tpmjs_agent_counter
BEFORE INSERT OR UPDATE OR DELETE ON agents
FOR EACH ROW EXECUTE FUNCTION tpmjs_count_agent();

CREATE OR REPLACE FUNCTION tpmjs_count_simulation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM tpmjs_counter_add('total_simulations','',CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END);
  RETURN CASE WHEN TG_OP = 'INSERT' THEN NEW ELSE OLD END;
END;
$$;

CREATE TRIGGER tpmjs_simulation_counter
BEFORE INSERT OR DELETE ON simulations
FOR EACH ROW EXECUTE FUNCTION tpmjs_count_simulation();

-- Prisma's @updatedAt supplies this value on direct client writes; trigger and
-- helper paths set it explicitly. Match the datamodel after the seed phase.
ALTER TABLE registry_counters ALTER COLUMN updated_at DROP DEFAULT;

-- One-time exact reconciliation before future writes become incremental. These
-- are bounded by today's small production tables and run once under migration,
-- never from a recurring request path.
UPDATE tools t
SET view_count = COALESCE(v.n, 0)
FROM (
  SELECT target.id, COALESCE(SUM(pv.view_count), 0)::integer AS n
  FROM tools target
  LEFT JOIN page_views pv ON pv.entity_type = 'tool' AND pv.entity_id = target.id
  GROUP BY target.id
) v
WHERE t.id = v.id;

UPDATE collections c
SET view_count = COALESCE(v.n, 0)
FROM (
  SELECT target.id, COALESCE(SUM(pv.view_count), 0)::integer AS n
  FROM collections target
  LEFT JOIN page_views pv ON pv.entity_type = 'collection' AND pv.entity_id = target.id
  GROUP BY target.id
) v
WHERE c.id = v.id;

UPDATE agents a
SET view_count = COALESCE(v.n, 0)
FROM (
  SELECT target.id, COALESCE(SUM(pv.view_count), 0)::integer AS n
  FROM agents target
  LEFT JOIN page_views pv ON pv.entity_type = 'agent' AND pv.entity_id = target.id
  GROUP BY target.id
) v
WHERE a.id = v.id;

UPDATE tools t
SET execution_count = COALESCE(e.n, 0)
FROM (
  SELECT target.id, COUNT(ev.id)::integer AS n
  FROM tools target LEFT JOIN execution_events ev ON ev.tool_id = target.id
  GROUP BY target.id
) e
WHERE t.id = e.id;

UPDATE collections c
SET execution_count = COALESCE(e.n, 0)
FROM (
  SELECT target.id, COUNT(ev.id)::integer AS n
  FROM collections target LEFT JOIN execution_events ev ON ev.collection_id = target.id
  GROUP BY target.id
) e
WHERE c.id = e.id;

UPDATE agents a
SET execution_count = COALESCE(e.n, 0),
    conversation_count = COALESCE(e.conversations, 0),
    message_count = COALESCE(e.messages, 0)
FROM (
  WITH execution_totals AS (
    SELECT agent_id, COUNT(*)::integer AS n
    FROM execution_events WHERE agent_id IS NOT NULL GROUP BY agent_id
  ), conversation_totals AS (
    SELECT agent_id, COUNT(*)::integer AS n
    FROM conversations GROUP BY agent_id
  ), message_totals AS (
    SELECT c.agent_id, COUNT(m.id)::integer AS n
    FROM conversations c
    JOIN messages m ON m.conversation_id = c.id
    GROUP BY c.agent_id
  )
  SELECT target.id,
         COALESCE(ev.n, 0) AS n,
         COALESCE(cv.n, 0) AS conversations,
         COALESCE(msg.n, 0) AS messages
  FROM agents target
  LEFT JOIN execution_totals ev ON ev.agent_id = target.id
  LEFT JOIN conversation_totals cv ON cv.agent_id = target.id
  LEFT JOIN message_totals msg ON msg.agent_id = target.id
) e
WHERE a.id = e.id;
