# TPMJS OpenCode Configuration

This file contains project-specific rules and guidance for OpenCode agents working in the TPMJS monorepo.

## Repository Overview

TPMJS is a Turborepo monorepo for AI tool discovery and registry. Key characteristics:
- **Package Manager**: pnpm with workspace configuration
- **Build System**: Turborepo for task orchestration
- **Main App**: Next.js 16 App Router (`apps/web`)
- **Component Library**: `.ts`-only React components (`packages/ui`)
- **Database**: Prisma with PostgreSQL (`packages/db`)
- **Tool Registry**: npm package discovery and metadata sync

## Core Commands (Always Use These)

```bash
# Development
pnpm dev                    # Start all dev servers
pnpm --filter=@tpmjs/web dev  # Start web app only

# Building (Respects Dependencies)
pnpm build                  # Build all packages
pnpm --filter=@tpmjs/ui build  # Build specific package
pnpm --filter=@tpmjs/web... build  # Build web + all dependencies

# Testing & Quality
pnpm test                   # Run all tests
pnpm lint                   # Lint all packages
pnpm format                 # Format with Biome
pnpm type-check             # TypeScript checking
```

## Architecture Rules (Critical)

### Module Boundaries
- **Apps** (`apps/*`) can only import from published packages (`@tpmjs/*`)
- **Packages** (`packages/*`) cannot import from apps
- **UI Package** (`packages/ui`) cannot import from utils (stays dependency-free)
- **No barrel exports** - always import directly: `@tpmjs/ui/Button/Button`

### Component Usage
**ALWAYS use `@tpmjs/ui` components instead of raw HTML:**
```typescript
// Good
import { Button } from '@tpmjs/ui/Button/Button';
import { Input } from '@tpmjs/ui/Input/Input';

// Bad
<button onClick={handleClick}>Submit</button>
<input value={value} onChange={onChange} />
```

### TypeScript Configuration
- All packages extend from `@tpmjs/tsconfig`
- Strict mode enabled
- Composite projects for proper dependency resolution

## Package Structure

### Published Packages (@tpmjs scope)
- `@tpmjs/ui` - React component library (.ts-only, createElement)
- `@tpmjs/utils` - Utility functions (cn, format, etc.)
- `@tpmjs/types` - Shared TypeScript types and Zod schemas
- `@tpmjs/env` - Environment variable validation with Zod

### Internal Tooling (Private)
- `@tpmjs/config` - Shared configurations (Biome, ESLint, Tailwind, TypeScript)
- `@tpmjs/test` - Vitest shared configuration
- `@tpmjs/mocks` - MSW mock server for testing
- `@tpmjs/storybook` - Component documentation

### Applications
- `@tpmjs/web` - Next.js 16 App Router (main website)
- `@tpmjs/playground` - Tool testing playground
- `apps/tutorial` - Tutorial site
- `apps/railway-executor` - Deno tool executor (the default executor; "railway" name is historical — it runs on-box)

## Development Workflow

### Before Making Changes
1. Run `pnpm type-check` to ensure clean state
2. Check existing patterns in similar files
3. Use `@tpmjs/ui` components for any UI changes

### After Making Changes
1. `pnpm lint` - Check linting
2. `pnpm type-check` - Verify TypeScript
3. `pnpm test` - Run tests if applicable
4. `pnpm format` - Auto-format with Biome

### Database Changes
If modifying Prisma schema:
```bash
pnpm --filter=@tpmjs/db db:generate  # Regenerate client
pnpm --filter=@tpmjs/db db:push      # Apply changes (dev)
```

## Tool Development

### Tool Package Structure
Tools live in `packages/tools/*` with this pattern:
```
packages/tools/tool-name/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Main export
│   ├── tool.ts           # Tool definition
│   └── implementation.ts  # Actual logic
├── README.md
└── examples/
    └── basic.ts
```

### Tool Metadata
Tools must have proper `tpmjs` field in package.json:
```json
{
  "tpmjs": {
    "category": "text-analysis",
    "tier": "rich",
    "description": "Tool description"
  }
}
```

## Quality Standards

### Code Quality
- No `any` types or `@ts-ignore`
- Strict TypeScript compliance
- Proper error handling with try/catch
- Meaningful variable names

### Testing
- Unit tests for utilities
- Integration tests for API routes
- Component tests for UI changes
- Use Vitest + Testing Library

### Documentation
- README for all packages
- JSDoc for public APIs
- Examples for tool usage
- Type definitions for all public interfaces

## Common Patterns

### API Routes
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@tpmjs/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    // Implementation
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Component Pattern
```typescript
import { createElement } from 'react';
import { cn } from '@tpmjs/utils';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Button({ onClick, children, className }: ButtonProps) {
  return createElement('button', {
    onClick,
    className: cn('default-styles', className),
  }, children);
}
```

## What NOT to Do

- **Never edit lockfiles** unless explicitly requested
- **Never use barrel exports** (`index.ts` files)
- **Never suppress TypeScript errors** with `as any` or `@ts-ignore`
- **Never use raw HTML elements** when `@tpmjs/ui` components exist
- **Never import from apps** in packages
- **Never commit without running** `pnpm lint` and `pnpm type-check`

## Deployment & CI

- Production runs ON-BOX as podman Quadlet services (quadlets in the `donto-infra` repo, `/mnt/donto-data/workspace/donto-infra/quadlets/tpmjs-*.container`) — NOT Vercel/Railway (both legacy, pending decommission; git deploys to Vercel are gated off)
- There is NO auto-deploy: ship by rebuilding the image (`podman build --build-arg APP=web -f donto-infra/build/tpmjs.Dockerfile`) and `sudo systemctl restart tpmjs-web`
- CI is GitHub Actions (`.github/workflows/ci.yml`); pre-commit hooks run `format`, `lint`, and `type-check` — if hooks pass locally, CI should pass
- Debug production with `sudo podman logs <tpmjs-web|tpmjs-playground|...>` and `journalctl -u <unit>`; check `https://tpmjs.com/api/health` to verify the app is up
- The database is the self-hosted `tpmjs-pg` PostgreSQL 17 container on the same box (`127.0.0.1:5435` from the host; migrated off Neon 2026-07-14) — see `CLAUDE.md` for connection details

## Getting Help

- Check existing implementations in similar packages
- Use `pnpm --filter=<package> dev` for package-specific development
- Refer to `CLAUDE.md` for detailed architectural decisions
- Look at `packages/tools/*` for tool development examples