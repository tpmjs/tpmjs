# TPMJS Monorepo

Tool Package Manager for AI Agents - A Turborepo monorepo with strict TypeScript, Next.js 16, and best practices.

## Structure

```
apps/
  web/          - Next.js 16 App Router application
packages/
  config/       - Shared configurations (Biome, ESLint, Tailwind, TypeScript)
  ui/           - React component library (.ts-only, no barrels)
  utils/        - Utility functions
  types/        - Shared TypeScript types
  env/          - Zod environment schema loader
  test/         - Vitest shared configuration
  mocks/        - MSW mock server
  storybook/    - Storybook documentation
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Installation

```bash
pnpm install
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter @tpmjs/web dev
pnpm --filter @tpmjs/storybook dev
```

### Building

```bash
# Build all packages and apps
pnpm build

# Build specific package
pnpm --filter @tpmjs/ui build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode with UI
pnpm test:ui
```

### Linting & Formatting

```bash
# Lint all packages
pnpm lint

# Format all files
pnpm format

# Check formatting
pnpm format:check
```

## Component Usage

Components are imported directly without barrel exports:

```typescript
import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardHeader } from '@tpmjs/ui/Card/Card';
```

**Important:** All UI components use `.ts` extension (not `.tsx`) and use `createElement` instead of JSX.

## Publishing Workflow

### 1. Create Changesets

After making changes to publishable packages:

```bash
pnpm changeset
```

Follow the prompts to describe your changes and select which packages are affected.

### 2. Version Packages

When ready to release:

```bash
pnpm changeset:version
```

This updates package versions and generates CHANGELOGs.

### 3. Publish to npm

```bash
pnpm changeset:publish
```

This builds and publishes all packages with changesets to npm.

### 4. Push to GitHub

```bash
git push --follow-tags
```

## Published Packages

- `@tpmjs/ui` - React component library
- `@tpmjs/utils` - Utility functions
- `@tpmjs/types` - TypeScript types
- `@tpmjs/env` - Environment schema loader

## Module Boundaries

ESLint enforces module boundaries:

- Apps can import from published packages only
- Packages cannot import from apps
- No barrel exports (`index.ts`) allowed
- Direct imports required: `@tpmjs/ui/Button/Button`

## Architecture Decisions

### Why .ts-only Components?

Using `.ts` instead of `.tsx` for React components:
- Enforces explicit `createElement` calls
- Makes React's runtime nature more visible
- Prevents JSX spreading anti-patterns
- Better for code generation and tooling

### Why No Barrel Exports?

- Clearer dependency graphs
- Better tree-shaking
- Explicit imports show what's actually used
- Prevents circular dependencies

### Why Biome + ESLint?

- Biome: Fast formatting and basic linting
- ESLint: Semantic rules (module boundaries, TypeScript strictness)
- Each tool focuses on what it does best

## Scripts Reference

- `dev` - Start development servers
- `build` - Build all packages
- `test` - Run tests
- `test:ui` - Run tests with UI
- `lint` - Lint code
- `format` - Format code with Biome
- `format:check` - Check formatting
- `type-check` - TypeScript type checking
- `clean` - Remove build artifacts
- `changeset` - Create a changeset
- `changeset:version` - Version packages
- `changeset:publish` - Publish to npm

## License

MIT
