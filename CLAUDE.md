
## Monorepo Setup

This project uses a Turborepo monorepo architecture with the following structure:

### Packages

**Published to npm (@tpmjs scope):**
- `@tpmjs/ui` - React component library with .ts-only components
- `@tpmjs/utils` - Utility functions (cn, format, etc.)
- `@tpmjs/types` - Shared TypeScript types and Zod schemas
- `@tpmjs/env` - Environment variable validation with Zod

**Internal tooling (private):**
- `@tpmjs/config` - Shared configurations (Biome, ESLint, Tailwind, TypeScript)
- `@tpmjs/eslint-config` - ESLint configuration with module boundary rules
- `@tpmjs/tailwind-config` - Tailwind configuration with design tokens
- `@tpmjs/tsconfig` - TypeScript configurations (base, nextjs, react-library)
- `@tpmjs/test` - Vitest shared configuration
- `@tpmjs/mocks` - MSW mock server for testing
- `@tpmjs/storybook` - Component documentation and showcase

### Applications

- `@tpmjs/web` - Next.js 16 App Router application (main website)

### Architecture Principles



#### 2. No Barrel Exports

Components are imported directly without `index.ts` files:

```typescript
// Good
import { Button } from '@tpmjs/ui/Button/Button';

// Bad (not allowed)
import { Button } from '@tpmjs/ui';
```

**Benefits:**
- Clearer dependency graphs
- Better tree-shaking
- Prevents circular dependencies
- Explicit imports

#### 3. Module Boundaries

ESLint enforces strict module boundaries:
- Apps can only import from published packages
- Packages cannot import from apps
- UI package cannot import from utils (stays dependency-free)

#### 4. Shared Configurations

All configuration is centralized in `packages/config/`:
- **Biome** - Formatting + basic linting
- **ESLint** - Semantic rules and module boundaries
- **Tailwind** - Design tokens and shared theme
- **TypeScript** - Multiple configs for different contexts

### Development Workflow

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format
```


### Publishing Flow

1. Make changes to packages
2. Create changeset: `pnpm changeset`
3. Version packages: `pnpm changeset:version`
4. Publish to npm: `pnpm changeset:publish`
5. Push with tags: `git push --follow-tags`

### Tech Stack

- **Build System:** Turborepo
- **Package Manager:** pnpm
- **TypeScript:** Strict mode, composite projects
- **React:** v19 
- **Next.js:** v16 App Router
- **Styling:** Tailwind CSS
- **Testing:** Vitest + Testing Library
- **Linting:** Biome + ESLint
- **Documentation:** Storybook
- **CI/CD:** GitHub Actions + Changesets
- **Git Hooks:** Lefthook

### Debugging CI/CD with CLI Tools

When debugging CI failures or deployment issues, use command-line tools for efficient investigation:

#### GitHub CLI (`gh`)

Debug GitHub Actions CI runs:

```bash
# List recent workflow runs
gh run list --limit 10

# View specific run details
gh run view <run-id>

# View failed job logs
gh run view <run-id> --log-failed

# View specific job logs
gh run view <run-id> --job <job-id> --log

# Rerun failed jobs
gh run rerun <run-id> --failed
```

**Common debugging workflow:**
1. `gh run list` - Find the failed run ID
2. `gh run view <run-id> --log-failed` - See what failed
3. Fix the issue locally
4. Push and monitor: `gh run watch`

#### Vercel CLI

Debug deployments and preview environments:

```bash
# List deployments
vercel ls

# View deployment details
vercel inspect <deployment-url>

# View deployment logs
vercel logs <deployment-url>

# Pull environment variables
vercel env pull

# Link local project to Vercel project
vercel link
```

**Common debugging workflow:**
1. `vercel ls` - Find the deployment URL
2. `vercel inspect <url>` - Check deployment status and build logs
3. `vercel logs <url>` - View runtime logs
4. Compare env vars: `vercel env pull` and check `.env.local`

#### Tips

- Use `gh` and `vercel` CLIs to debug without leaving the terminal
- Check CI logs before making blind fixes
- Vercel deployments are blocked until GitHub Actions pass (configured in vercel.json)
- Pre-commit/pre-push hooks run the same checks as CI - if they pass locally, CI should pass too
