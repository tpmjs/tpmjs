# @tpmjs/cli

## 0.1.9

### Patch Changes

- 8bd487e: Remove unused runtime dependencies and unreachable package internals so published installs and declarations match the maintained execution paths. Public APIs and behavior are unchanged.
- 6a8b2a5: Build the CLI with the shared tsdown/Rolldown contract while preserving its
  command manifest and public exports.
- 9585d08: Route `tpm tool execute` through the canonical registry execution contract, accept
  stable `package::toolName` identifiers, reject ambiguous legacy names, honor the
  configured timeout, and expose registry tools safely from the local MCP server.
  Tabs now implement roving focus plus Arrow, Home, and End keyboard navigation.
