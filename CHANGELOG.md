# Changelog

All notable changes to this project will be documented in this file.

This project uses [Changesets](https://github.com/changesets/changesets) for versioning published packages. This file tracks high-level project milestones and features.

## [Unreleased]

### Added
- CLI reference documentation at `/docs/cli`
- Platform skills documentation
- Comprehensive style guide and missing UI components
- Auto-close and auto-merge pipelines for CI

### Fixed
- Prisma client lazy initialization to prevent Lambda cold-start crashes
- N+1 count queries in `/api/stats` consolidated into batch operations
- Tag backfill N+1 queries in `/api/sync/enrich`
- OpenAI quota error handling in memory embedding
- Duplicate `browserTracingIntegration` causing `pushState` conflicts
- Omega agent: chronological saving, error surfacing, white screen fix

### Improved
- Security: SECURITY.md, CODE_OF_CONDUCT.md, issue/PR templates
- SEO: sitemap expanded from 7 to 40+ static pages
- Homepage: removed `count()` calls, uses pre-computed snapshot data
- Design system: all raw HTML buttons replaced with `@tpmjs/ui` Button
- Copy: tighter, more specific messaging across all public surfaces
- About page: expanded with differentiators, tech stack, CTAs

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
