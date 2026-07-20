-- Persist the validated, author-owned health-check contract for each tool.
-- Additive and nullable: existing tools retain their current behavior until
-- their package metadata declares a contract and is synchronized.
ALTER TABLE "tools"
ADD COLUMN "health_check_config" JSONB;
