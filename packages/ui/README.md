# @tpmjs/ui

The React component library that powers the [TPMJS](https://tpmjs.com) web surfaces — the protocol-agnostic tool layer for AI agents.

<p>
  <a href="https://www.npmjs.com/package/@tpmjs/ui"><img src="https://img.shields.io/npm/v/@tpmjs/ui.svg" alt="npm version"></a>
  <a href="https://github.com/tpmjs/tpmjs/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tpmjs/tpmjs" alt="License"></a>
</p>

A typed, tree-shakeable set of React components and hooks — primitives (Button, Card, Input, Badge), layout (Container, Section, GridContainer), overlays (Modal, Drawer, Popover, Tooltip), form controls (Select, Checkbox, Radio, Switch, Slider), and TPMJS-specific pieces (ToolCard, QualityScore, ToolHealthBadge, and the streaming `ToolRenderer`). It's the internal design system behind the TPMJS site, published so apps and consumers can render the same surfaces. Built for React 18/19 with per-component subpath exports.

## Installation

```bash
npm install @tpmjs/ui react react-dom
# or
pnpm add @tpmjs/ui react react-dom
```

`react` and `react-dom` (`^18` or `^19`) are peer dependencies. Components are imported by subpath — there is no root barrel — which keeps bundles small.

## Usage

### Primitives

```tsx
import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@tpmjs/ui/Card/Card';
import { Badge } from '@tpmjs/ui/Badge/Badge';

function ToolPanel() {
  return (
    <Card variant="elevated" padding="md">
      <CardHeader>
        <CardTitle>Firecrawl Scrape</CardTitle>
        <Badge variant="success">healthy</Badge>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="lg" loading={false} onClick={run}>
          Run tool
        </Button>
      </CardContent>
    </Card>
  );
}
```

`Button` supports `variant` (`default` · `destructive` · `outline` · `outline-dotted` · `secondary` · `ghost` · `link` · `blueprint`), `size` (`sm` · `md` · `lg` · `icon`), and a `loading` flag. `Badge` variants include `success`, `error`, `warning`, and `info`.

### Rendering agent tool calls

`ToolRenderer` renders an AI SDK tool-call/result part, dispatching to a registered renderer (or a default JSON view). Register the built-in TPMJS renderers once at startup.

```tsx
import { ToolRenderer } from '@tpmjs/ui/ToolRenderer/ToolRenderer';
import { registerBuiltInRenderers } from '@tpmjs/ui/ToolRenderer/registerBuiltInRenderers';

registerBuiltInRenderers(); // adds RegistrySearch / RegistryExecute renderers

function Message({ part }) {
  return <ToolRenderer part={part} isStreaming={false} />;
}
```

Register your own renderer for a tool via `toolRendererRegistry` from `@tpmjs/ui/ToolRenderer/registry` (each config has a `match(toolName)`, optional `priority`, and a `component`).

### Hooks

```tsx
import { useCountUp } from '@tpmjs/ui/system/hooks/useCountUp';
import { useScrollReveal } from '@tpmjs/ui/system/hooks/useScrollReveal';
```

## Components

Imported as `@tpmjs/ui/<Name>/<Name>`. Selected exports:

- **Primitives** — `Button`, `Input`, `Textarea`, `Label`, `Badge`, `Icon`, `Spinner`, `Card` (+ `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`).
- **Layout** — `Container`, `Section`, `GridContainer`, `Header`, `PageHeader`.
- **Form controls** — `Select`, `Checkbox`, `Radio` (+ `RadioGroup`), `Switch`, `Slider`, `FormField`.
- **Overlays & navigation** — `Modal`, `Drawer`, `Popover`, `Tooltip`, `Toast`, `DropdownMenu`, `Tabs`, `Accordion`, `Breadcrumbs`, `Pagination`.
- **Feedback & states** — `ProgressBar`, `Skeleton`, `EmptyState`, `ErrorState`, `LoadingState`.
- **Data & display** — `Table`, `CodeBlock`, `StatCard`, `AnimatedCounter`, `InstallSnippet`.
- **TPMJS-specific** — `ToolCard`, `QualityScore`, `ToolHealthBadge`, `ToolHealthBanner`, `ActivityStream`, `FlowDiagram`, and the `ToolRenderer` system (`ToolRenderer`, `toolRendererRegistry`, `registerBuiltInRenderers`, `DefaultJsonRenderer`, `RegistrySearchRenderer`, `RegistryExecuteRenderer`).
- **Effects** — `DitherCanvas`, `DitherHeadline`, `DitherSectionHeader`.
- **Hooks** (`@tpmjs/ui/system/hooks/<name>`) — `useScrollReveal`, `useCountUp`, `useParallax`, `useReducedMotion`, `useDitherAnimation`.

Each component ships its own `.d.ts`; props types (e.g. `ButtonProps`, `BadgeProps`, `CodeBlockProps`) are exported from the same module.

## Links

- [TPMJS](https://tpmjs.com)
- [Docs](https://tpmjs.com/docs)
- [Repository](https://github.com/tpmjs/tpmjs) — package at `packages/ui`

## License

MIT
