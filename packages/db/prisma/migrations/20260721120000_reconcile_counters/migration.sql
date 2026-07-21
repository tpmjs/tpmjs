-- Registry counter reconciliation.
--
-- The trigger-maintained counters introduced in 20260719010000_bounded_maintenance
-- can drift (e.g. a sync path that bypasses the per-row DELETE trigger inflates
-- total_tools/total_packages). This function recomputes the derived counters
-- directly from the source tables — the registry tables are small, so a full
-- recount is cheap. Call it periodically (the daily stats-snapshot job does) so
-- historical stats and admin dashboards never inherit counter drift.

CREATE OR REPLACE FUNCTION tpmjs_reconcile_counters() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM registry_counters WHERE metric IN (
    'total_tools','total_packages','official_tools','official_packages',
    'tools_with_schema','import_health','execution_health','public_collections',
    'public_agents','category_tools','package_tools','quality_bucket'
  );

  INSERT INTO registry_counters(metric,dimension,value,updated_at) VALUES
    ('total_tools','',(SELECT count(*) FROM tools),now()),
    ('total_packages','',(SELECT count(*) FROM packages),now()),
    ('official_tools','',(SELECT count(*) FROM tools t JOIN packages p ON p.id=t.package_id WHERE p.is_official),now()),
    ('official_packages','',(SELECT count(*) FROM packages WHERE is_official),now()),
    ('tools_with_schema','',(SELECT count(*) FROM tools WHERE schema_source='extracted'),now()),
    ('public_collections','',(SELECT count(*) FROM collections WHERE is_public),now()),
    ('public_agents','',(SELECT count(*) FROM agents WHERE is_public),now());

  INSERT INTO registry_counters(metric,dimension,value,updated_at)
    SELECT 'import_health', import_health::text, count(*), now() FROM tools GROUP BY import_health::text;
  INSERT INTO registry_counters(metric,dimension,value,updated_at)
    SELECT 'execution_health', execution_health::text, count(*), now() FROM tools GROUP BY execution_health::text;
  INSERT INTO registry_counters(metric,dimension,value,updated_at)
    SELECT 'category_tools', COALESCE(p.category,''), count(*), now() FROM tools t JOIN packages p ON p.id=t.package_id GROUP BY p.category;
  INSERT INTO registry_counters(metric,dimension,value,updated_at)
    SELECT 'package_tools', t.package_id, count(*), now() FROM tools t GROUP BY t.package_id;
  INSERT INTO registry_counters(metric,dimension,value,updated_at)
    SELECT 'quality_bucket', tpmjs_quality_bucket(quality_score), count(*), now() FROM tools GROUP BY tpmjs_quality_bucket(quality_score);
END;
$$;
