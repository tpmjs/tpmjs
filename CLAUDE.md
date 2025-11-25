# TPMJS - Tool Package Manager for AI Agents

## Philosophy

TPMJS is a registry and package manager for AI agent tools. Just as npm transformed how developers share and consume JavaScript packages, TPMJS aims to do the same for the emerging ecosystem of AI agent tooling.

### The Problem We're Solving

AI agents are becoming increasingly capable, but they face a fundamental challenge: **tool discovery and selection at scale**.

1. **Context Window Limitations** - When an agent has access to 10+ tools, LLMs struggle to remember and correctly select from all available options. Tool schemas consume precious context tokens.

2. **Tool Hallucination** - Models sometimes attempt to call tools that don't exist, or use incorrect parameter schemas, leading to failed executions and poor user experiences.

3. **Static Tool Sets** - Most agent implementations hardcode their available tools at build time. There's no standard way to discover, add, or share tools dynamically.

4. **Fragmented Ecosystem** - Developers building AI agents are recreating the same tools (web search, file operations, API integrations) over and over. There's no central place to share and discover production-ready implementations.

### Our Vision

We believe AI agent development should be:

- **Elegant** - Simple APIs, clear conventions, minimal boilerplate
- **Productive** - Leverage community-built tools instead of reinventing wheels
- **Safe** - Vetted tools with clear security boundaries and permissions

## Core Concepts

### Tools
A tool is a capability that an AI agent can invoke. Tools have:
- A unique name/identifier
- A description (used for semantic search and LLM understanding)
- A parameter schema (typically defined with Zod or JSON Schema)
- An implementation function

### Registry
The registry is the central index of available tools. It enables:
- Browsing by category
- Semantic search (find tools by what they do, not just their name)
- Version management
- Usage analytics

### Meta-Tools
Meta-tools are tools that help agents work with other tools. The most important is `tool-search`, which allows an agent to query the registry and load only the tools relevant to its current task. This "search-then-execute" pattern dramatically improves accuracy and token efficiency.

## How It Works

### The Search-Then-Execute Pattern

Instead of loading all tool schemas into context upfront (expensive and error-prone), agents using TPMJS:

1. **Search** - Use the `tool-search` meta-tool to find relevant tools based on the current task
2. **Load** - Dynamically load only the matched tools into context
3. **Execute** - Make a follow-up call with the focused tool set

This pattern:
- Reduces token usage (only load what you need)
- Improves selection accuracy (smaller choice set)
- Eliminates hallucination (tools are confirmed to exist before use)
- Enables runtime flexibility (tools can be added/removed without restarts)

## Technical Details

### Compatibility
- TypeScript-first with full type safety via Zod schemas
- Compatible with Anthropic AI SDK, OpenAI, and other major providers
- Minimal footprint (~340 tokens for the meta-tool)

### Scale
- Supports registries with 1,000+ tools
- Sub-2ms search latency
- Semantic search, fuzzy matching, and category filtering

## Categories

Tools in the registry span:
- Web & APIs
- Databases
- Documents
- Images
- Email
- Calendar
- Search
- Code Execution
- Communication
- Analytics
- Security
- Workflows

## Development Notes

This project is in early development. Key areas to work on:

- [ ] Core registry API design
- [ ] Tool schema specification
- [ ] CLI for publishing and discovering tools
- [ ] SDK integrations (Anthropic, OpenAI, etc.)
- [ ] Search algorithm (semantic + fuzzy matching)
- [ ] Security model and sandboxing
- [ ] Documentation and examples

## Open Questions

1. **Trust & Security** - How do we vet tools? What sandboxing is needed?
2. **Versioning** - How do tools handle breaking changes?
3. **Monetization** - Free tier + Pro? Marketplace cuts?
4. **Governance** - Who decides what gets published? Moderation?
5. **Offline/Local** - Can tools be cached locally? Private registries?

---

*"The registry for AI tools. Discover, share, and integrate tools that give your agents superpowers."*

---

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

#### 1. .ts-only React Components

All UI components use `.ts` extension instead of `.tsx` and utilize `createElement`:

```typescript
import { createElement, forwardRef } from 'react';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => createElement('button', { ref, ...props })
);
```

**Why?**
- Explicit runtime behavior
- Prevents JSX spreading anti-patterns
- Better for code generation
- Forces consideration of every prop

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

### Component Development

1. Create component in `packages/ui/src/ComponentName/ComponentName.ts`
2. Use `.ts` extension with `createElement`
3. Add tests in `ComponentName.test.ts`
4. Export in `package.json` exports map
5. Add Storybook story in `packages/storybook/stories/`

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
- **React:** v19 with .ts-only components
- **Next.js:** v16 App Router
- **Styling:** Tailwind CSS
- **Testing:** Vitest + Testing Library
- **Linting:** Biome + ESLint
- **Documentation:** Storybook
- **CI/CD:** GitHub Actions + Changesets
- **Git Hooks:** Lefthook
