# Changelog

All notable changes to this project will be documented in this file.

This project uses [Changesets](https://github.com/changesets/changesets) for versioning published packages. This file tracks high-level project milestones and features.

## [Unreleased]

### Added
- CLI reference documentation at `/docs/cli`
- Platform skills documentation
- Comprehensive style guide and missing UI components
- Auto-close and auto-merge pipelines for CI
- Fail-closed registry release audit with machine-readable CI evidence
- Package-scoped npm Trusted Publishing preflight with short-lived GitHub OIDC credentials
- Weekly Vercel OpenAPI contract-drift verification for all 167 Vercel tools

### Fixed
- Pre-commit hooks no longer deadlock after parallel formatting by pinning the
  `stage_fixed`-safe Lefthook release and enforcing that contract in the
  architecture gate
- Prisma client lazy initialization to prevent Lambda cold-start crashes
- N+1 count queries in `/api/stats` consolidated into batch operations
- Tag backfill N+1 queries in `/api/sync/enrich`
- OpenAI quota error handling in memory embedding
- Duplicate `browserTracingIntegration` causing `pushState` conflicts
- Omega agent: chronological saving, error surfacing, white screen fix
- Source/npm version drift across four packages without reusing published versions
- 35 stale Vercel API routes and request contracts; deprecated checks migrated to v2

### Improved
- `@tpmjs/mcp-client` now owns one leak-free connection lifecycle for local
  stdio, remote Streamable HTTP, and legacy SSE; the web app uses that same
  tested transport contract instead of maintaining a private second client
- The final 20 non-UI package builds now use the shared tsdown/Rolldown contract
  while preserving multi-entry exports, source maps, and executable shebangs;
  only the directive-sensitive UI build remains on tsup, and the cold cohort is
  14.5% faster
- 188 uniform library packages and the 42-entry CLI now share one pinned tsdown/Rolldown contract instead of maintaining 189 duplicate tsup configs; cold cohort builds are 14% faster, the CLI is 68% faster with 65% lower peak memory, Turbo caching remains package-granular, and migrated release candidates must pass publint plus Are the Types Wrong?
- Type checking now uses native TypeScript 7 with one checker per Turbo task, while a pnpm catalog keeps the TypeScript 6 API available to tsup and lint tooling
- The tool-surface contract test isolates its separately-tested syntax highlighter, reducing its focused runtime from 16 seconds to 0.2 seconds under load
- Sandbox CI executes its integration suites directly instead of spending eight minutes on an unrelated full build and then silently running zero tests
- Release administration no longer exposes a long-lived npm token to GitHub Actions; npm trust is bootstrapped from an audited interactive maintainer session and routine publishing is OIDC-only
- Security: SECURITY.md, CODE_OF_CONDUCT.md, issue/PR templates
- SEO: sitemap expanded from 7 to 40+ static pages
- Homepage: removed `count()` calls, uses pre-computed snapshot data
- Design system: all raw HTML buttons replaced with `@tpmjs/ui` Button
- Copy: tighter, more specific messaging across all public surfaces
- About page: expanded with differentiators, tech stack, CTAs

## 2026-07-18 — Maintainer overhaul

### Security
- Rotated `CRON_SECRET` and removed dead Stack Auth keys after finding live secrets reachable in public git history; deleted the two stale branches carrying the leaked env files
- All 16 cron/sync endpoints and both Deno executors moved to fail-closed, timing-safe auth (`requireCronAuth`); a missing env var can no longer expose destructive endpoints or code execution
- Both executors now run as non-root (`deno`, uid 1993) with all capabilities dropped and `NoNewPrivileges` — untrusted tool code previously ran as root in the container
- Security headers (HSTS, nosniff, X-Frame-Options, referrer/permissions policy) restored via `next.config.ts` after silently disappearing in the move off Vercel
- `better-auth` 1.4.10 → 1.6.23 (OAuth refresh-token replay advisory)

### Fixed
- Real HTTP 404s for unknown URLs (the catch-all profile route soft-404'd every garbage path with a 200); `/tools` now redirects to the browse UI
- Enrichment queue un-wedged: auto-discovery failures now back off exponentially instead of pinning the head of the queue (0 packages discovered for 3+ days → advancing again)
- Metrics sync no longer overwrites download/star counts with 0 when npm/GitHub rate-limit; unknown values keep the previous data
- README/CLI MCP quickstart pointed at a nonexistent package (`@anthropic/mcp-remote` → `mcp-remote`)
- Keyword sync moved on-box (its ~155s sweep could never finish under Cloudflare's ~100s cutoff — every scheduled CI run failed for weeks while the sync silently succeeded); metrics sweep moved to the daily on-box cron for the same reason

### Improved
- CI re-enabled and green (was disabled since May); per-token-era automation workflows deleted
- Issue tracker triaged 21 → 2 open, each closure with evidence; PR #17 given a full review with an adoption plan (#110)
- Operator/contributor docs rewritten to match the on-box deployment reality (Vercel/Railway/Neon content moved to history or legacy notes)
- `/api/health` now reports the deployed git commit (build provenance in the image)

## 2024 - Initial Release

- Open-source registry and execution layer for AI agent tools
- Auto-discovery of npm packages with `tpmjs` keyword
- Schema extraction (Zod, JSON Schema) and validation
- Quality scoring based on docs, tests, downloads, and health checks
- MCP (Model Context Protocol) endpoints for tool collections
- Support for Claude Code, Claude Desktop, Cursor, Windsurf
- Secure sandboxed execution in isolated Deno environments
- Collections, scenarios, and custom agents
- CLI (`@tpmjs/cli`), SDK (`@tpmjs/registry-search`, `@tpmjs/registry-execute`)
- Bridge for connecting local MCP servers
- Dashboard with activity tracking, API key management, usage stats
- Admin dashboard with user management and search analytics
