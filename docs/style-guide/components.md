# TPMJS UI Component Catalog

Brutalist aesthetic, copper (#A6592D) accent, sharp corners (0 border-radius default), monospace button text, Tailwind CSS. Components use `createVariants()` for type-safe class composition.

**Import pattern** (no barrel exports):
```tsx
import { Button } from '@tpmjs/ui/Button/Button';
```

---

## Actions

### 1. Button

Primary action component. All text renders lowercase monospace.

**Import:** `import { Button } from '@tpmjs/ui/Button/Button'`

| Prop | Type | Default |
|------|------|---------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'outline-dotted' \| 'blueprint' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` |
| `size` | `'sm' (36px) \| 'md' (40px) \| 'lg' (44px) \| 'icon' (40x40)` | `'md'` |
| `loading` | `boolean` | `false` |

```tsx
<Button variant="outline" size="lg" onClick={handleClick}>Submit</Button>
<Button loading>Processing...</Button>
```

The `default` variant uses the copper primary. `link` variant removes padding. Focus ring uses the copper accent.

### 2. DropdownMenu

Contextual menu with Radix UI primitives. Sub-components: `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuRadioGroup`, `DropdownMenuSeparator`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuLabel`.

**Import:** `import { DropdownMenu, ... } from '@tpmjs/ui/DropdownMenu/DropdownMenu'`

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Options</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onSelect={handleEdit}>Edit</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={handleDelete}>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Communication

### 3. Badge

Small status indicator labels.

**Import:** `import { Badge } from '@tpmjs/ui/Badge/Badge'`

| Prop | Type | Default |
|------|------|---------|
| `variant` | `'default' \| 'secondary' \| 'outline' \| 'success' \| 'error' \| 'warning' \| 'info'` | `'default'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="error" size="sm">Broken</Badge>
```

### 4. Toast

Notification messages with auto-dismiss. Provides `Toast`, `ToastContainer`, and `useToast`.

**Import:** `import { Toast, ToastContainer, useToast } from '@tpmjs/ui/Toast/Toast'`

| Prop | Type | Default |
|------|------|---------|
| `open` | `boolean` | -- |
| `onClose` | `() => void` | -- |
| `variant` | `'default' \| 'success' \| 'error' \| 'warning' \| 'info'` | `'default'` |
| `duration` | `number` | `5000` (0 = manual dismiss) |
| `title` | `ReactNode` | -- |
| `description` | `ReactNode` | -- |
| `action` | `ReactNode` | -- |
| `showCloseButton` | `boolean` | `true` |

`ToastContainer` positions toasts: `'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'` (default `'bottom-right'`).

```tsx
const { toast } = useToast();
toast({ title: 'Saved', variant: 'success', duration: 3000 });
```

### 5. Tooltip

Hover/focus overlay positioned relative to trigger. Custom implementation with portal rendering.

**Import:** `import { Tooltip } from '@tpmjs/ui/Tooltip/Tooltip'`

| Prop | Type | Default |
|------|------|---------|
| `content` | `ReactNode` | -- |
| `placement` | `'top' \| 'top-start' \| 'top-end' \| 'bottom' \| ... \| 'left' \| ... \| 'right' \| ...` (12 positions) | `'top'` |
| `offset` | `number` | `6` |
| `showDelay` / `hideDelay` | `number` | `200` / `0` |
| `hasArrow` | `boolean` | `true` |

```tsx
<Tooltip content="Copy to clipboard" placement="bottom">
  <Button variant="ghost" size="icon"><Icon icon="copy" /></Button>
</Tooltip>
```

### 6. Spinner

Brutalist 3x3 grid-based loader with staggered pulse animation. Not an SVG spinner.

**Import:** `import { Spinner } from '@tpmjs/ui/Spinner/Spinner'`

| Prop | Type | Default |
|------|------|---------|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` |
| `label` | `string` | `'Loading...'` (sr-only) |

### 7. LoadingState

Spinner + optional message in a centered layout.

**Import:** `import { LoadingState } from '@tpmjs/ui/LoadingState/LoadingState'`

| Prop | Type | Default |
|------|------|---------|
| `message` | `string` | -- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |

### 8. EmptyState

Empty data placeholder with icon, title, description, and optional CTA.

**Import:** `import { EmptyState } from '@tpmjs/ui/EmptyState/EmptyState'`

| Prop | Type | Default |
|------|------|---------|
| `icon` | `IconName` | -- |
| `title` | `string` | -- |
| `description` | `string` | -- |
| `action` | `ReactNode` | -- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |

```tsx
<EmptyState
  icon="folder"
  title="No collections found"
  description="Create your first collection to get started."
  action={<Button>Create Collection</Button>}
/>
```

### 9. ErrorState

Error display with optional retry button.

**Import:** `import { ErrorState } from '@tpmjs/ui/ErrorState/ErrorState'`

| Prop | Type | Default |
|------|------|---------|
| `title` | `string` | `'Error'` |
| `message` | `string` | -- |
| `onRetry` | `() => void` | -- (shows "Try Again" button) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |

---

## Containment

### 10. Card

Content container. Sub-components: `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`.

**Import:** `import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@tpmjs/ui/Card/Card'`

| Prop | Type | Default |
|------|------|---------|
| `variant` | `'default' \| 'elevated' \| 'outline' \| 'blueprint' \| 'ghost' \| 'featured' \| 'brutalist'` | `'default'` |
| `padding` | `'none' \| 'sm' (16px) \| 'md' (24px) \| 'lg' (32px)` | `'md'` |

`CardTitle` accepts `as` for heading level (`h1`-`h6`, default `h3`). Sub-components also accept `padding`.

```tsx
<Card variant="outline" padding="lg">
  <CardHeader><CardTitle>Tool Details</CardTitle></CardHeader>
  <CardContent><p>Content here</p></CardContent>
  <CardFooter><Button>Install</Button></CardFooter>
</Card>
```

### 11. Modal

Dialog overlay with focus trap, scroll lock. Built on Radix UI Dialog.

**Import:** `import { Modal } from '@tpmjs/ui/Modal/Modal'`

| Prop | Type | Default |
|------|------|---------|
| `open` / `onClose` | `boolean` / `() => void` | -- |
| `title` | `ReactNode` | -- |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` |
| `closeOnBackdropClick` | `boolean` | `true` |
| `closeOnEscape` | `boolean` | `true` |
| `showCloseButton` | `boolean` | `true` |
| `footer` | `ReactNode` | -- |

### 12. Drawer

Side panel overlay. Built on Vaul. Provides `DrawerContent`, `DrawerHeader`, `DrawerTitle`.

**Import:** `import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@tpmjs/ui/Drawer/Drawer'`

### 13. Popover

Floating content panel relative to trigger. Built on Radix UI. Provides `PopoverTrigger`, `PopoverContent`.

**Import:** `import { Popover, PopoverTrigger, PopoverContent } from '@tpmjs/ui/Popover/Popover'`

### 14. Accordion

Collapsible content sections. Built on Radix UI. `type="single"` or `type="multiple"`.

**Import:** `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@tpmjs/ui/Accordion/Accordion'`

### 15. Section

Semantic page section wrapper with spacing and background options.

**Import:** `import { Section } from '@tpmjs/ui/Section/Section'`

| Prop | Type | Default |
|------|------|---------|
| `as` | `'section' \| 'article' \| 'aside' \| 'nav' \| 'div'` | `'section'` |
| `spacing` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` |
| `background` | `'default' \| 'surface' \| 'dotted-grid' \| 'blueprint' \| 'grid'` | `'default'` |
| `container` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'none'` |
| `centered` | `boolean` | `false` |

### 16. Container

Max-width content wrapper with horizontal padding.

**Import:** `import { Container } from '@tpmjs/ui/Container/Container'`

| Prop | Type | Default |
|------|------|---------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| 'full'` | `'xl'` |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` |

### 17. GridContainer

CSS Grid layout wrapper.

**Import:** `import { GridContainer } from '@tpmjs/ui/GridContainer/GridContainer'`

| Prop | Type | Default |
|------|------|---------|
| `columns` | `'auto' \| 1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 12` | `'auto'` |
| `gap` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` |
| `responsive` | `'responsive' \| 'fixed'` | `'responsive'` |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | `'start'` |

```tsx
<GridContainer columns={3} gap="lg">
  <ToolCard name="web-scraper" />
  <ToolCard name="sql-query" />
  <ToolCard name="pdf-generator" />
</GridContainer>
```

---

## Data Display

### 18. Table

Data table with semantic sub-components: `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableFooter`.

**Import:** `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@tpmjs/ui/Table/Table'`

| Prop | Type | Default |
|------|------|---------|
| `variant` | `'default' \| 'bordered'` | `'default'` |

### 19. StatCard

Metric display with animated counter and optional bar chart.

**Import:** `import { StatCard } from '@tpmjs/ui/StatCard/StatCard'`

| Prop | Type | Default |
|------|------|---------|
| `value` | `number` | -- |
| `label` | `string` | -- |
| `subtext` | `string` | -- |
| `prefix` / `suffix` | `string` | `''` |
| `separator` | `string` | `','` |
| `variant` | `'default' \| 'brutalist' \| 'minimal'` | `'default'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `showBar` | `boolean` | `false` |
| `barProgress` | `number` | `80` |

```tsx
<StatCard value={2847} label="Published Tools" variant="brutalist" showBar barProgress={85} />
```

### 20. ProgressBar

Horizontal progress indicator.

**Import:** `import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar'`

| Prop | Type | Default |
|------|------|---------|
| `value` | `number` (0-100) | -- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `variant` | `'primary' \| 'success' \| 'warning' \| 'danger'` | `'primary'` |
| `showLabel` | `boolean` | `false` |

### 21. Pagination

Page navigation with numbered pages, ellipsis, and prev/next.

**Import:** `import { Pagination } from '@tpmjs/ui/Pagination/Pagination'`

| Prop | Type | Default |
|------|------|---------|
| `page` | `number` (1-indexed) | -- |
| `totalPages` | `number` | -- |
| `onPageChange` | `(page: number) => void` | -- |
| `siblings` / `boundaries` | `number` | `1` / `1` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `variant` | `'default' \| 'simple' \| 'minimal'` | `'default'` |
| `showFirstLast` | `boolean` | `false` |
| `showPrevNext` | `boolean` | `true` |

### 22. ActivityStream

Live ticker showing tool activity (invocations, publications, updates) with mock data.

**Import:** `import { ActivityStream } from '@tpmjs/ui/ActivityStream/ActivityStream'`

| Prop | Type | Default |
|------|------|---------|
| `activities` | `ActivityItem[]` | -- |
| `updateInterval` | `number` | `6000` |
| `maxItems` | `number` | `5` |

`ActivityItem`: `{ type: 'invoked' | 'published' | 'updated', tool: string, time: string }`

### 23. CodeBlock

Syntax-highlighted code with Prism. Auto-detects light/dark theme from `.dark` class on `<html>`.

**Import:** `import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock'`

| Prop | Type | Default |
|------|------|---------|
| `code` | `string` | -- |
| `language` | `string` | `'text'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `showCopy` | `boolean` | `true` |
| `theme` | `'light' \| 'dark'` | auto |

### 24. InstallSnippet

Package install command with package manager tabs (npm, pnpm, yarn, bun) and copy button.

**Import:** `import { InstallSnippet } from '@tpmjs/ui/InstallSnippet/InstallSnippet'`

| Prop | Type | Default |
|------|------|---------|
| `packageName` | `string` | -- |
| `version` | `string` | -- |
| `defaultManager` | `'npm' \| 'pnpm' \| 'yarn' \| 'bun'` | `'npm'` |
| `showTabs` | `boolean` | `true` |
| `installType` | `'dependencies' \| 'devDependencies' \| 'global'` | `'dependencies'` |
| `copyable` | `boolean` | `true` |
| `variant` | `'default' \| 'minimal' \| 'dark'` | `'default'` |

```tsx
<InstallSnippet packageName="@anthropic/mcp-tools" defaultManager="pnpm" />
```

### 25. QualityScore

Tool quality metric display with tier classification and optional category breakdown.

**Import:** `import { QualityScore } from '@tpmjs/ui/QualityScore/QualityScore'`

| Prop | Type | Default |
|------|------|---------|
| `score` | `number` | -- |
| `isDecimal` | `boolean` | `false` (score is 0-100; set true for 0-1) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `variant` | `'default' \| 'badge' \| 'inline' \| 'detailed'` | `'default'` |
| `showTier` / `showScore` | `boolean` | `true` / `true` |
| `breakdown` | `{ documentation?, maintenance?, popularity?, security?, tests? }` (each 0-1) | -- |

Tiers: Excellent (80+), Good (60-79), Fair (40-59), Poor (0-39).

### 26. AnimatedCounter

Number animation counting from 0 to target with configurable easing.

**Import:** `import { AnimatedCounter } from '@tpmjs/ui/AnimatedCounter/AnimatedCounter'`

| Prop | Type | Default |
|------|------|---------|
| `value` | `number` | -- |
| `duration` | `number` | `2000` |
| `decimals` | `number` | `0` |
| `prefix` / `suffix` | `string` | `''` |
| `separator` | `string` | `''` |
| `startOn` | `'mount' \| 'viewport'` | `'viewport'` |
| `easing` | `'linear' \| 'easeOutExpo' \| 'easeOutQuad'` | `'easeOutExpo'` |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` |
| `mono` | `boolean` | `true` |

---

## Navigation

### 27. Tabs

Tabbed navigation with optional badge counts.

**Import:** `import { Tabs } from '@tpmjs/ui/Tabs/Tabs'`

| Prop | Type | Default |
|------|------|---------|
| `tabs` | `Array<{ id: string, label: string, count?: number }>` | -- |
| `activeTab` | `string` | -- |
| `onTabChange` | `(tabId: string) => void` | -- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `variant` | `'default' \| 'blueprint'` | `'default'` |

### 28. Breadcrumbs

Hierarchical navigation with separator options and auto-collapse.

**Import:** `import { Breadcrumbs, BreadcrumbItem } from '@tpmjs/ui/Breadcrumbs/Breadcrumbs'`

| Prop | Type | Default |
|------|------|---------|
| `separator` | `'slash' \| 'chevron' \| 'arrow' \| 'dot' \| ReactNode` | `'slash'` |
| `maxItems` | `number` | -- (no collapse) |
| `itemsBeforeCollapse` / `itemsAfterCollapse` | `number` | `1` / `1` |

`BreadcrumbItem` props: `current` (boolean), `href` (string), `icon` (ReactNode).

### 29. Header

Flexible header bar with title and action slots.

**Import:** `import { Header } from '@tpmjs/ui/Header/Header'`

| Prop | Type | Default |
|------|------|---------|
| `title` | `ReactNode` | -- |
| `actions` | `ReactNode` | -- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `sticky` | `boolean` | `false` |

### 30. PageHeader

Full page header with title, description, and actions row.

**Import:** `import { PageHeader } from '@tpmjs/ui/PageHeader/PageHeader'`

| Prop | Type | Default |
|------|------|---------|
| `title` | `string` | -- |
| `description` | `string` | -- |
| `actions` | `ReactNode` | -- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |

---

## Form Controls

### 31. Input

Text input. Extends native `InputHTMLAttributes`.

**Import:** `import { Input } from '@tpmjs/ui/Input/Input'`

| Prop | Type | Default |
|------|------|---------|
| `state` | `'default' \| 'error' \| 'success'` | `'default'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `fullWidth` | `boolean` | `false` |

### 32. Textarea

Multi-line text input with resize control and character count.

**Import:** `import { Textarea } from '@tpmjs/ui/Textarea/Textarea'`

| Prop | Type | Default |
|------|------|---------|
| `state` | `'default' \| 'error' \| 'success'` | `'default'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `fullWidth` | `boolean` | `true` |
| `resize` | `'none' \| 'vertical' \| 'horizontal' \| 'both'` | `'vertical'` |
| `showCount` | `boolean` | `false` |

### 33. Select

Dropdown select with option groups and loading state.

**Import:** `import { Select } from '@tpmjs/ui/Select/Select'`

| Prop | Type | Default |
|------|------|---------|
| `state` | `'default' \| 'error' \| 'success'` | `'default'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `fullWidth` | `boolean` | `true` |
| `options` | `Array<{ value, label, disabled? }>` | -- |
| `optionGroups` | `Array<{ label, options }>` | -- |
| `placeholder` | `string` | -- |
| `loading` | `boolean` | `false` |

### 34. Checkbox

Toggle checkbox with indeterminate state and optional label.

**Import:** `import { Checkbox } from '@tpmjs/ui/Checkbox/Checkbox'`

| Prop | Type | Default |
|------|------|---------|
| `state` | `'default' \| 'error' \| 'success'` | `'default'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `indeterminate` | `boolean` | `false` |
| `label` | `string` | -- |
| `labelPosition` | `'left' \| 'right'` | `'right'` |

### 35. Radio / RadioGroup

Radio selection with group management.

**Import:** `import { Radio, RadioGroup } from '@tpmjs/ui/Radio/Radio'`

**Radio:** `state`, `size`, `label`, `labelPosition` (same as Checkbox).

**RadioGroup:**

| Prop | Type | Default |
|------|------|---------|
| `name` | `string` | -- (required) |
| `value` / `defaultValue` | `string` | -- |
| `onChange` | `(value: string) => void` | -- |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` |
| `state` | `'default' \| 'error' \| 'success'` | `'default'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `disabled` | `boolean` | `false` |

### 36. Switch

Toggle switch with label and loading state.

**Import:** `import { Switch } from '@tpmjs/ui/Switch/Switch'`

| Prop | Type | Default |
|------|------|---------|
| `checked` / `defaultChecked` | `boolean` | -- / `false` |
| `onChange` | `(checked: boolean) => void` | -- |
| `state` | `'default' \| 'error' \| 'success'` | `'default'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `label` | `string` | -- |
| `labelPosition` | `'left' \| 'right'` | `'right'` |
| `loading` | `boolean` | `false` |

### 37. Slider

Range slider with marks and value display.

**Import:** `import { Slider } from '@tpmjs/ui/Slider/Slider'`

| Prop | Type | Default |
|------|------|---------|
| `min` / `max` / `step` | `number` | `0` / `100` / `1` |
| `state` | `'default' \| 'error' \| 'success'` | `'default'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `showValue` | `boolean` | `false` |
| `showMarks` | `boolean` | `false` |
| `marks` | `Array<{ value: number, label?: string }>` | -- |
| `fullWidth` | `boolean` | `true` |

### 38. Label

Form label with required indicator. Extends native `LabelHTMLAttributes`.

**Import:** `import { Label } from '@tpmjs/ui/Label/Label'`

| Prop | Type | Default |
|------|------|---------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `required` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |

### 39. FormField

Composite wrapper: label + input + helper/error text with accessibility wiring.

**Import:** `import { FormField } from '@tpmjs/ui/FormField/FormField'`

| Prop | Type | Default |
|------|------|---------|
| `label` | `string` | -- |
| `htmlFor` | `string` | -- |
| `required` | `boolean` | `false` |
| `error` | `string` | -- (shows as `role="alert"`) |
| `helperText` | `string` | -- (hidden when error present) |
| `state` | `'default' \| 'error' \| 'success'` | `'default'` |
| `disabled` | `boolean` | `false` |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` |

```tsx
<FormField label="Email" htmlFor="email" required helperText="We'll never share your email">
  <Input id="email" type="email" />
</FormField>
```

---

## Layout

### 40. Skeleton

Loading placeholder with shimmer animation. Includes preset variants.

**Import:** `import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonTable } from '@tpmjs/ui/Skeleton/Skeleton'`

**Skeleton (base):**

| Prop | Type | Default |
|------|------|---------|
| `variant` | `'text' \| 'circular' \| 'rectangular' \| 'rounded'` | `'text'` |
| `animation` | `'pulse' \| 'wave' \| 'none'` | `'pulse'` |
| `width` / `height` | `string \| number` | -- |
| `lines` | `number` | `1` |
| `lastLineShort` | `boolean` | `false` |

**Presets:** `SkeletonText` (`lines`, `gap`, `width`), `SkeletonAvatar` (`size`: sm/md/lg/xl), `SkeletonCard` (`showImage`, `lines`), `SkeletonTable` (`rows`, `columns`).

---

## Specialized / Brand

### 41. DitherCanvas

Canvas-based Bayer dithering effect for text. Core visual for the TPMJS brand. Respects `prefers-reduced-motion`.

**Import:** `import { DitherCanvas } from '@tpmjs/ui/DitherCanvas/DitherCanvas'`

| Prop | Type | Default |
|------|------|---------|
| `text` | `string` | -- |
| `mode` | `'reveal' \| 'pulse' \| 'static'` | -- |
| `speed` | `number` | `2000` |
| `threshold` | `number` (0-255) | `128` |
| `font` | `string` | `'bold 120px Space Grotesk'` |
| `color` | `string` | `'currentColor'` |
| `delay` | `number` | `0` |
| `lowDetail` | `boolean` | `false` |

### 42. DitherText

Two high-level components built on DitherCanvas.

**DitherHeadline** -- Hero heading with staggered line reveals.

**Import:** `import { DitherHeadline } from '@tpmjs/ui/DitherText/DitherHeadline'`

| Prop | Type | Default |
|------|------|---------|
| `children` | `string` (supports `\n` breaks) | -- |
| `delay` / `stagger` / `speed` | `number` | `500` / `150` / `1500` |
| `fontSize` / `fontWeight` | `string` | `'120px'` / `'800'` |

**DitherSectionHeader** -- Section heading with pulse animation.

**Import:** `import { DitherSectionHeader } from '@tpmjs/ui/DitherText/DitherSectionHeader'`

| Prop | Type | Default |
|------|------|---------|
| `children` | `string` | -- |
| `pulseSpeed` | `number` | -- |
| `fontSize` / `fontWeight` | `string` | `'56px'` / `'700'` |

### 43. FlowDiagram

Animated SVG diagram: AI Agent -> Semantic Query -> Registry -> Tools. Uses stroke-dashoffset reveals.

**Import:** `import { FlowDiagram } from '@tpmjs/ui/FlowDiagram/FlowDiagram'`

| Prop | Type | Default |
|------|------|---------|
| `speed` | `number` | `5000` |
| `autoPlay` | `boolean` | `true` |

### 44. Icon

Wrapper around Lucide React icons. Available icons registered in `packages/ui/src/Icon/icons.ts`.

**Import:** `import { Icon } from '@tpmjs/ui/Icon/Icon'`

| Prop | Type | Default |
|------|------|---------|
| `icon` | `IconName` | -- |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` |

### 45. ToolCard

Tool display card with package metadata, quality score, and stats.

**Import:** `import { ToolCard } from '@tpmjs/ui/ToolCard/ToolCard'`

| Prop | Type | Default |
|------|------|---------|
| `name` | `string` | -- (required) |
| `displayName` / `description` / `author` | `string` | -- |
| `version` | `string` | -- |
| `tier` | `'minimal' \| 'rich'` | -- |
| `qualityScore` | `number` (0-100) | -- |
| `downloads` / `stars` | `number` | -- |
| `category` | `string` | -- |
| `isOfficial` | `boolean` | -- |
| `variant` | `'default' \| 'compact' \| 'featured'` | `'default'` |
| `href` | `string` | -- |
| `action` / `icon` | `ReactNode` | -- |

### 46. ToolHealthBadge

Compact "Broken" badge. Renders nothing when healthy.

**Import:** `import { ToolHealthBadge } from '@tpmjs/ui/ToolHealthBadge/ToolHealthBadge'`

| Prop | Type | Default |
|------|------|---------|
| `importHealth` | `'HEALTHY' \| 'BROKEN' \| 'UNKNOWN'` | -- |
| `executionHealth` | `'HEALTHY' \| 'BROKEN' \| 'UNKNOWN'` | -- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` |

### 47. ToolHealthBanner

Detailed health status banner for broken tools. Renders nothing when healthy.

**Import:** `import { ToolHealthBanner } from '@tpmjs/ui/ToolHealthBanner/ToolHealthBanner'`

| Prop | Type | Default |
|------|------|---------|
| `importHealth` / `executionHealth` | `'HEALTHY' \| 'BROKEN' \| 'UNKNOWN'` | -- |
| `healthCheckError` | `string \| null` | -- |
| `lastHealthCheck` | `string \| null` | -- |
| `onRecheck` | `() => void` | -- |
| `recheckLoading` | `boolean` | `false` |

### 48. ToolRenderer

Dynamic renderer for tool call results in AI chat interfaces. Uses a registry to match tool names to specialized renderers. Falls back to `DefaultJsonRenderer`.

**Import:** `import { ToolRenderer } from '@tpmjs/ui/ToolRenderer/ToolRenderer'`

| Prop | Type | Default |
|------|------|---------|
| `part` | `ToolPart` (`{ type, toolCallId, toolName, args?, result?, state? }`) | -- |
| `isStreaming` | `boolean` | -- |

Tool states: `'partial-call'` (streaming args), `'call'` (executing), `'result'` (complete).

---

## Recently Added

### 49. Avatar

User or entity avatar with image, initials fallback, and generic icon fallback.

**Import:** `import { Avatar } from '@tpmjs/ui/Avatar/Avatar'`

| Prop | Type | Default |
|------|------|---------|
| `src` | `string` | — |
| `alt` | `string` | — |
| `fallback` | `string` | — |
| `size` | `'xs' (24px) \| 'sm' (32px) \| 'md' (40px) \| 'lg' (48px) \| 'xl' (64px)` | `'md'` |
| `shape` | `'square' \| 'rounded' \| 'circle'` | `'square'` |

```tsx
<Avatar src="/user.jpg" alt="Jane Doe" size="lg" />
<Avatar fallback="JD" shape="circle" />
<Avatar size="sm" /> {/* Generic user icon */}
```

**Design notes:** Default shape is `square` (brutalist). Falls back to first 2 chars of `fallback` prop (uppercase), then a generic user SVG. Handles image load errors gracefully.

### 50. Divider

Horizontal or vertical separator line with solid, dashed, or dotted styles.

**Import:** `import { Divider } from '@tpmjs/ui/Divider/Divider'`

| Prop | Type | Default |
|------|------|---------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `variant` | `'solid' \| 'dashed' \| 'dotted'` | `'solid'` |
| `thickness` | `'thin' (1px) \| 'medium' (2px) \| 'thick' (4px)` | `'thin'` |
| `spacing` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` |
| `label` | `string` | — |

```tsx
<Divider />
<Divider variant="dotted" thickness="medium" />
<Divider label="or" />
<Divider orientation="vertical" spacing="lg" />
```

**Design notes:** Uses semantic `<hr>` element. Dotted/dashed variants emphasize the technical aesthetic. The `label` prop renders centered text between two lines (horizontal only). Renders with `role="separator"` via native `<hr>`.

### 51. Alert

Persistent alert banner for important messages. Distinct from Toast (transient notifications).

**Import:** `import { Alert, AlertTitle, AlertDescription } from '@tpmjs/ui/Alert/Alert'`

| Prop | Type | Default |
|------|------|---------|
| `variant` | `'default' \| 'info' \| 'success' \| 'warning' \| 'error' \| 'destructive'` | `'default'` |

```tsx
import { AlertCircle } from 'lucide-react';

<Alert variant="error">
  <AlertCircle />
  <div>
    <AlertTitle>Deployment failed</AlertTitle>
    <AlertDescription>The build process exited with code 1. Check your logs.</AlertDescription>
  </div>
</Alert>
```

**Design notes:** Uses `role="alert"` for screen reader announcements. Supports an optional leading SVG icon (auto-positioned via CSS). Border-width is 2px (heavier than default) for visual prominence. Status variants use light background tints (`bg-error-light`, etc.) with colored borders.

---

## Design Tokens

Global tokens in `packages/ui/src/tokens/`. Component-level token files refine these.

- **Spacing:** rem-based scale, `spacing[1]` = 0.25rem through `spacing[16]` = 4rem
- **Border radius:** Default `0` (sharp corners). Scale: `none`, `sm`, `md`, `lg`, `full`
- **Colors:** CSS custom properties via Tailwind. Primary = copper (#A6592D). Semantic: `error`, `warning`, `success`, `info`
- **Typography:** System fonts for body. Geist Mono for buttons/code. Space Grotesk for headlines
- **Transitions:** 150ms default duration for color transitions
