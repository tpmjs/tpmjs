# @tpmjs/types

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
