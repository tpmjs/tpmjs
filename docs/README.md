# `docs/` — internal design & architecture notes

> **Looking for user documentation?** It lives at **[tpmjs.com/docs](https://tpmjs.com/docs)** (quickstart, per-surface guides for CLI · MCP · REST · SDK · Skill, API reference, tutorials). This directory is the **internal design vault** — architecture notes, PRDs, and design records for contributors and maintainers. It is intentionally raw and not all of it is current.

## Architecture & design

- [`TPMJS-ARCHITECTURE.md`](./TPMJS-ARCHITECTURE.md) — the system architecture overview.
- [`ARCHITECTURE-DIAGRAM.md`](./ARCHITECTURE-DIAGRAM.md) · [`architecture-v1.svg`](./architecture-v1.svg) · [`architecture-v1.d2`](./architecture-v1.d2) — architecture diagrams (D2 source + rendered SVG).
- [`REGISTRY_SDK_DESIGN.md`](./REGISTRY_SDK_DESIGN.md) — design of the registry SDK surface.
- [`MCP-AGGREGATOR-DESIGN.md`](./MCP-AGGREGATOR-DESIGN.md) — serving many tools behind one MCP endpoint.
- [`AI_SDK_TOOL_EXECUTION.md`](./AI_SDK_TOOL_EXECUTION.md) · [`OVERRIDING_NPM_TOOL_EXECUTE.md`](./OVERRIDING_NPM_TOOL_EXECUTE.md) — how tools execute via the AI SDK and how npm tool execution is wrapped.
- [`diagrams/`](./diagrams) · [`design/`](./design) — additional diagrams and design docs.

## Tool orchestration & scale

- [`DYNAMIC_TOOL_ORCHESTRATION.md`](./DYNAMIC_TOOL_ORCHESTRATION.md) — dynamic tool selection/orchestration.
- [`HIERARCHICAL_CONTEXT_LOADING.md`](./HIERARCHICAL_CONTEXT_LOADING.md) — loading tool context hierarchically.
- [`SCALING_TO_1M_TOOLS.md`](./SCALING_TO_1M_TOOLS.md) — scaling the registry toward very large tool counts.
- [`building-dynamic-tool-systems.md`](./building-dynamic-tool-systems.md) · [`TPMJS_PLANNER_TUTORIAL.md`](./TPMJS_PLANNER_TUTORIAL.md) · [`PLANNER_TYPE_DEFINITIONS.ts`](./PLANNER_TYPE_DEFINITIONS.ts) — the planner and dynamic tool-system building blocks.

## Tool health & maintenance

- [`TOOL_HEALTH_SYSTEM.md`](./TOOL_HEALTH_SYSTEM.md) — the health-check/scoring system.
- [`BOUNDED_MAINTENANCE.md`](./BOUNDED_MAINTENANCE.md) — bounded, cost-aware maintenance strategy.
- [`auto-fix-pipeline.md`](./auto-fix-pipeline.md) · [`auto-fix-pipeline-guide.md`](./auto-fix-pipeline-guide.md) — the automated fix pipeline.

## MCP bridge

- [`PRD-MCP-BRIDGE.md`](./PRD-MCP-BRIDGE.md) — the MCP bridge product requirements.
- [`MCP-BRIDGE-STATUS.md`](./MCP-BRIDGE-STATUS.md) — implementation status (may lag current code).

## PRDs & proposals

- [`PRD-omega.md`](./PRD-omega.md) · [`omega-infinite-registry-agent-gap-analysis.md`](./omega-infinite-registry-agent-gap-analysis.md) — the "omega" infinite-registry agent line of work.
- [`prd-dynamic-og-images.md`](./prd-dynamic-og-images.md) — dynamic Open Graph images.

## Operations

- [`BUILD_AND_RELEASE.md`](./BUILD_AND_RELEASE.md) — CI, incremental build caches, transactional on-box deployment, rollback, and provenance.
- [`sentry-setup.md`](./sentry-setup.md) — error monitoring setup.
- [`metrics-tracking-admin.md`](./metrics-tracking-admin.md) — admin metrics tracking.

## Other

- [`style-guide/`](./style-guide) — visual/design style guide.
- [`marketing/`](./marketing) — marketing notes and copy.
- [`history/`](./history) — historical notes.
- [`debug-reports/`](./debug-reports) — one-off debugging write-ups.

---

_Contributing? Start with the root [`README.md`](../README.md), [`CONTRIBUTING.md`](../CONTRIBUTING.md), and [`docs/TPMJS-ARCHITECTURE.md`](./TPMJS-ARCHITECTURE.md). Some notes here predate the current code — when a note and the code disagree, the code wins._
