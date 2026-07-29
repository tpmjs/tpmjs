# @tpmjs/create-basic-tools

## 1.0.8

### Patch Changes

- 8bd487e: Remove unused runtime dependencies and unreachable package internals so published installs and declarations match the maintained execution paths. Public APIs and behavior are unchanged.
- 3ccd3e7: Build the remaining non-UI package contracts with shared tsdown/Rolldown
  primitives while preserving source maps, executable entry points, and public
  multi-entry exports.

## 1.0.0

### Major Changes

- Initial release of @tpmjs/create-basic-tools - CLI generator for scaffolding production-ready TPMJS tool packages

  Features:

  - Interactive CLI with beautiful prompts using @clack/prompts
  - Generates packages with minimum 2 tools (ideally 2-3)
  - Zod 4 schemas - uses Zod directly (not jsonSchema wrapper)
  - One file per tool in src/tools/<toolName>.ts
  - TPMJS validated against official schemas from @tpmjs/types
  - Complete package generation ready to publish to npm
  - Works both standalone and in monorepo packages/ folders
