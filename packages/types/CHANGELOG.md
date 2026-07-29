# @tpmjs/types

## 0.3.0

### Minor Changes

- cdeaf8a: Define TPMJS Executor Protocol 1.1 with typed failure stages, stable error codes,
  retryability, strict Zod boundary schemas, and compliance checks that execute a
  pinned public fixture. Health consumers can now classify observations without
  parsing human-readable error messages.

### Patch Changes

- 3ccd3e7: Build the remaining non-UI package contracts with shared tsdown/Rolldown
  primitives while preserving source maps, executable entry points, and public
  multi-entry exports.

## 0.2.0

### Minor Changes

- Add new tool categories for 100+ official tools

  Added core categories used by the official TPMJS tools:

  - research, web, data, documentation, engineering
  - security, statistics, ops, agent, utilities
  - html, compliance, doc, text

  This fixes sync validation failures for tools using these categories.

## 0.1.2

### Patch Changes

- Add 'research' to valid TPMJS_CATEGORIES for package validation

## 0.1.1

### Patch Changes

- Initial release of TPMJS packages

  - @tpmjs/ui: React component library with .ts-only components (Button, Card)
  - @tpmjs/utils: Utility functions (cn for Tailwind class merging, format functions)
  - @tpmjs/types: TypeScript types and Zod schemas for tools and registry
  - @tpmjs/env: Environment variable validation with Zod

  All packages follow strict TypeScript practices and use ESM format.
