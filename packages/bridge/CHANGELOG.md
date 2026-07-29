# @tpmjs/bridge

## 0.1.1

### Patch Changes

- 9abc203: Add Streamable HTTP and legacy SSE connections, protocol-aware fallback,
  request-scoped connection timeouts, negotiated transport reporting, and
  leak-free failure cleanup while preserving the existing stdio API. Teach the
  bridge CLI to describe either local commands or remote URLs in its server list.
- 014cec3: Align the bridge's exported protocol types, CLI help, and documentation with its authenticated HTTP-polling runtime.
- 8bd487e: Remove unused runtime dependencies and unreachable package internals so published installs and declarations match the maintained execution paths. Public APIs and behavior are unchanged.
- 3ccd3e7: Build the remaining non-UI package contracts with shared tsdown/Rolldown
  primitives while preserving source maps, executable entry points, and public
  multi-entry exports.
- Updated dependencies [9abc203]
- Updated dependencies [3ccd3e7]
  - @tpmjs/mcp-client@0.2.0
