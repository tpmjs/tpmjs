---
'@tpmjs/bridge': patch
'@tpmjs/compose': patch
'@tpmjs/env': patch
'@tpmjs/executor-test': patch
'@tpmjs/mcp-client': patch
'@tpmjs/create-basic-tools': patch
'@tpmjs/tools-agentmail': patch
'@tpmjs/official-agnt': patch
'@tpmjs/tools-e2b': patch
'@tpmjs/tools-evals-blah': patch
'@tpmjs/tools-exe-dev': patch
'@tpmjs/tools-judge': patch
'@tpmjs/official-memory': patch
'@tpmjs/official-sandbox-shell': patch
'@tpmjs/tools-supabase': patch
'@tpmjs/types': patch
'@tpmjs/utils': patch
---

Build the remaining non-UI package contracts with shared tsdown/Rolldown
primitives while preserving source maps, executable entry points, and public
multi-entry exports.
