# Contributing to TPMJS

Thank you for your interest in contributing to TPMJS! This guide will help you get started.

## Prerequisites

- **Node.js**: 22.x or higher
- **pnpm**: 10.x or higher
- **Git**: Latest stable version

Install pnpm globally if you haven't already:

```bash
npm install -g pnpm@10
```

## Getting Started

1. **Fork and clone the repository:**

```bash
git clone https://github.com/YOUR_USERNAME/tpmjs.git
cd tpmjs
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Set up environment variables:**

```bash
cp .env.example apps/web/.env.local
# Edit .env.local with your database credentials
# (start a local Postgres container first — see packages/db/README.md)
```

4. **Generate Prisma client:**

```bash
pnpm --filter=@tpmjs/db db:generate
```

5. **Run development server:**

```bash
pnpm dev --filter=@tpmjs/web
```

## Development Workflow

### Running Commands

```bash
# Start dev server for web app
pnpm dev --filter=@tpmjs/web

# Run tests
pnpm test

# Type-check all packages
pnpm type-check

# Lint all packages
pnpm lint

# Format all files
pnpm format

# Build all packages
pnpm build
```

### Testing Individual Packages

```bash
# Test a specific package
pnpm --filter=@tpmjs/ui test
pnpm --filter=@tpmjs/web type-check
pnpm --filter=@tpmjs/utils lint
```

### Database Commands

```bash
# Generate Prisma client after schema changes
pnpm --filter=@tpmjs/db db:generate

# Push schema changes to database (dev)
pnpm --filter=@tpmjs/db db:push

# Create migrations (production)
pnpm --filter=@tpmjs/db db:migrate

# Open Prisma Studio
pnpm --filter=@tpmjs/db db:studio
```

## Creating Tool Packages

Tool packages wrap external APIs and services for AI agents. Follow these guidelines:

### Package Structure

```
packages/tools/official/your-tool/
├── src/
│   ├── index.ts           # Main exports
│   ├── tool.ts            # Tool implementation
│   └── types.ts           # TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

### Naming Convention

- **Package name**: `@tpmjs/tools-{service-name}` (e.g., `@tpmjs/tools-github`)
- **Directory**: `packages/tools/official/{service-name}/`
- Use lowercase, hyphenated names

### Package.json Template

```json
{
  "name": "@tpmjs/tools-your-tool",
  "version": "0.1.0",
  "description": "TPMJS tool for YourService API",
  "license": "MIT",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@tpmjs/types": "workspace:*"
  },
  "devDependencies": {
    "@tpmjs/tsconfig": "workspace:*",
    "typescript": "^5.7.2"
  }
}
```

### Import Rules

**No barrel exports** - always use direct imports:

```typescript
// Good
import { Button } from '@tpmjs/ui/Button/Button';
import { TpmjsToolDefinition } from '@tpmjs/types/tpmjs';

// Bad (not allowed)
import { Button } from '@tpmjs/ui';
import { TpmjsToolDefinition } from '@tpmjs/types';
```

### Code Example

Tools are authored with the Vercel AI SDK's `tool()` helper (the `ai` package): a `description`, an `inputSchema`, and an `execute` function. This is the shape from the real official tool `packages/tools/official/csv-parse/src/index.ts`:

```typescript
import { jsonSchema, tool } from 'ai';

type YourToolInput = {
  query: string;
};

export const yourTool = tool({
  description: 'What this tool does',
  inputSchema: jsonSchema<YourToolInput>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Query parameter',
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute({ query }) {
    // Implementation
    return { result: 'success' };
  },
});

export default yourTool;
```

The export name (`yourTool`) is what gets listed in the package's `tpmjs.tools[].name`. See `packages/tools/official/csv-parse/` for a complete working example, including its `package.json` `tpmjs` field.

## Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Write clean, well-documented code
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed

### 3. Create Changeset

If your changes affect published packages, create a changeset:

```bash
pnpm changeset
```

Select the packages that changed and describe the changes. Choose the appropriate version bump:

- **patch**: Bug fixes, minor improvements
- **minor**: New features, non-breaking changes
- **major**: Breaking changes

Commit the generated `.changeset/*.md` file with your change — release intent is tracked in git. For the full release flow, the provenance/dry-run gate (`pnpm release:preview`), and rollback, see [RELEASING.md](./RELEASING.md).

### 4. Pre-commit Checks

Before committing, lefthook will automatically run:

- **Format**: Biome formats staged files
- **Lint**: ESLint checks all packages
- **Type-check**: TypeScript validates all packages

You can run these manually:

```bash
pnpm format
pnpm lint
pnpm type-check
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve bug in component"
```

Use conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

### 6. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a pull request on GitHub with:
- Clear description of changes
- Reference to related issues
- Screenshots for UI changes
- Checklist of completed tasks

## Code Style

### Formatting

All code is formatted with **Biome**. Run `pnpm format` to auto-format.

Configuration: `packages/config/biome.json`

### Linting

ESLint enforces:
- Module boundaries (packages can't import from apps)
- No barrel exports (direct imports only)
- TypeScript best practices

Configuration: `packages/eslint-config/`

### TypeScript

- Use **strict mode** everywhere
- Prefer `type` over `interface` for simple types
- Use `interface` for extendable object shapes
- Avoid `any` - use `unknown` or proper types

## Testing

### Unit Tests

```bash
# Run tests for a package
pnpm --filter=@tpmjs/ui test

# Run tests in watch mode
pnpm --filter=@tpmjs/ui test -- --watch
```

### Writing Tests

Use Vitest and Testing Library:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## Module Boundaries

ESLint enforces these rules:

- Apps can import from published packages only
- Packages cannot import from apps
- `@tpmjs/ui` cannot import from other packages (stays dependency-free)
- Always use direct imports, never barrel exports

```typescript
// Good
import { Button } from '@tpmjs/ui/Button/Button';
import { cn } from '@tpmjs/utils/cn/cn';

// Bad - violates module boundaries
import { api } from '../../apps/web/src/lib/api';

// Bad - barrel export not allowed
import { Button } from '@tpmjs/ui';
```

## Architecture Principles

### 1. Design System First

Always use `@tpmjs/ui` components instead of raw HTML:

```typescript
// Good
import { Button } from '@tpmjs/ui/Button/Button';
<Button onClick={handleClick}>Submit</Button>

// Bad
<button onClick={handleClick}>Submit</button>
```

### 2. Type Safety

- Use Zod for runtime validation
- Use TypeScript for compile-time safety
- Share types between packages via `@tpmjs/types`

### 3. Separation of Concerns

- UI components in `@tpmjs/ui`
- Utility functions in `@tpmjs/utils`
- Types and schemas in `@tpmjs/types`
- Business logic in `apps/web`

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/tpmjs/tpmjs/issues) — questions, bug reports, and feature requests all welcome

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

By contributing to TPMJS, you agree that your contributions will be licensed under the MIT License.
