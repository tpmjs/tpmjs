# TPMJS

[![CI](https://github.com/tpmjs/tpmjs/actions/workflows/ci.yml/badge.svg)](https://github.com/tpmjs/tpmjs/actions/workflows/ci.yml)

**TPMJS is a registry for discovering AI tools published to npm.**

Browse, search, and find tools at [tpmjs.com](https://tpmjs.com). Publish your tool by adding the `tpmjs` keyword to your package.json—it appears in the registry within 15 minutes.

## Why TPMJS?

- **Discover tools** - Search and browse AI tools by category, quality score, and popularity
- **Publish easily** - Add one keyword to package.json, publish to npm, done
- **Quality metrics** - Tools are scored based on documentation, downloads, and metadata completeness
- **Agent integration** - Optional SDK for agents to search and execute tools at runtime

## Quick Start

### Publishing a Tool

```bash
npx @tpmjs/create-basic-tools
```

Or add manually to your package.json:
```json
{
  "keywords": ["tpmjs"],
  "tpmjs": {
    "category": "text-analysis"
  }
}
```

Publish to npm and your tool appears on [tpmjs.com](https://tpmjs.com) within 15 minutes.

See [HOW_TO_PUBLISH_A_TOOL.md](./HOW_TO_PUBLISH_A_TOOL.md) for the full guide.

### For AI Agents (Optional)

Agents can search and execute tools from the registry:

```bash
npm install @tpmjs/registry-search @tpmjs/registry-execute
```

```typescript
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';

// Add to your agent's tools
const tools = [registrySearchTool, registryExecuteTool];
```

---

## Monorepo Structure

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

- Node.js >= 22 (LTS)
- pnpm >= 8
- nvm (recommended for Node version management)

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

### Quality Gates

```bash
# Check architecture/dependency rules
pnpm check-architecture

# Find unused code and dependencies
pnpm find-deadcode

# Check type coverage
pnpm type-coverage
```

See [QUALITY-GATES.md](./QUALITY-GATES.md) for details.

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

## Deployment

The project is configured to only deploy to Vercel when all CI checks pass. This ensures production always has high-quality, tested code.

**CI Checks:**
- Linting & formatting
- Type checking
- Tests
- Production build
- Architecture validation
- Dead code detection

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full configuration details.

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
- `type-coverage` - Check type coverage (no implicit any)
- `check-architecture` - Validate dependency rules
- `find-deadcode` - Find unused code/dependencies
- `clean` - Remove build artifacts
- `changeset` - Create a changeset
- `changeset:version` - Version packages
- `changeset:publish` - Publish to npm

## License

MIT
