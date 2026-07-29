# @tpmjs/mcp-client

## 0.2.0

### Minor Changes

- 9abc203: Add Streamable HTTP and legacy SSE connections, protocol-aware fallback,
  request-scoped connection timeouts, negotiated transport reporting, and
  leak-free failure cleanup while preserving the existing stdio API. Teach the
  bridge CLI to describe either local commands or remote URLs in its server list.

### Patch Changes

- 3ccd3e7: Build the remaining non-UI package contracts with shared tsdown/Rolldown
  primitives while preserving source maps, executable entry points, and public
  multi-entry exports.
