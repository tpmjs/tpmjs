# @tpmjs/ui

## 0.1.4

### Patch Changes

- cfa3730: Make DitherCanvas hydration deterministic and ensure static or reduced-motion
  canvases render frames generated after the browser hydration boundary.
- 8bd487e: Remove unused runtime dependencies and unreachable package internals so published installs and declarations match the maintained execution paths. Public APIs and behavior are unchanged.
- 9585d08: Route `tpm tool execute` through the canonical registry execution contract, accept
  stable `package::toolName` identifiers, reject ambiguous legacy names, honor the
  configured timeout, and expose registry tools safely from the local MCP server.
  Tabs now implement roving focus plus Arrow, Home, and End keyboard navigation.
- Updated dependencies [8bd487e]
- Updated dependencies [3ccd3e7]
  - @tpmjs/utils@0.1.2

## 0.1.3

### Patch Changes

- refactor(ui): convert all components from createElement to JSX syntax

  All UI components now use JSX instead of createElement for better readability and maintainability.

## 0.1.2

### Patch Changes

- Fix test setup by adding @testing-library/jest-dom matchers for proper DOM assertions in Vitest

## 0.1.1

### Patch Changes

- Initial release of TPMJS packages

  - @tpmjs/ui: React component library with .ts-only components (Button, Card)
  - @tpmjs/utils: Utility functions (cn for Tailwind class merging, format functions)
  - @tpmjs/types: TypeScript types and Zod schemas for tools and registry
  - @tpmjs/env: Environment variable validation with Zod

  All packages follow strict TypeScript practices and use ESM format.

- Updated dependencies
  - @tpmjs/utils@0.1.1
