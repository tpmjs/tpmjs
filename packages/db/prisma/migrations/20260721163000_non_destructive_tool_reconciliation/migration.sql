-- Preserve tool identity and evidence across package releases.
--
-- Removed/renamed exports used to be DELETEd by package sync, cascading into
-- health checks, simulations, ratings, collection membership, and agent
-- configuration. Tools now move between active/retired lifecycle states while
-- registry counters continue to describe only the installable surface.

ALTER TABLE tools
  ADD COLUMN is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN last_seen_version varchar(50),
  ADD COLUMN retired_at timestamp(3);

UPDATE tools AS t
SET last_seen_version = p.npm_version
FROM packages AS p
WHERE p.id = t.package_id;

CREATE INDEX tools_is_active_idx ON tools(is_active);
CREATE INDEX tools_package_id_is_active_idx ON tools(package_id, is_active);

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
  old_active boolean := false;
  new_active boolean := false;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    SELECT category,is_official INTO old_category,old_official FROM packages WHERE id=OLD.package_id;
    old_import := COALESCE(OLD.import_health::text,'UNKNOWN');
    old_execution := COALESCE(OLD.execution_health::text,'UNKNOWN');
    old_active := OLD.is_active;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    SELECT category,is_official INTO new_category,new_official FROM packages WHERE id=NEW.package_id;
    new_import := COALESCE(NEW.import_health::text,'UNKNOWN');
    new_execution := COALESCE(NEW.execution_health::text,'UNKNOWN');
    new_active := NEW.is_active;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT new_active THEN RETURN NEW; END IF;
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
    IF NOT old_active THEN RETURN OLD; END IF;
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

  IF old_active IS DISTINCT FROM new_active THEN
    IF old_active THEN
      PERFORM tpmjs_counter_add('total_tools','',-1);
      PERFORM tpmjs_counter_add('package_tools',OLD.package_id,-1);
      PERFORM tpmjs_counter_add('category_tools',old_category,-1);
      PERFORM tpmjs_counter_add('official_tools','',CASE WHEN old_official THEN -1 ELSE 0 END);
      PERFORM tpmjs_counter_add('tools_with_schema','',CASE WHEN OLD.schema_source='extracted' THEN -1 ELSE 0 END);
      PERFORM tpmjs_counter_add('import_health',old_import,-1);
      PERFORM tpmjs_counter_add('execution_health',old_execution,-1);
      PERFORM tpmjs_counter_add('quality_bucket',tpmjs_quality_bucket(OLD.quality_score),-1);
    ELSE
      PERFORM tpmjs_counter_add('total_tools','',1);
      PERFORM tpmjs_counter_add('package_tools',NEW.package_id,1);
      PERFORM tpmjs_counter_add('category_tools',new_category,1);
      PERFORM tpmjs_counter_add('official_tools','',CASE WHEN new_official THEN 1 ELSE 0 END);
      PERFORM tpmjs_counter_add('tools_with_schema','',CASE WHEN NEW.schema_source='extracted' THEN 1 ELSE 0 END);
      PERFORM tpmjs_counter_add('import_health',new_import,1);
      PERFORM tpmjs_counter_add('execution_health',new_execution,1);
      PERFORM tpmjs_counter_add('quality_bucket',tpmjs_quality_bucket(NEW.quality_score),1);
    END IF;
    RETURN NEW;
  END IF;

  -- Retired evidence remains mutable/restorable without changing the active
  -- registry projection.
  IF NOT new_active THEN RETURN NEW; END IF;

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

CREATE OR REPLACE FUNCTION tpmjs_reconcile_counters()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  LOCK TABLE packages, tools, collections, agents, simulations IN SHARE MODE;

  DELETE FROM registry_counters;

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT metric, dimension, value, CURRENT_TIMESTAMP
  FROM (
    SELECT 'total_packages'::text AS metric, ''::text AS dimension, count(*)::bigint AS value FROM packages
    UNION ALL SELECT 'official_packages', '', count(*) FROM packages WHERE is_official
    UNION ALL SELECT 'total_tools', '', count(*) FROM tools WHERE is_active
    UNION ALL SELECT 'official_tools', '', count(*) FROM tools t JOIN packages p ON p.id = t.package_id WHERE t.is_active AND p.is_official
    UNION ALL SELECT 'tools_with_schema', '', count(*) FROM tools WHERE is_active AND schema_source = 'extracted'
    UNION ALL SELECT 'total_npm_downloads', '', COALESCE(sum(npm_downloads_last_month), 0) FROM packages
    UNION ALL SELECT 'total_github_stars', '', COALESCE(sum(github_stars), 0) FROM packages
    UNION ALL SELECT 'public_collections', '', count(*) FROM collections WHERE is_public
    UNION ALL SELECT 'public_agents', '', count(*) FROM agents WHERE is_public
    UNION ALL SELECT 'total_simulations', '', count(*) FROM simulations
  ) fixed;

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT 'tier_packages', tier, count(*), CURRENT_TIMESTAMP FROM packages GROUP BY tier;

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT 'package_tools', package_id, count(*), CURRENT_TIMESTAMP
  FROM tools WHERE is_active GROUP BY package_id;

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT 'category_tools', COALESCE(p.category, ''), count(*), CURRENT_TIMESTAMP
  FROM tools t JOIN packages p ON p.id = t.package_id
  WHERE t.is_active GROUP BY p.category;

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT 'import_health', COALESCE(import_health::text, 'UNKNOWN'), count(*), CURRENT_TIMESTAMP
  FROM tools WHERE is_active GROUP BY COALESCE(import_health::text, 'UNKNOWN');

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT 'execution_health', COALESCE(execution_health::text, 'UNKNOWN'), count(*), CURRENT_TIMESTAMP
  FROM tools WHERE is_active GROUP BY COALESCE(execution_health::text, 'UNKNOWN');

  INSERT INTO registry_counters(metric, dimension, value, updated_at)
  SELECT 'quality_bucket', tpmjs_quality_bucket(quality_score), count(*), CURRENT_TIMESTAMP
  FROM tools WHERE is_active GROUP BY tpmjs_quality_bucket(quality_score);
END;
$$;

SELECT tpmjs_reconcile_counters();
