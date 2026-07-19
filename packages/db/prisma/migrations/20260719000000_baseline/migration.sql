-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('UNKNOWN', 'HEALTHY', 'BROKEN');

-- CreateEnum
CREATE TYPE "HealthCheckType" AS ENUM ('IMPORT', 'EXECUTION', 'FULL');

-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('OPENAI', 'ANTHROPIC', 'GOOGLE', 'GROQ', 'MISTRAL');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'TOOL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('AGENT_CREATED', 'AGENT_UPDATED', 'AGENT_DELETED', 'AGENT_CLONED', 'AGENT_FORKED', 'AGENT_TOOL_ADDED', 'AGENT_TOOL_REMOVED', 'AGENT_COLLECTION_ADDED', 'AGENT_COLLECTION_REMOVED', 'COLLECTION_CREATED', 'COLLECTION_UPDATED', 'COLLECTION_DELETED', 'COLLECTION_CLONED', 'COLLECTION_FORKED', 'COLLECTION_TOOL_ADDED', 'COLLECTION_TOOL_REMOVED', 'TOOL_LIKED', 'TOOL_UNLIKED', 'COLLECTION_LIKED', 'COLLECTION_UNLIKED', 'AGENT_LIKED', 'AGENT_UNLIKED', 'COLLECTION_TOOLS_BULK_ADDED', 'API_KEY_CREATED', 'API_KEY_DELETED', 'COLLECTION_ENV_UPDATED', 'AGENT_CONFIG_UPDATED', 'BRIDGE_CONNECTED', 'BRIDGE_DISCONNECTED', 'TOOL_EXECUTED', 'AGENT_CONVERSATION_STARTED', 'WORKFLOW_CREATED', 'WORKFLOW_UPDATED', 'WORKFLOW_DELETED', 'WORKFLOW_EXECUTED');

-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkflowTriggerType" AS ENUM ('MANUAL', 'WEBHOOK', 'SCHEDULE');

-- CreateEnum
CREATE TYPE "WorkflowNodeType" AS ENUM ('TRIGGER', 'TOOL', 'AGENT', 'CONDITION', 'LOOP', 'TRANSFORM', 'OUTPUT', 'NOTE');

-- CreateEnum
CREATE TYPE "WorkflowExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowNodeExecutionStatus" AS ENUM ('NODE_PENDING', 'NODE_RUNNING', 'NODE_COMPLETED', 'NODE_FAILED', 'NODE_SKIPPED');

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "npm_package_name" VARCHAR(214) NOT NULL,
    "npm_version" VARCHAR(50) NOT NULL,
    "npm_published_at" TIMESTAMP(3) NOT NULL,
    "npm_description" TEXT,
    "npm_repository" JSONB,
    "npm_homepage" TEXT,
    "npm_license" VARCHAR(50),
    "npm_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "npm_readme" TEXT,
    "npm_author" JSONB,
    "npm_maintainers" JSONB,
    "category" VARCHAR(50) NOT NULL,
    "env" JSONB,
    "frameworks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tier" VARCHAR(20) NOT NULL,
    "discovery_method" VARCHAR(20) NOT NULL,
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "npm_downloads_last_month" INTEGER DEFAULT 0,
    "github_stars" INTEGER DEFAULT 0,
    "tool_discovery_attempt_at" TIMESTAMP(3),
    "tool_discovery_failures" INTEGER NOT NULL DEFAULT 0,
    "tool_discovery_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tools" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "parameters" JSONB,
    "returns" JSONB,
    "ai_agent" JSONB,
    "input_schema" JSONB,
    "schema_source" VARCHAR(20),
    "schema_extracted_at" TIMESTAMP(3),
    "schema_extraction_attempt_at" TIMESTAMP(3),
    "schema_extraction_error" TEXT,
    "tool_discovery_source" VARCHAR(20),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "signature" VARCHAR(500),
    "quality_score" DECIMAL(3,2),
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "import_health" "HealthStatus" DEFAULT 'UNKNOWN',
    "execution_health" "HealthStatus" DEFAULT 'UNKNOWN',
    "last_health_check" TIMESTAMP(3),
    "health_check_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(2,1),
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_checkpoints" (
    "id" TEXT NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "checkpoint" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "user_prompt" TEXT NOT NULL,
    "parameters" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "execution_time_ms" INTEGER,
    "output" JSONB,
    "error" TEXT,
    "agent_steps" INTEGER NOT NULL DEFAULT 0,
    "model" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_usage" (
    "id" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "tool_desc_tokens" INTEGER NOT NULL DEFAULT 0,
    "schema_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost" DECIMAL(10,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_logs" (
    "id" TEXT NOT NULL,
    "simulation_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" VARCHAR(20) NOT NULL,
    "event" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_checks" (
    "id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "check_type" "HealthCheckType" NOT NULL,
    "trigger_source" VARCHAR(50) NOT NULL,
    "import_status" "HealthStatus" NOT NULL,
    "import_error" TEXT,
    "import_time_ms" INTEGER,
    "execution_status" "HealthStatus" NOT NULL,
    "execution_error" TEXT,
    "execution_time_ms" INTEGER,
    "test_parameters" JSONB,
    "overall_status" "HealthStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stats_snapshots" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_tools" INTEGER NOT NULL DEFAULT 0,
    "total_packages" INTEGER NOT NULL DEFAULT 0,
    "official_tools" INTEGER NOT NULL DEFAULT 0,
    "official_packages" INTEGER NOT NULL DEFAULT 0,
    "tools_with_schema" INTEGER NOT NULL DEFAULT 0,
    "total_npm_downloads" INTEGER NOT NULL DEFAULT 0,
    "total_github_stars" INTEGER NOT NULL DEFAULT 0,
    "import_healthy" INTEGER NOT NULL DEFAULT 0,
    "import_broken" INTEGER NOT NULL DEFAULT 0,
    "import_unknown" INTEGER NOT NULL DEFAULT 0,
    "execution_healthy" INTEGER NOT NULL DEFAULT 0,
    "execution_broken" INTEGER NOT NULL DEFAULT 0,
    "execution_unknown" INTEGER NOT NULL DEFAULT 0,
    "quality_distribution" JSONB,
    "tiers_minimal" INTEGER NOT NULL DEFAULT 0,
    "tiers_rich" INTEGER NOT NULL DEFAULT 0,
    "executions_total" INTEGER NOT NULL DEFAULT 0,
    "executions_successful" INTEGER NOT NULL DEFAULT 0,
    "executions_failed" INTEGER NOT NULL DEFAULT 0,
    "executions_avg_time_ms" INTEGER,
    "tokens_input" BIGINT NOT NULL DEFAULT 0,
    "tokens_output" BIGINT NOT NULL DEFAULT 0,
    "tokens_total" BIGINT NOT NULL DEFAULT 0,
    "tokens_cost_usd" DECIMAL(10,4),
    "health_checks_run" INTEGER NOT NULL DEFAULT 0,
    "categories" JSONB,
    "active_devs_7d" INTEGER NOT NULL DEFAULT 0,
    "total_collections" INTEGER NOT NULL DEFAULT 0,
    "total_agents" INTEGER NOT NULL DEFAULT 0,
    "total_simulations" INTEGER NOT NULL DEFAULT 0,
    "event_tool_calls" INTEGER NOT NULL DEFAULT 0,
    "event_agent_runs" INTEGER NOT NULL DEFAULT 0,
    "dau_count" INTEGER NOT NULL DEFAULT 0,
    "wau_count" INTEGER NOT NULL DEFAULT 0,
    "mau_count" INTEGER NOT NULL DEFAULT 0,
    "search_count" INTEGER NOT NULL DEFAULT 0,
    "avg_search_latency_ms" INTEGER,
    "top_search_queries" JSONB,
    "mcp_unique_clients" INTEGER NOT NULL DEFAULT 0,
    "error_categories" JSONB,
    "conversation_statuses" JSONB,
    "avg_context_messages" INTEGER,
    "avg_context_tokens" INTEGER,
    "avg_available_tools" DOUBLE PRECISION,
    "total_conversations_day" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stats_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(20) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "date" DATE NOT NULL,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "username" VARCHAR(30),
    "tier" "UserTier" NOT NULL DEFAULT 'FREE',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "signup_source" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50),
    "description" VARCHAR(500),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "executor_type" VARCHAR(50),
    "executor_config" JSONB,
    "env_vars" JSONB,
    "forked_from_id" TEXT,
    "fork_count" INTEGER NOT NULL DEFAULT 0,
    "use_cases" JSONB,
    "use_cases_generated_at" TIMESTAMP(3),
    "skills_markdown" TEXT,
    "skills_generated_at" TIMESTAMP(3),
    "skills_seeded" BOOLEAN NOT NULL DEFAULT false,
    "skills_seeding_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_tools" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "note" VARCHAR(500),
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "uid" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "provider" "AIProvider" NOT NULL,
    "model_id" VARCHAR(100) NOT NULL,
    "system_prompt" TEXT,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "max_tool_calls_per_turn" INTEGER NOT NULL DEFAULT 20,
    "max_messages_in_context" INTEGER NOT NULL DEFAULT 10,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "conversation_count" INTEGER NOT NULL DEFAULT 0,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "executor_type" VARCHAR(50),
    "executor_config" JSONB,
    "sandbox_enabled" BOOLEAN NOT NULL DEFAULT false,
    "env_vars" JSONB,
    "tool_permissions" JSONB,
    "dynamic_tool_discovery" BOOLEAN NOT NULL DEFAULT false,
    "forked_from_id" TEXT,
    "fork_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_collections" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_tools" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key_name" VARCHAR(100) NOT NULL,
    "encrypted_key" TEXT NOT NULL,
    "key_iv" VARCHAR(32) NOT NULL,
    "key_hint" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_approvals" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "tool_call_id" VARCHAR(200) NOT NULL,
    "tool_name" VARCHAR(200) NOT NULL,
    "input_args" JSONB,
    "decision" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "tool_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tool_calls" JSONB,
    "tool_call_id" VARCHAR(100),
    "tool_name" VARCHAR(200),
    "tool_result" JSONB,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "available_tool_count" INTEGER,
    "available_tool_names" JSONB,
    "sequence_id" VARCHAR(36),
    "context_message_count" INTEGER,
    "context_token_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_ratings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "title" VARCHAR(200),
    "content" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "agent_id" TEXT,
    "collection_id" TEXT,
    "tool_id" TEXT,
    "target_name" VARCHAR(200) NOT NULL,
    "target_type" VARCHAR(50) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endpoint_health_reports" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "run_id" VARCHAR(100),
    "checks" JSONB NOT NULL,
    "pass_count" INTEGER NOT NULL,
    "fail_count" INTEGER NOT NULL,
    "total_checks" INTEGER NOT NULL,
    "overall_status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endpoint_health_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bridge_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'disconnected',
    "socket_id" VARCHAR(100),
    "tools" JSONB NOT NULL DEFAULT '[]',
    "last_seen" TIMESTAMP(3),
    "client_version" VARCHAR(20),
    "client_os" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bridge_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_bridge_tools" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "server_id" VARCHAR(100) NOT NULL,
    "tool_name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(100),
    "note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_bridge_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_mcp_servers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "url" TEXT NOT NULL,
    "auth_type" VARCHAR(20),
    "auth_header" VARCHAR(100),
    "auth_token" TEXT,
    "tools" JSONB NOT NULL DEFAULT '[]',
    "last_sync_at" TIMESTAMP(3),
    "last_sync_error" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_mcp_servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_custom_tools" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "tool_name" VARCHAR(200) NOT NULL,
    "display_name" VARCHAR(100),
    "note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_custom_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tpmjs_api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "key_hash" VARCHAR(64) NOT NULL,
    "key_prefix" VARCHAR(20) NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rate_limit" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tpmjs_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage_records" (
    "id" TEXT NOT NULL,
    "api_key_id" TEXT NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "resource_type" VARCHAR(50),
    "resource_id" VARCHAR(100),
    "tokens_in" INTEGER,
    "tokens_out" INTEGER,
    "model" VARCHAR(50),
    "error_code" VARCHAR(50),
    "error_message" TEXT,
    "user_agent" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage_summaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "api_key_id" TEXT,
    "period_type" VARCHAR(20) NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "total_requests" INTEGER NOT NULL DEFAULT 0,
    "success_requests" INTEGER NOT NULL DEFAULT 0,
    "error_requests" INTEGER NOT NULL DEFAULT 0,
    "endpoint_counts" JSONB NOT NULL DEFAULT '{}',
    "total_tokens_in" INTEGER NOT NULL DEFAULT 0,
    "total_tokens_out" INTEGER NOT NULL DEFAULT 0,
    "avg_latency_ms" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "p95_latency_ms" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimated_cost_cents" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_usage_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT,
    "prompt" TEXT NOT NULL,
    "name" VARCHAR(200),
    "description" TEXT,
    "assertions" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quality_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consecutive_passes" INTEGER NOT NULL DEFAULT 0,
    "consecutive_fails" INTEGER NOT NULL DEFAULT 0,
    "total_runs" INTEGER NOT NULL DEFAULT 0,
    "last_run_at" TIMESTAMP(3),
    "last_run_status" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_embeddings" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "model" VARCHAR(50) NOT NULL DEFAULT 'text-embedding-3-small',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_runs" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "conversation" JSONB,
    "output" TEXT,
    "error_log" TEXT,
    "evaluator_model" VARCHAR(50),
    "evaluator_verdict" VARCHAR(10),
    "evaluator_reason" TEXT,
    "assertion_results" JSONB,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "total_tokens" INTEGER,
    "execution_time_ms" INTEGER,
    "estimated_cost" DECIMAL(10,6),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_quotas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "daily_limit" INTEGER NOT NULL DEFAULT 50,
    "daily_used" INTEGER NOT NULL DEFAULT 0,
    "last_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenario_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industries" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "use_cases" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "marketing_title" VARCHAR(200) NOT NULL,
    "marketing_desc" TEXT NOT NULL,
    "roi_estimate" TEXT,
    "business_value" TEXT,
    "problem_statement" TEXT,
    "solution_narrative" TEXT,
    "rank_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_ranked_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_regenerated_at" TIMESTAMP(3),

    CONSTRAINT "use_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "use_case_personas" (
    "use_case_id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "relevance" DOUBLE PRECISION,

    CONSTRAINT "use_case_personas_pkey" PRIMARY KEY ("use_case_id","persona_id")
);

-- CreateTable
CREATE TABLE "use_case_industries" (
    "use_case_id" TEXT NOT NULL,
    "industry_id" TEXT NOT NULL,

    CONSTRAINT "use_case_industries_pkey" PRIMARY KEY ("use_case_id","industry_id")
);

-- CreateTable
CREATE TABLE "use_case_categories" (
    "use_case_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "use_case_categories_pkey" PRIMARY KEY ("use_case_id","category_id")
);

-- CreateTable
CREATE TABLE "social_proofs" (
    "id" TEXT NOT NULL,
    "use_case_id" TEXT NOT NULL,
    "quality_score" DOUBLE PRECISION NOT NULL,
    "total_runs" INTEGER NOT NULL,
    "consecutive_passes" INTEGER NOT NULL,
    "last_run_status" VARCHAR(20),
    "last_run_at" TIMESTAMP(3),
    "success_rate" DOUBLE PRECISION,
    "last_run_ago" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_skills_cache" (
    "id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "skills_markdown" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_skills_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills_generation_jobs" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "current_batch" INTEGER NOT NULL DEFAULT 0,
    "total_batches" INTEGER NOT NULL,
    "completed_tool_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omega_conversations" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" VARCHAR(200),
    "execution_state" VARCHAR(20) NOT NULL DEFAULT 'idle',
    "input_tokens_total" INTEGER NOT NULL DEFAULT 0,
    "output_tokens_total" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "omega_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omega_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" TEXT,
    "author_email" TEXT,
    "author_name" VARCHAR(100),
    "tool_calls" JSONB,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "omega_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omega_participants" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT,
    "display_name" VARCHAR(100) NOT NULL,
    "email" TEXT,
    "role" VARCHAR(20) NOT NULL DEFAULT 'collaborator',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "omega_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omega_tool_runs" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "message_id" TEXT,
    "tool_name" VARCHAR(200) NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "execution_time_ms" INTEGER,

    CONSTRAINT "omega_tool_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omega_user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pinned_tool_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blocked_tool_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "custom_system_prompt" TEXT,
    "show_debug_mode" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "omega_user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_questions" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "answer" TEXT NOT NULL,
    "answer_tokens" INTEGER NOT NULL DEFAULT 0,
    "agent_hash" VARCHAR(64),
    "agent_name" VARCHAR(100),
    "session_id" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "similar_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "question_count" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parent_skill_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_question_skills" (
    "question_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "relevance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "skill_question_skills_pkey" PRIMARY KEY ("question_id","skill_id")
);

-- CreateTable
CREATE TABLE "skill_question_tools" (
    "question_id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "relevance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "skill_question_tools_pkey" PRIMARY KEY ("question_id","tool_id")
);

-- CreateTable
CREATE TABLE "skill_sessions" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "context" JSONB NOT NULL DEFAULT '[]',
    "agent_hash" VARCHAR(64),
    "agent_name" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "namespace" VARCHAR(100),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "embedding" JSONB NOT NULL,
    "source" VARCHAR(100) NOT NULL,
    "source_agent" VARCHAR(200),
    "source_context" JSONB,
    "content_size_bytes" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_events" (
    "id" TEXT NOT NULL,
    "event_type" VARCHAR(30) NOT NULL,
    "source" VARCHAR(30) NOT NULL,
    "user_id" TEXT,
    "api_key_id" TEXT,
    "tool_id" TEXT,
    "agent_id" TEXT,
    "collection_id" TEXT,
    "tool_name" VARCHAR(200),
    "package_name" VARCHAR(214),
    "status" VARCHAR(20) NOT NULL,
    "duration_ms" INTEGER,
    "tokens_in" INTEGER,
    "tokens_out" INTEGER,
    "error_code" VARCHAR(50),
    "error_message" TEXT,
    "sequence_id" VARCHAR(36),
    "turn_index" INTEGER,
    "conversation_id" TEXT,
    "input_args" JSONB,
    "output_summary" JSONB,
    "error_category" VARCHAR(30),
    "mcp_server_id" TEXT,
    "context_message_count" INTEGER,
    "context_token_count" INTEGER,
    "available_tool_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" TEXT NOT NULL,
    "query" VARCHAR(500) NOT NULL,
    "result_count" INTEGER NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "uid" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "triggerType" "WorkflowTriggerType" NOT NULL DEFAULT 'MANUAL',
    "trigger_config" JSONB,
    "canvas_viewport" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "executor_type" VARCHAR(20),
    "executor_config" JSONB,
    "env_vars" JSONB,
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "last_executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_nodes" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "node_id" VARCHAR(100) NOT NULL,
    "type" "WorkflowNodeType" NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "position_x" DOUBLE PRECISION NOT NULL,
    "position_y" DOUBLE PRECISION NOT NULL,
    "config" JSONB,
    "tool_id" TEXT,
    "agent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_edges" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "edge_id" VARCHAR(100) NOT NULL,
    "source_node_id" TEXT NOT NULL,
    "target_node_id" TEXT NOT NULL,
    "source_handle" VARCHAR(50),
    "target_handle" VARCHAR(50),
    "data_mapping" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "status" "WorkflowExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "triggered_by" VARCHAR(50) NOT NULL,
    "trigger_input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "total_tokens_in" INTEGER,
    "total_tokens_out" INTEGER,
    "workflow_version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_node_executions" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "status" "WorkflowNodeExecutionStatus" NOT NULL DEFAULT 'NODE_PENDING',
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "max_retries" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_node_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setup_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "claim_code" VARCHAR(32),
    "config" JSONB NOT NULL,
    "redeemed" BOOLEAN NOT NULL DEFAULT false,
    "redeemed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setup_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "packages_npm_package_name_key" ON "packages"("npm_package_name");

-- CreateIndex
CREATE INDEX "packages_category_idx" ON "packages"("category");

-- CreateIndex
CREATE INDEX "packages_is_official_idx" ON "packages"("is_official");

-- CreateIndex
CREATE INDEX "packages_npm_downloads_last_month_idx" ON "packages"("npm_downloads_last_month");

-- CreateIndex
CREATE INDEX "packages_created_at_idx" ON "packages"("created_at");

-- CreateIndex
CREATE INDEX "tools_quality_score_idx" ON "tools"("quality_score");

-- CreateIndex
CREATE INDEX "tools_like_count_idx" ON "tools"("like_count");

-- CreateIndex
CREATE INDEX "tools_average_rating_idx" ON "tools"("average_rating");

-- CreateIndex
CREATE INDEX "tools_rating_count_idx" ON "tools"("rating_count");

-- CreateIndex
CREATE INDEX "tools_view_count_idx" ON "tools"("view_count");

-- CreateIndex
CREATE INDEX "tools_execution_count_idx" ON "tools"("execution_count");

-- CreateIndex
CREATE INDEX "tools_review_count_idx" ON "tools"("review_count");

-- CreateIndex
CREATE INDEX "tools_import_health_idx" ON "tools"("import_health");

-- CreateIndex
CREATE INDEX "tools_execution_health_idx" ON "tools"("execution_health");

-- CreateIndex
CREATE INDEX "tools_last_health_check_idx" ON "tools"("last_health_check");

-- CreateIndex
CREATE UNIQUE INDEX "tools_package_id_name_key" ON "tools"("package_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sync_checkpoints_source_key" ON "sync_checkpoints"("source");

-- CreateIndex
CREATE INDEX "sync_logs_source_idx" ON "sync_logs"("source");

-- CreateIndex
CREATE INDEX "sync_logs_status_idx" ON "sync_logs"("status");

-- CreateIndex
CREATE INDEX "sync_logs_created_at_idx" ON "sync_logs"("created_at");

-- CreateIndex
CREATE INDEX "simulations_tool_id_idx" ON "simulations"("tool_id");

-- CreateIndex
CREATE INDEX "simulations_status_idx" ON "simulations"("status");

-- CreateIndex
CREATE INDEX "simulations_ip_address_created_at_idx" ON "simulations"("ip_address", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "token_usage_simulation_id_key" ON "token_usage"("simulation_id");

-- CreateIndex
CREATE INDEX "execution_logs_simulation_id_idx" ON "execution_logs"("simulation_id");

-- CreateIndex
CREATE INDEX "health_checks_tool_id_idx" ON "health_checks"("tool_id");

-- CreateIndex
CREATE INDEX "health_checks_check_type_idx" ON "health_checks"("check_type");

-- CreateIndex
CREATE INDEX "health_checks_overall_status_idx" ON "health_checks"("overall_status");

-- CreateIndex
CREATE INDEX "health_checks_created_at_idx" ON "health_checks"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "stats_snapshots_date_key" ON "stats_snapshots"("date");

-- CreateIndex
CREATE INDEX "stats_snapshots_date_idx" ON "stats_snapshots"("date");

-- CreateIndex
CREATE INDEX "page_views_entity_type_entity_id_idx" ON "page_views"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "page_views_date_idx" ON "page_views"("date");

-- CreateIndex
CREATE UNIQUE INDEX "page_views_entity_type_entity_id_date_key" ON "page_views"("entity_type", "entity_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "collections_user_id_idx" ON "collections"("user_id");

-- CreateIndex
CREATE INDEX "collections_slug_idx" ON "collections"("slug");

-- CreateIndex
CREATE INDEX "collections_is_public_idx" ON "collections"("is_public");

-- CreateIndex
CREATE INDEX "collections_like_count_idx" ON "collections"("like_count");

-- CreateIndex
CREATE INDEX "collections_view_count_idx" ON "collections"("view_count");

-- CreateIndex
CREATE INDEX "collections_execution_count_idx" ON "collections"("execution_count");

-- CreateIndex
CREATE INDEX "collections_created_at_idx" ON "collections"("created_at");

-- CreateIndex
CREATE INDEX "collections_forked_from_id_idx" ON "collections"("forked_from_id");

-- CreateIndex
CREATE INDEX "collections_fork_count_idx" ON "collections"("fork_count");

-- CreateIndex
CREATE UNIQUE INDEX "collections_user_id_slug_key" ON "collections"("user_id", "slug");

-- CreateIndex
CREATE INDEX "collection_tools_collection_id_idx" ON "collection_tools"("collection_id");

-- CreateIndex
CREATE INDEX "collection_tools_tool_id_idx" ON "collection_tools"("tool_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_tools_collection_id_tool_id_key" ON "collection_tools"("collection_id", "tool_id");

-- CreateIndex
CREATE UNIQUE INDEX "agents_uid_key" ON "agents"("uid");

-- CreateIndex
CREATE INDEX "agents_user_id_idx" ON "agents"("user_id");

-- CreateIndex
CREATE INDEX "agents_uid_idx" ON "agents"("uid");

-- CreateIndex
CREATE INDEX "agents_is_public_idx" ON "agents"("is_public");

-- CreateIndex
CREATE INDEX "agents_like_count_idx" ON "agents"("like_count");

-- CreateIndex
CREATE INDEX "agents_view_count_idx" ON "agents"("view_count");

-- CreateIndex
CREATE INDEX "agents_conversation_count_idx" ON "agents"("conversation_count");

-- CreateIndex
CREATE INDEX "agents_execution_count_idx" ON "agents"("execution_count");

-- CreateIndex
CREATE INDEX "agents_created_at_idx" ON "agents"("created_at");

-- CreateIndex
CREATE INDEX "agents_forked_from_id_idx" ON "agents"("forked_from_id");

-- CreateIndex
CREATE INDEX "agents_fork_count_idx" ON "agents"("fork_count");

-- CreateIndex
CREATE UNIQUE INDEX "agents_user_id_name_key" ON "agents"("user_id", "name");

-- CreateIndex
CREATE INDEX "agent_collections_agent_id_idx" ON "agent_collections"("agent_id");

-- CreateIndex
CREATE INDEX "agent_collections_collection_id_idx" ON "agent_collections"("collection_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_collections_agent_id_collection_id_key" ON "agent_collections"("agent_id", "collection_id");

-- CreateIndex
CREATE INDEX "agent_tools_agent_id_idx" ON "agent_tools"("agent_id");

-- CreateIndex
CREATE INDEX "agent_tools_tool_id_idx" ON "agent_tools"("tool_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_tools_agent_id_tool_id_key" ON "agent_tools"("agent_id", "tool_id");

-- CreateIndex
CREATE INDEX "user_api_keys_user_id_idx" ON "user_api_keys"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_api_keys_user_id_key_name_key" ON "user_api_keys"("user_id", "key_name");

-- CreateIndex
CREATE INDEX "conversations_agent_id_idx" ON "conversations"("agent_id");

-- CreateIndex
CREATE INDEX "conversations_created_at_idx" ON "conversations"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_agent_id_slug_key" ON "conversations"("agent_id", "slug");

-- CreateIndex
CREATE INDEX "tool_approvals_conversation_id_decision_idx" ON "tool_approvals"("conversation_id", "decision");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "tool_likes_tool_id_idx" ON "tool_likes"("tool_id");

-- CreateIndex
CREATE INDEX "tool_likes_user_id_idx" ON "tool_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tool_likes_user_id_tool_id_key" ON "tool_likes"("user_id", "tool_id");

-- CreateIndex
CREATE INDEX "collection_likes_collection_id_idx" ON "collection_likes"("collection_id");

-- CreateIndex
CREATE INDEX "collection_likes_user_id_idx" ON "collection_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_likes_user_id_collection_id_key" ON "collection_likes"("user_id", "collection_id");

-- CreateIndex
CREATE INDEX "agent_likes_agent_id_idx" ON "agent_likes"("agent_id");

-- CreateIndex
CREATE INDEX "agent_likes_user_id_idx" ON "agent_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_likes_user_id_agent_id_key" ON "agent_likes"("user_id", "agent_id");

-- CreateIndex
CREATE INDEX "tool_ratings_tool_id_idx" ON "tool_ratings"("tool_id");

-- CreateIndex
CREATE INDEX "tool_ratings_user_id_idx" ON "tool_ratings"("user_id");

-- CreateIndex
CREATE INDEX "tool_ratings_rating_idx" ON "tool_ratings"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "tool_ratings_user_id_tool_id_key" ON "tool_ratings"("user_id", "tool_id");

-- CreateIndex
CREATE INDEX "tool_reviews_tool_id_idx" ON "tool_reviews"("tool_id");

-- CreateIndex
CREATE INDEX "tool_reviews_user_id_idx" ON "tool_reviews"("user_id");

-- CreateIndex
CREATE INDEX "tool_reviews_rating_idx" ON "tool_reviews"("rating");

-- CreateIndex
CREATE INDEX "tool_reviews_is_approved_is_hidden_idx" ON "tool_reviews"("is_approved", "is_hidden");

-- CreateIndex
CREATE INDEX "tool_reviews_created_at_idx" ON "tool_reviews"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tool_reviews_user_id_tool_id_key" ON "tool_reviews"("user_id", "tool_id");

-- CreateIndex
CREATE INDEX "user_activities_user_id_idx" ON "user_activities"("user_id");

-- CreateIndex
CREATE INDEX "user_activities_user_id_created_at_idx" ON "user_activities"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_activities_type_idx" ON "user_activities"("type");

-- CreateIndex
CREATE INDEX "user_activities_created_at_idx" ON "user_activities"("created_at");

-- CreateIndex
CREATE INDEX "endpoint_health_reports_timestamp_idx" ON "endpoint_health_reports"("timestamp");

-- CreateIndex
CREATE INDEX "endpoint_health_reports_overall_status_idx" ON "endpoint_health_reports"("overall_status");

-- CreateIndex
CREATE INDEX "endpoint_health_reports_source_idx" ON "endpoint_health_reports"("source");

-- CreateIndex
CREATE UNIQUE INDEX "bridge_connections_user_id_key" ON "bridge_connections"("user_id");

-- CreateIndex
CREATE INDEX "bridge_connections_status_idx" ON "bridge_connections"("status");

-- CreateIndex
CREATE INDEX "collection_bridge_tools_collection_id_idx" ON "collection_bridge_tools"("collection_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_bridge_tools_collection_id_server_id_tool_name_key" ON "collection_bridge_tools"("collection_id", "server_id", "tool_name");

-- CreateIndex
CREATE INDEX "custom_mcp_servers_user_id_idx" ON "custom_mcp_servers"("user_id");

-- CreateIndex
CREATE INDEX "custom_mcp_servers_status_idx" ON "custom_mcp_servers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "custom_mcp_servers_user_id_url_key" ON "custom_mcp_servers"("user_id", "url");

-- CreateIndex
CREATE INDEX "collection_custom_tools_collection_id_idx" ON "collection_custom_tools"("collection_id");

-- CreateIndex
CREATE INDEX "collection_custom_tools_server_id_idx" ON "collection_custom_tools"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_custom_tools_collection_id_server_id_tool_name_key" ON "collection_custom_tools"("collection_id", "server_id", "tool_name");

-- CreateIndex
CREATE UNIQUE INDEX "tpmjs_api_keys_key_hash_key" ON "tpmjs_api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "tpmjs_api_keys_user_id_idx" ON "tpmjs_api_keys"("user_id");

-- CreateIndex
CREATE INDEX "tpmjs_api_keys_key_hash_idx" ON "tpmjs_api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "tpmjs_api_keys_key_prefix_idx" ON "tpmjs_api_keys"("key_prefix");

-- CreateIndex
CREATE INDEX "tpmjs_api_keys_is_active_idx" ON "tpmjs_api_keys"("is_active");

-- CreateIndex
CREATE INDEX "api_usage_records_api_key_id_idx" ON "api_usage_records"("api_key_id");

-- CreateIndex
CREATE INDEX "api_usage_records_created_at_idx" ON "api_usage_records"("created_at");

-- CreateIndex
CREATE INDEX "api_usage_records_endpoint_idx" ON "api_usage_records"("endpoint");

-- CreateIndex
CREATE INDEX "api_usage_records_resource_type_resource_id_idx" ON "api_usage_records"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "api_usage_summaries_user_id_idx" ON "api_usage_summaries"("user_id");

-- CreateIndex
CREATE INDEX "api_usage_summaries_period_type_period_start_idx" ON "api_usage_summaries"("period_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "api_usage_summaries_user_id_api_key_id_period_type_period_s_key" ON "api_usage_summaries"("user_id", "api_key_id", "period_type", "period_start");

-- CreateIndex
CREATE INDEX "scenarios_collection_id_idx" ON "scenarios"("collection_id");

-- CreateIndex
CREATE INDEX "scenarios_quality_score_idx" ON "scenarios"("quality_score");

-- CreateIndex
CREATE INDEX "scenarios_created_at_idx" ON "scenarios"("created_at");

-- CreateIndex
CREATE INDEX "scenarios_last_run_status_idx" ON "scenarios"("last_run_status");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_embeddings_scenario_id_key" ON "scenario_embeddings"("scenario_id");

-- CreateIndex
CREATE INDEX "scenario_embeddings_scenario_id_idx" ON "scenario_embeddings"("scenario_id");

-- CreateIndex
CREATE INDEX "scenario_runs_scenario_id_idx" ON "scenario_runs"("scenario_id");

-- CreateIndex
CREATE INDEX "scenario_runs_user_id_idx" ON "scenario_runs"("user_id");

-- CreateIndex
CREATE INDEX "scenario_runs_status_idx" ON "scenario_runs"("status");

-- CreateIndex
CREATE INDEX "scenario_runs_created_at_idx" ON "scenario_runs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_quotas_user_id_key" ON "scenario_quotas"("user_id");

-- CreateIndex
CREATE INDEX "scenario_quotas_user_id_idx" ON "scenario_quotas"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "personas_name_key" ON "personas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "personas_slug_key" ON "personas"("slug");

-- CreateIndex
CREATE INDEX "personas_slug_idx" ON "personas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "industries_name_key" ON "industries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "industries_slug_key" ON "industries"("slug");

-- CreateIndex
CREATE INDEX "industries_parent_id_idx" ON "industries"("parent_id");

-- CreateIndex
CREATE INDEX "industries_slug_idx" ON "industries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_type_idx" ON "categories"("type");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "use_cases_scenario_id_key" ON "use_cases"("scenario_id");

-- CreateIndex
CREATE INDEX "use_cases_scenario_id_idx" ON "use_cases"("scenario_id");

-- CreateIndex
CREATE INDEX "use_cases_slug_idx" ON "use_cases"("slug");

-- CreateIndex
CREATE INDEX "use_cases_rank_score_idx" ON "use_cases"("rank_score");

-- CreateIndex
CREATE INDEX "use_cases_last_ranked_at_idx" ON "use_cases"("last_ranked_at");

-- CreateIndex
CREATE INDEX "use_cases_last_regenerated_at_idx" ON "use_cases"("last_regenerated_at");

-- CreateIndex
CREATE INDEX "use_case_personas_use_case_id_idx" ON "use_case_personas"("use_case_id");

-- CreateIndex
CREATE INDEX "use_case_personas_persona_id_idx" ON "use_case_personas"("persona_id");

-- CreateIndex
CREATE INDEX "use_case_industries_use_case_id_idx" ON "use_case_industries"("use_case_id");

-- CreateIndex
CREATE INDEX "use_case_industries_industry_id_idx" ON "use_case_industries"("industry_id");

-- CreateIndex
CREATE INDEX "use_case_categories_use_case_id_idx" ON "use_case_categories"("use_case_id");

-- CreateIndex
CREATE INDEX "use_case_categories_category_id_idx" ON "use_case_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_proofs_use_case_id_key" ON "social_proofs"("use_case_id");

-- CreateIndex
CREATE INDEX "social_proofs_use_case_id_idx" ON "social_proofs"("use_case_id");

-- CreateIndex
CREATE INDEX "social_proofs_quality_score_idx" ON "social_proofs"("quality_score");

-- CreateIndex
CREATE INDEX "social_proofs_total_runs_idx" ON "social_proofs"("total_runs");

-- CreateIndex
CREATE UNIQUE INDEX "tool_skills_cache_tool_id_key" ON "tool_skills_cache"("tool_id");

-- CreateIndex
CREATE INDEX "tool_skills_cache_tool_id_idx" ON "tool_skills_cache"("tool_id");

-- CreateIndex
CREATE INDEX "skills_generation_jobs_collection_id_idx" ON "skills_generation_jobs"("collection_id");

-- CreateIndex
CREATE INDEX "skills_generation_jobs_status_idx" ON "skills_generation_jobs"("status");

-- CreateIndex
CREATE INDEX "omega_conversations_owner_id_idx" ON "omega_conversations"("owner_id");

-- CreateIndex
CREATE INDEX "omega_conversations_created_at_idx" ON "omega_conversations"("created_at");

-- CreateIndex
CREATE INDEX "omega_messages_conversation_id_idx" ON "omega_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "omega_messages_created_at_idx" ON "omega_messages"("created_at");

-- CreateIndex
CREATE INDEX "omega_participants_conversation_id_idx" ON "omega_participants"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "omega_participants_conversation_id_user_id_key" ON "omega_participants"("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "omega_tool_runs_conversation_id_idx" ON "omega_tool_runs"("conversation_id");

-- CreateIndex
CREATE INDEX "omega_tool_runs_status_idx" ON "omega_tool_runs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "omega_user_settings_user_id_key" ON "omega_user_settings"("user_id");

-- CreateIndex
CREATE INDEX "skill_questions_collection_id_idx" ON "skill_questions"("collection_id");

-- CreateIndex
CREATE INDEX "skill_questions_session_id_idx" ON "skill_questions"("session_id");

-- CreateIndex
CREATE INDEX "skill_questions_created_at_idx" ON "skill_questions"("created_at");

-- CreateIndex
CREATE INDEX "skills_collection_id_idx" ON "skills"("collection_id");

-- CreateIndex
CREATE INDEX "skills_question_count_idx" ON "skills"("question_count");

-- CreateIndex
CREATE UNIQUE INDEX "skills_collection_id_slug_key" ON "skills"("collection_id", "slug");

-- CreateIndex
CREATE INDEX "skill_question_skills_question_id_idx" ON "skill_question_skills"("question_id");

-- CreateIndex
CREATE INDEX "skill_question_skills_skill_id_idx" ON "skill_question_skills"("skill_id");

-- CreateIndex
CREATE INDEX "skill_question_tools_question_id_idx" ON "skill_question_tools"("question_id");

-- CreateIndex
CREATE INDEX "skill_question_tools_tool_id_idx" ON "skill_question_tools"("tool_id");

-- CreateIndex
CREATE INDEX "skill_sessions_collection_id_idx" ON "skill_sessions"("collection_id");

-- CreateIndex
CREATE INDEX "skill_sessions_expires_at_idx" ON "skill_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "memories_user_id_idx" ON "memories"("user_id");

-- CreateIndex
CREATE INDEX "memories_user_id_namespace_idx" ON "memories"("user_id", "namespace");

-- CreateIndex
CREATE INDEX "memories_user_id_created_at_idx" ON "memories"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "memories_expires_at_idx" ON "memories"("expires_at");

-- CreateIndex
CREATE INDEX "execution_events_user_id_created_at_idx" ON "execution_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "execution_events_collection_id_created_at_idx" ON "execution_events"("collection_id", "created_at");

-- CreateIndex
CREATE INDEX "execution_events_tool_id_created_at_idx" ON "execution_events"("tool_id", "created_at");

-- CreateIndex
CREATE INDEX "execution_events_event_type_created_at_idx" ON "execution_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "execution_events_created_at_idx" ON "execution_events"("created_at");

-- CreateIndex
CREATE INDEX "execution_events_sequence_id_idx" ON "execution_events"("sequence_id");

-- CreateIndex
CREATE INDEX "execution_events_conversation_id_created_at_idx" ON "execution_events"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "search_logs_created_at_idx" ON "search_logs"("created_at");

-- CreateIndex
CREATE INDEX "search_logs_query_idx" ON "search_logs"("query");

-- CreateIndex
CREATE UNIQUE INDEX "workflows_uid_key" ON "workflows"("uid");

-- CreateIndex
CREATE INDEX "workflows_user_id_idx" ON "workflows"("user_id");

-- CreateIndex
CREATE INDEX "workflows_uid_idx" ON "workflows"("uid");

-- CreateIndex
CREATE INDEX "workflows_status_idx" ON "workflows"("status");

-- CreateIndex
CREATE UNIQUE INDEX "workflows_user_id_name_key" ON "workflows"("user_id", "name");

-- CreateIndex
CREATE INDEX "workflow_nodes_workflow_id_idx" ON "workflow_nodes"("workflow_id");

-- CreateIndex
CREATE INDEX "workflow_nodes_tool_id_idx" ON "workflow_nodes"("tool_id");

-- CreateIndex
CREATE INDEX "workflow_nodes_agent_id_idx" ON "workflow_nodes"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_nodes_workflow_id_node_id_key" ON "workflow_nodes"("workflow_id", "node_id");

-- CreateIndex
CREATE INDEX "workflow_edges_workflow_id_idx" ON "workflow_edges"("workflow_id");

-- CreateIndex
CREATE INDEX "workflow_edges_source_node_id_idx" ON "workflow_edges"("source_node_id");

-- CreateIndex
CREATE INDEX "workflow_edges_target_node_id_idx" ON "workflow_edges"("target_node_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_edges_workflow_id_edge_id_key" ON "workflow_edges"("workflow_id", "edge_id");

-- CreateIndex
CREATE INDEX "workflow_executions_workflow_id_idx" ON "workflow_executions"("workflow_id");

-- CreateIndex
CREATE INDEX "workflow_executions_status_idx" ON "workflow_executions"("status");

-- CreateIndex
CREATE INDEX "workflow_executions_created_at_idx" ON "workflow_executions"("created_at");

-- CreateIndex
CREATE INDEX "workflow_node_executions_execution_id_idx" ON "workflow_node_executions"("execution_id");

-- CreateIndex
CREATE INDEX "workflow_node_executions_node_id_idx" ON "workflow_node_executions"("node_id");

-- CreateIndex
CREATE UNIQUE INDEX "setup_tokens_token_key" ON "setup_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "setup_tokens_claim_code_key" ON "setup_tokens"("claim_code");

-- CreateIndex
CREATE INDEX "setup_tokens_token_idx" ON "setup_tokens"("token");

-- CreateIndex
CREATE INDEX "setup_tokens_claim_code_idx" ON "setup_tokens"("claim_code");

-- CreateIndex
CREATE INDEX "setup_tokens_user_id_idx" ON "setup_tokens"("user_id");

-- CreateIndex
CREATE INDEX "setup_tokens_expires_at_idx" ON "setup_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "tools" ADD CONSTRAINT "tools_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_checks" ADD CONSTRAINT "health_checks_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_forked_from_id_fkey" FOREIGN KEY ("forked_from_id") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_tools" ADD CONSTRAINT "collection_tools_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_tools" ADD CONSTRAINT "collection_tools_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_forked_from_id_fkey" FOREIGN KEY ("forked_from_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_collections" ADD CONSTRAINT "agent_collections_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_collections" ADD CONSTRAINT "agent_collections_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_api_keys" ADD CONSTRAINT "user_api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_approvals" ADD CONSTRAINT "tool_approvals_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_likes" ADD CONSTRAINT "tool_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_likes" ADD CONSTRAINT "tool_likes_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_likes" ADD CONSTRAINT "collection_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_likes" ADD CONSTRAINT "collection_likes_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_likes" ADD CONSTRAINT "agent_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_likes" ADD CONSTRAINT "agent_likes_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_ratings" ADD CONSTRAINT "tool_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_ratings" ADD CONSTRAINT "tool_ratings_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_reviews" ADD CONSTRAINT "tool_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_reviews" ADD CONSTRAINT "tool_reviews_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_connections" ADD CONSTRAINT "bridge_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_bridge_tools" ADD CONSTRAINT "collection_bridge_tools_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_mcp_servers" ADD CONSTRAINT "custom_mcp_servers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_custom_tools" ADD CONSTRAINT "collection_custom_tools_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_custom_tools" ADD CONSTRAINT "collection_custom_tools_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "custom_mcp_servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tpmjs_api_keys" ADD CONSTRAINT "tpmjs_api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage_records" ADD CONSTRAINT "api_usage_records_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "tpmjs_api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage_summaries" ADD CONSTRAINT "api_usage_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_embeddings" ADD CONSTRAINT "scenario_embeddings_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_runs" ADD CONSTRAINT "scenario_runs_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industries" ADD CONSTRAINT "industries_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "use_case_personas" ADD CONSTRAINT "use_case_personas_use_case_id_fkey" FOREIGN KEY ("use_case_id") REFERENCES "use_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "use_case_personas" ADD CONSTRAINT "use_case_personas_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "use_case_industries" ADD CONSTRAINT "use_case_industries_use_case_id_fkey" FOREIGN KEY ("use_case_id") REFERENCES "use_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "use_case_industries" ADD CONSTRAINT "use_case_industries_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "use_case_categories" ADD CONSTRAINT "use_case_categories_use_case_id_fkey" FOREIGN KEY ("use_case_id") REFERENCES "use_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "use_case_categories" ADD CONSTRAINT "use_case_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_proofs" ADD CONSTRAINT "social_proofs_use_case_id_fkey" FOREIGN KEY ("use_case_id") REFERENCES "use_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_skills_cache" ADD CONSTRAINT "tool_skills_cache_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills_generation_jobs" ADD CONSTRAINT "skills_generation_jobs_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omega_messages" ADD CONSTRAINT "omega_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "omega_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omega_participants" ADD CONSTRAINT "omega_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "omega_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omega_tool_runs" ADD CONSTRAINT "omega_tool_runs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "omega_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_questions" ADD CONSTRAINT "skill_questions_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_parent_skill_id_fkey" FOREIGN KEY ("parent_skill_id") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_question_skills" ADD CONSTRAINT "skill_question_skills_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "skill_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_question_skills" ADD CONSTRAINT "skill_question_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_question_tools" ADD CONSTRAINT "skill_question_tools_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "skill_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_question_tools" ADD CONSTRAINT "skill_question_tools_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_sessions" ADD CONSTRAINT "skill_sessions_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_edges" ADD CONSTRAINT "workflow_edges_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_edges" ADD CONSTRAINT "workflow_edges_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "workflow_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_edges" ADD CONSTRAINT "workflow_edges_target_node_id_fkey" FOREIGN KEY ("target_node_id") REFERENCES "workflow_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_node_executions" ADD CONSTRAINT "workflow_node_executions_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "workflow_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_node_executions" ADD CONSTRAINT "workflow_node_executions_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "workflow_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setup_tokens" ADD CONSTRAINT "setup_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
