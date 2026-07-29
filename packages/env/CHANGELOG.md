# @tpmjs/env

## 0.1.2

### Patch Changes

- 3ccd3e7: Build the remaining non-UI package contracts with shared tsdown/Rolldown
  primitives while preserving source maps, executable entry points, and public
  multi-entry exports.

## 0.1.1

### Patch Changes

- Initial release of TPMJS packages

  - @tpmjs/ui: React component library with .ts-only components (Button, Card)
  - @tpmjs/utils: Utility functions (cn for Tailwind class merging, format functions)
  - @tpmjs/types: TypeScript types and Zod schemas for tools and registry
  - @tpmjs/env: Environment variable validation with Zod

  All packages follow strict TypeScript practices and use ESM format.
