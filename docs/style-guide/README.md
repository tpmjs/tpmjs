# TPMJS Style Guide

Comprehensive design system reference for **TPMJS** (The Package Manager for JavaScript tools). A brutalist-aesthetic developer tool registry built with React/Next.js, Tailwind CSS, and a multi-layer design token architecture.

**Last updated:** 2026-03-08

---

## Table of Contents

1. [Brand Overview](#1-brand-overview)
2. [Design Tokens](#2-design-tokens)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Shape](#5-shape)
6. [Elevation](#6-elevation)
7. [Motion & Animation](#7-motion--animation)
8. [Iconography](#8-iconography)
9. [Layout & Spacing](#9-layout--spacing)
10. [Interaction States](#10-interaction-states)
11. [Accessibility](#11-accessibility)
12. [Components](#12-components)
13. [Theming](#13-theming)
14. [Content & Writing](#14-content--writing)
15. [Data Visualization](#15-data-visualization)
16. [Grid Patterns](#16-grid-patterns)

---

## 1. Brand Overview

### Identity

| Attribute   | Value                                          |
|-------------|------------------------------------------------|
| Name        | TPMJS                                          |
| Full name   | The Package Manager for JavaScript tools       |
| Aesthetic   | Brutalist, technical, minimal                  |
| Platform    | Web only (React / Next.js App Router)          |
| UI library  | `@tpmjs/ui` (48 components)                    |
| Styling     | Tailwind CSS + CSS custom properties           |

### Design Philosophy

- **Brutalist honesty.** No decorative rounded corners, no gradient fills, no drop shadows pretending to be depth. Interfaces expose their structure.
- **Technical precision.** Monospaced button labels, dotted-border patterns, blueprint grids. The UI reads like a specification, not a marketing site.
- **Information density.** Developer tools should show data, not hide it. Density modes let users control how much they see.
- **Copper accent.** A single warm hue (`#A6592D`) cuts through the neutral grayscale. It marks primary actions and brand presence without overwhelming the interface.

### Do / Don't

| Do | Don't |
|----|-------|
| Use sharp corners (`rounded-none`) | Add `rounded-lg` or soft corners |
| Use monospace for interactive elements | Use decorative or display fonts |
| Let whitespace do the work | Fill every pixel with content |
| Use dotted/dashed borders for technical feel | Use thick colored borders for decoration |
| Keep animations under 300ms | Add long entrance animations or parallax |

---

## 2. Design Tokens

### Architecture

Tokens are organized in three layers:

```
Reference tokens    (raw values)
    |
System tokens      (semantic mapping via CSS variables)
    |
Component tokens   (component-specific overrides)
```

**Reference tokens** live in TypeScript files under `packages/ui/src/tokens/`:

| File              | Contents                                  |
|-------------------|-------------------------------------------|
| `colors.ts`       | Neutral palette, semantic colors, accents |
| `typography.ts`   | Font families, size scale, weights        |
| `spacing.ts`      | 4px-based spacing scale, containers       |
| `borders.ts`      | Widths, styles, radii, colors             |
| `shadows.ts`      | Box shadows, drop shadows, elevation      |
| `animations.ts`   | Durations, easings, keyframes             |
| `forms.ts`        | Form-specific sizing and spacing          |

**System tokens** are CSS custom properties defined in `apps/web/src/app/globals.css` under `:root` (light) and `.dark` (dark mode).

**Component tokens** live alongside each component in `packages/ui/src/<Component>/tokens.ts`.

### Naming Conventions

CSS variables follow this pattern:

```
--{category}-{property}-{modifier}

Examples:
--foreground-secondary
--shadow-lg
--border-strong
--motion-fast
--density-row-height
--radius-xl
```

TypeScript tokens use camelCase with nested objects:

```ts
import { spacing } from '@tpmjs/ui/tokens/spacing';
spacing[4]  // '1rem' (16px)

import { neutral } from '@tpmjs/ui/tokens/colors';
neutral[50] // '#0a0a0a'
```

### Delivery Channels

| Channel            | Usage                                        |
|--------------------|----------------------------------------------|
| CSS custom props   | Runtime theming, globals.css                 |
| TypeScript tokens  | `packages/ui/src/tokens/*.ts` imports        |
| Tailwind classes   | Extended via `tailwind.config.ts`            |
| Utility classes    | Custom utilities in globals.css `@layer`     |

### Import Pattern

```tsx
// Direct token import (no barrel exports)
import { spacing } from '@tpmjs/ui/tokens/spacing';
import { colors } from '@tpmjs/ui/tokens/colors';

// Component import (direct path, no barrel)
import { Button } from '@tpmjs/ui/Button/Button';
```

---

## 3. Color System

### Neutral Palette

16-stop grayscale used as reference tokens:

| Token        | Hex       | Usage                        |
|--------------|-----------|------------------------------|
| `neutral.0`  | `#000000` | True black (rarely used)     |
| `neutral.50` | `#0A0A0A` | Dark mode background         |
| `neutral.100`| `#171717` | Dark mode surface            |
| `neutral.200`| `#262626` | Dark mode elevated           |
| `neutral.300`| `#404040` | Light mode secondary text    |
| `neutral.400`| `#525252` | Mid-gray                     |
| `neutral.500`| `#737373` | Light mode tertiary text     |
| `neutral.600`| `#A3A3A3` | Dark mode secondary text     |
| `neutral.700`| `#D4D4D4` | Light borders                |
| `neutral.800`| `#E5E5E5` | Light subtle borders         |
| `neutral.900`| `#F5F5F5` | Light surface-3              |
| `neutral.950`| `#FAFAFA` | Light surface-2              |
| `neutral.1000`| `#FFFFFF`| Light background             |

### Semantic Colors - Light Mode

| Role                  | CSS Variable              | HSL Value          | Hex       |
|-----------------------|---------------------------|--------------------|-----------|
| Background            | `--background`            | `0 0% 100%`       | `#FFFFFF` |
| Surface               | `--surface`               | `0 0% 100%`       | `#FFFFFF` |
| Surface 2             | `--surface-2`             | `0 0% 98%`        | `#FAFAFA` |
| Surface 3             | `--surface-3`             | `0 0% 96%`        | `#F5F5F5` |
| Foreground            | `--foreground`            | `0 0% 4%`         | `#0A0A0A` |
| Foreground secondary  | `--foreground-secondary`  | `0 0% 25%`        | `#404040` |
| Foreground tertiary   | `--foreground-tertiary`   | `0 0% 45%`        | `#737373` |
| Foreground muted      | `--foreground-muted`      | `0 0% 55%`        | `#8C8C8C` |
| Border                | `--border`                | `0 0% 88%`        | `#E0E0E0` |
| Border strong         | `--border-strong`         | `0 0% 70%`        | `#B3B3B3` |
| Border subtle         | `--border-subtle`         | `0 0% 93%`        | `#EDEDED` |
| Primary (copper)      | `--primary`               | `22 57% 41%`      | `#A6592D` |
| Primary hover         | `--primary-hover`         | `22 57% 35%`      | `#8B4A26` |
| Primary active        | `--primary-active`        | `22 57% 30%`      | `#753F20` |
| Primary foreground    | `--primary-foreground`    | `0 0% 100%`       | `#FFFFFF` |
| Secondary             | `--secondary`             | `0 0% 96%`        | `#F5F5F5` |
| Secondary foreground  | `--secondary-foreground`  | `0 0% 4%`         | `#0A0A0A` |
| Muted                 | `--muted`                 | `0 0% 97%`        | `#F7F7F7` |
| Muted foreground      | `--muted-foreground`      | `0 0% 40%`        | `#666666` |
| Card                  | `--card`                  | `0 0% 100%`       | `#FFFFFF` |
| Card foreground       | `--card-foreground`       | `0 0% 4%`         | `#0A0A0A` |

### Semantic Colors - Dark Mode

| Role                  | CSS Variable              | HSL Value          |
|-----------------------|---------------------------|--------------------|
| Background            | `--background`            | `0 0% 4%`         |
| Surface               | `--surface`               | `0 0% 7%`         |
| Surface 2             | `--surface-2`             | `0 0% 10%`        |
| Surface 3             | `--surface-3`             | `0 0% 14%`        |
| Foreground            | `--foreground`            | `0 0% 93%`        |
| Foreground secondary  | `--foreground-secondary`  | `0 0% 65%`        |
| Foreground tertiary   | `--foreground-tertiary`   | `0 0% 50%`        |
| Foreground muted      | `--foreground-muted`      | `0 0% 40%`        |
| Border                | `--border`                | `0 0% 18%`        |
| Border strong         | `--border-strong`         | `0 0% 30%`        |
| Border subtle         | `--border-subtle`         | `0 0% 12%`        |
| Primary (copper)      | `--primary`               | `22 60% 55%`      |
| Primary hover         | `--primary-hover`         | `22 60% 60%`      |
| Primary active        | `--primary-active`        | `22 60% 50%`      |
| Card                  | `--card`                  | `0 0% 7%`         |
| Card foreground       | `--card-foreground`       | `0 0% 93%`        |

Dark mode uses a brighter copper (`55% lightness` vs `41%`) to maintain contrast against dark surfaces.

### Status Colors

| Status  | CSS Variable  | Light HSL          | Dark HSL           | Hex (light) |
|---------|---------------|--------------------|--------------------|-------------|
| Success | `--success`   | `142 72% 29%`     | `142 60% 45%`     | `#147D3C`   |
| Warning | `--warning`   | `38 92% 50%`      | `38 90% 55%`      | `#F5A623`   |
| Error   | `--error`     | `0 72% 51%`       | `0 70% 55%`       | `#DC2626`   |
| Info    | `--info`      | `210 92% 45%`     | `210 80% 55%`     | `#0969DA`   |

Each status color has a `*-light` variant for backgrounds (e.g., `--success-light: 142 40% 96%`) and a `*-foreground` for text on the status color.

The `--destructive` token aliases `--error` for backward compatibility.

### Accent Colors

Micro-accent colors for highlights, charts, tags, and visual variety. Used sparingly.

| Name   | Hex       | Tailwind class      |
|--------|-----------|---------------------|
| Blue   | `#60A5FA` | `text-blue-400`     |
| Purple | `#A78BFA` | `text-purple-400`   |
| Green  | `#34D399` | `text-emerald-400`  |
| Pink   | `#F472B6` | `text-pink-400`     |
| Orange | `#FB923C` | `text-orange-400`   |
| Yellow | `#FBBF24` | `text-yellow-400`   |

Available in TypeScript:

```ts
import { accents } from '@tpmjs/ui/tokens/colors';
accents.blue   // '#60a5fa'
accents.purple // '#a78bfa'
```

### Form Colors

| Token               | CSS Variable     | Purpose                   |
|----------------------|------------------|---------------------------|
| Input border         | `--input`        | Input/textarea borders    |
| Input focus          | `--input-focus`  | Copper focus border       |
| Focus ring           | `--ring`         | Focus ring color (copper) |
| Ring offset          | `--ring-offset`  | Ring offset background    |

### Accessibility Requirements

- **WCAG AA minimum.** All text must achieve 4.5:1 contrast against its background (3:1 for large text >= 18px or bold >= 14px).
- **Primary on white:** `#A6592D` on `#FFFFFF` = 4.56:1 (passes AA).
- **Foreground on background:** `#0A0A0A` on `#FFFFFF` = 19.4:1 (passes AAA).
- **Dark mode foreground:** `#EDEDED` on `#0A0A0A` = 17.4:1 (passes AAA).
- **Never use color alone** to convey meaning. Pair with icons, text labels, or patterns.

### Usage in Code

```tsx
{/* Tailwind classes (preferred) */}
<div className="bg-background text-foreground border-border" />
<div className="bg-primary text-primary-foreground" />
<div className="text-foreground-secondary" />

{/* CSS variables (for custom styles) */}
<div style={{ color: 'hsl(var(--primary))' }} />
<div style={{ borderColor: 'hsl(var(--border-strong))' }} />

{/* TypeScript tokens (for JS logic) */}
import { semantic } from '@tpmjs/ui/tokens/colors';
const bg = semantic.background.DEFAULT; // 'hsl(var(--background))'
```

---

## 4. Typography

### Font Families

| Role    | Font         | Fallback Stack                                             | CSS Variable    |
|---------|--------------|------------------------------------------------------------|-----------------|
| Brand   | Geist Sans   | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`   | `--font-sans`   |
| Code    | Geist Mono   | `"SF Mono", Monaco, Consolas, "Liberation Mono"`           | `--font-mono`   |

Buttons use `font-mono` (monospace) for the technical aesthetic. Body text uses `font-sans`.

### Type Scale

| Token     | CSS Variable   | Size (rem) | Size (px) | Line Height | Letter Spacing | Tailwind       |
|-----------|----------------|------------|-----------|-------------|----------------|----------------|
| `xs`      | `--text-xs`    | 0.75       | 12        | 1rem        | 0              | `text-xs`      |
| `sm`      | `--text-sm`    | 0.875      | 14        | 1.25rem     | 0              | `text-sm`      |
| `base`    | `--text-base`  | 1          | 16        | 1.5rem      | 0              | `text-base`    |
| `lg`      | `--text-lg`    | 1.125      | 18        | 1.75rem     | -0.01em        | `text-lg`      |
| `xl`      | `--text-xl`    | 1.25       | 20        | 1.75rem     | -0.01em        | `text-xl`      |
| `2xl`     | `--text-2xl`   | 1.5        | 24        | 2rem        | -0.02em        | `text-2xl`     |
| `3xl`     | `--text-3xl`   | 2          | 32        | 2.25rem     | -0.02em        | `text-3xl`     |
| `4xl`     | `--text-4xl`   | 2.5        | 40        | 2.5rem      | -0.03em        | `text-4xl`     |
| `5xl`     | `--text-5xl`   | 3          | 48        | 1           | -0.03em        | `text-5xl`     |
| `6xl`     | `--text-6xl`   | 4          | 64        | 1           | -0.04em        | `text-6xl`     |

Larger sizes use progressively tighter letter spacing for optical compensation.

### Font Weights

| Token      | Value | Tailwind          | Usage                       |
|------------|-------|-------------------|-----------------------------|
| Light      | 300   | `font-light`      | De-emphasized text          |
| Normal     | 400   | `font-normal`     | Body text                   |
| Medium     | 500   | `font-medium`     | Buttons, labels, nav        |
| Semibold   | 600   | `font-semibold`   | Subheadings, emphasis       |
| Bold       | 700   | `font-bold`       | Headings                    |
| Extrabold  | 800   | `font-extrabold`  | Brutalist headings          |

### Letter Spacing

| Token     | Value     | Tailwind            | Usage                     |
|-----------|-----------|---------------------|---------------------------|
| Tighter   | -0.05em   | `tracking-tighter`  | Brutalist headings        |
| Tight     | -0.025em  | `tracking-tight`    | Large headings            |
| Normal    | 0         | `tracking-normal`   | Body text                 |
| Wide      | 0.025em   | `tracking-wide`     | Small caps, labels        |
| Wider     | 0.05em    | `tracking-wider`    | Overlines, meta text      |
| Widest    | 0.1em     | `tracking-widest`   | All-caps labels           |

### Line Heights

| Token    | Value | Tailwind           | Usage                        |
|----------|-------|--------------------|------------------------------|
| None     | 1     | `leading-none`     | Display text, headings       |
| Tight    | 1.25  | `leading-tight`    | Compact text, cards          |
| Snug     | 1.375 | `leading-snug`     | UI text                      |
| Normal   | 1.5   | `leading-normal`   | Body copy (default)          |
| Relaxed  | 1.625 | `leading-relaxed`  | Long-form reading            |
| Loose    | 2     | `leading-loose`    | Spacious layouts             |

### Brutalist Typography

Two special utility classes for hero/display text:

```css
.brutalist-heading {
  font-size: clamp(48px, 8vw, 120px);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.9;
  text-transform: uppercase;
}

.brutalist-subheading {
  font-size: clamp(24px, 4vw, 56px);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.1;
  text-transform: uppercase;
}
```

These use `clamp()` for fluid responsive sizing without breakpoints. Use only for hero sections and landing pages.

### Content Width (Prose)

| Token               | CSS Variable           | Max Width | Usage              |
|----------------------|------------------------|-----------|---------------------|
| Narrow               | `--prose-width-narrow` | 45ch      | Sidebars, captions  |
| Default              | `--prose-width`        | 65ch      | Body text, articles |
| Wide                 | `--prose-width-wide`   | 80ch      | Code, wide content  |

```html
<p class="prose-width">Body text stays readable at any viewport.</p>
<pre class="prose-width-wide">Code blocks get more room.</pre>
```

### Text Hierarchy Example

```tsx
<h1 className="text-4xl font-bold tracking-tight">Page Title</h1>
<h2 className="text-2xl font-semibold tracking-tight">Section</h2>
<h3 className="text-xl font-semibold">Subsection</h3>
<p className="text-base text-foreground-secondary leading-relaxed">Body text</p>
<span className="text-sm text-foreground-tertiary">Meta info</span>
<code className="font-mono text-sm">inline code</code>
```

---

## 5. Shape

### Corner Radius

**Default: 0 (sharp corners).** This is the defining visual trait of the brutalist aesthetic. All CSS radius variables are set to `0` in both light and dark modes.

| Token         | CSS Variable     | Value   | Tailwind        | Usage                            |
|---------------|------------------|---------|-----------------|----------------------------------|
| None          | `--radius-none`  | `0`     | `rounded-none`  | Default for everything           |
| XS            | `--radius-xs`    | `2px`   | -               | Subtle softening (rare)          |
| SM            | `--radius-sm`    | `4px`   | `rounded-sm`    | Inputs, small controls           |
| MD            | `--radius-md`    | `6px`   | `rounded-md`    | Cards (when rounding is needed)  |
| LG            | `--radius-lg`    | `8px`   | `rounded-lg`    | Modals, large panels             |
| XL            | `--radius-xl`    | `12px`  | `rounded-xl`    | Feature cards                    |
| 2XL           | `--radius-2xl`   | `16px`  | `rounded-2xl`   | Large containers                 |
| Full          | `--radius-full`  | `9999px`| `rounded-full`  | Avatars, pills, switch tracks    |

Note: The Tailwind `rounded-sm`, `rounded-md`, etc. classes reference `var(--radius-sm)` etc., which are all `0` by default. The non-zero values listed above are the *available* scale if radius overrides are applied.

### Border Widths

| Token     | CSS Variable         | Value   | Usage                               |
|-----------|----------------------|---------|-------------------------------------|
| Hairline  | `--border-hairline`  | `0.5px` | Subtle dividers                     |
| Thin      | `--border-thin`      | `1px`   | Default borders (most common)       |
| Medium    | `--border-medium`    | `2px`   | Emphasized borders                  |
| Thick     | `--border-thick`     | `4px`   | Heavy emphasis                      |
| Heavy     | `--border-heavy`     | `6px`   | Brutalist borders                   |
| Brutalist | `--border-brutalist` | `8px`   | Maximum brutalist weight            |

TypeScript tokens:

```ts
import { borderWidth } from '@tpmjs/ui/tokens/borders';
borderWidth.DEFAULT // '1px'
borderWidth[4]      // '4px'
borderWidth[8]      // '8px'
```

### Border Styles

Dotted and dashed borders are a signature element of the TPMJS technical aesthetic.

| Style  | Utility Classes               | Usage                                   |
|--------|-------------------------------|-----------------------------------------|
| Solid  | `border`                      | Default structural borders              |
| Dotted | `border-dotted-1`, `border-dotted-2` | Technical/blueprint feel, secondary actions |
| Dashed | `border-dashed-1`            | Drag targets, optional elements         |

Directional dotted borders:

```html
<div class="border-t-dotted border-border">Top dotted border only</div>
<div class="border-b-dotted border-border">Bottom dotted border only</div>
<div class="border-l-dotted border-border">Left dotted border only</div>
<div class="border-r-dotted border-border">Right dotted border only</div>
```

### Brutalist Border Utilities

```css
.brutalist-border       /* 6px solid foreground, radius 0 */
.brutalist-border-thick /* 8px solid foreground, radius 0 */
.brutalist-border-mega  /* 12px solid foreground, radius 0 */
```

Use for hero sections, feature highlights, and special callouts only. Not for general UI.

---

## 6. Elevation

### Shadow Scale

| Level | CSS Variable    | Light Mode Value                                                      | Usage              |
|-------|-----------------|-----------------------------------------------------------------------|--------------------|
| None  | `--shadow-none` | `none`                                                                | Flat elements      |
| XS    | `--shadow-xs`   | `0 1px 2px 0 hsl(fg / 0.05)`                                         | Subtle lift        |
| SM    | `--shadow-sm`   | `0 1px 3px 0 hsl(fg / 0.08), 0 1px 2px -1px hsl(fg / 0.08)`         | Cards              |
| MD    | `--shadow-md`   | `0 4px 6px -1px hsl(fg / 0.08), 0 2px 4px -2px hsl(fg / 0.08)`     | Dropdowns          |
| LG    | `--shadow-lg`   | `0 10px 15px -3px hsl(fg / 0.08), 0 4px 6px -4px hsl(fg / 0.08)`   | Modals             |
| XL    | `--shadow-xl`   | `0 20px 25px -5px hsl(fg / 0.08), 0 8px 10px -6px hsl(fg / 0.08)`  | Popovers           |
| 2XL   | `--shadow-2xl`  | `0 25px 50px -12px hsl(fg / 0.15)`                                   | Overlays           |
| Inner | `--shadow-inner`| `inset 0 2px 4px 0 hsl(fg / 0.05)`                                   | Inset controls     |

### Dark Mode Shadows

Dark mode uses higher opacity values (`0.2`-`0.4` vs `0.05`-`0.15`) with true black (`hsl(0 0% 0%)`) instead of foreground-relative values, making shadows more visible against dark surfaces.

### Brutalist Shadows

Hard-offset shadows with zero blur. Used for accent/hero elements.

| Utility                | Value                                      |
|------------------------|--------------------------------------------|
| `.brutalist-shadow`    | `0 10px 0 0 hsl(var(--brutalist-accent))` |
| `.brutalist-shadow-sm` | `0 6px 0 0 hsl(var(--brutalist-accent))`  |
| `.brutalist-shadow-hover` | `0 12px 0 0 hsl(var(--brutalist-accent))` |

```html
<div class="brutalist-shadow hover:brutalist-shadow-hover transition-shadow">
  Hard copper shadow, grows on hover
</div>
```

### Blueprint Shadows

Subtle, barely-there shadows for the blueprint/technical aesthetic:

```css
.shadow-blueprint       /* 0 1px 2px rgba(0,0,0,0.03) + 1px outline */
.shadow-blueprint-hover /* 0 2px 4px rgba(0,0,0,0.05) + 1px outline */
```

### Elevation Semantic Mapping

```ts
import { elevation } from '@tpmjs/ui/tokens/shadows';
elevation[0] // none     - page-level elements
elevation[1] // sm       - subtle card lift
elevation[2] // base     - default card
elevation[3] // md       - dropdown menus
elevation[4] // lg       - modals, drawers
elevation[5] // xl       - popovers, tooltips
elevation[6] // 2xl      - command palette
```

---

## 7. Motion & Animation

### Duration Scale

| Token    | CSS Variable       | Value  | Usage                              |
|----------|--------------------|--------|------------------------------------|
| Instant  | `--motion-instant`  | `0ms`  | Immediate state changes            |
| Fast     | `--motion-fast`     | `150ms`| Hover states, micro-interactions   |
| Base     | `--motion-base`     | `200ms`| Default transitions                |
| Slow     | `--motion-slow`     | `300ms`| Layout shifts, slide animations    |
| Slower   | `--motion-slower`   | `500ms`| Complex choreographed entrances    |

General rule: **150-200ms for interactions, 300ms for layout changes.** Anything over 500ms feels sluggish.

### Easing Functions

| Token       | CSS Variable            | Value                              | Usage                     |
|-------------|-------------------------|------------------------------------|---------------------------|
| Standard    | `--easing-standard`     | `cubic-bezier(0.4, 0, 0.2, 1)`    | General purpose (default) |
| Decelerate  | `--easing-decelerate`   | `cubic-bezier(0, 0, 0.2, 1)`      | Elements entering         |
| Accelerate  | `--easing-accelerate`   | `cubic-bezier(0.4, 0, 1, 1)`      | Elements exiting          |
| Linear      | `--easing-linear`       | `linear`                           | Progress bars, spinners   |
| Spring      | `--easing-spring`       | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Playful bounce    |

Additional TypeScript easings:

```ts
import { easing } from '@tpmjs/ui/tokens/animations';
easing.smooth  // 'cubic-bezier(0.25, 0.1, 0.25, 1)'
easing.bounce  // 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
```

### Keyframe Library

| Animation          | Utility Class                 | Description                    | Duration |
|--------------------|-------------------------------|--------------------------------|----------|
| Fade In            | `animate-fadeIn`              | Opacity 0 to 1                 | base     |
| Fade Out           | `animate-fadeOut`             | Opacity 1 to 0                 | base     |
| Slide Up           | `animate-slide-up`           | Translate Y +10px, fade in     | 300ms    |
| Slide Down         | `animate-slide-down`         | Translate Y -10px, fade in     | 300ms    |
| Scale In           | `animate-scaleIn`            | Scale 0.95, fade in            | base     |
| Shimmer            | `animate-shimmer`            | Skeleton loading shimmer       | 2s loop  |
| Glitch             | `animate-glitch`             | Horizontal jitter effect       | 500ms    |
| Brutalist Entrance | `animate-brutalist-entrance` | Y +40px, scale 0.9, fade in   | 600ms    |
| Bar Grow           | `animate-bar-grow`           | Scale Y from bottom            | 800ms    |
| Spin               | `animate-spin`               | 360deg rotation                | loop     |
| Pulse              | `animate-pulse`              | Opacity pulse                  | loop     |
| Ping               | `animate-ping`               | Scale + fade out               | loop     |
| Blueprint Scanline | `.blueprint-scanline`        | Horizontal scanline sweep      | 30s loop |

### Stagger Choreography

For entrance animations on lists or grids, apply incremental delays:

| Class       | Delay  |
|-------------|--------|
| `stagger-1` | 80ms   |
| `stagger-2` | 160ms  |
| `stagger-3` | 240ms  |
| `stagger-4` | 320ms  |
| `stagger-5` | 400ms  |

```tsx
{items.map((item, i) => (
  <div
    key={item.id}
    className={`animate-slide-up stagger-${Math.min(i + 1, 5)}`}
  >
    {item.name}
  </div>
))}
```

### Transition Presets

CSS utility classes for common transitions:

```css
.transition-base        /* bg, border, color — 200ms standard */
.transition-transform   /* transform — 200ms standard */
.transition-all-smooth  /* all — 300ms standard */
.motion-fast            /* duration: 150ms, standard easing */
.motion-base            /* duration: 200ms, standard easing */
.motion-slow            /* duration: 300ms, standard easing */
.motion-spring          /* spring easing (overshoots slightly) */
```

TypeScript transition presets:

```ts
import { transitions } from '@tpmjs/ui/tokens/animations';
transitions.base   // 'background-color 200ms ..., border-color 200ms ..., color 200ms ...'
transitions.fast   // 'all 150ms ease-out'
transitions.smooth // 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)'
```

### Reduced Motion

All animations respect `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
    transition-duration: 0.01ms;
  }
}
```

This is applied globally in `globals.css`. No additional work needed per component.

---

## 8. Iconography

### Icon Library

TPMJS uses **Lucide React** (`lucide-react`) exclusively. No other icon sets.

```tsx
import { Search, ArrowRight, X } from 'lucide-react';
```

### Sizing

| Context          | Size (px) | Tailwind class | Usage                    |
|------------------|-----------|----------------|--------------------------|
| Inline / compact | 16        | `w-4 h-4`     | Inside buttons (sm), badges |
| Default          | 20        | `w-5 h-5`     | Standalone, nav items    |
| Large            | 24        | `w-6 h-6`     | Page headers, empty states |

Icons in density mode use `var(--density-icon-size)`:

```html
<Search className="density-icon" />
```

### Color Conventions

- **Default:** `text-foreground-secondary` (secondary text color)
- **Interactive:** `text-foreground` when clickable, `hover:text-primary` on hover
- **Muted:** `text-foreground-muted` for decorative/supporting icons
- **Status:** Match the status color (`text-success`, `text-error`, etc.)
- **On primary background:** `text-primary-foreground` (white)

### Usage Pattern

```tsx
import { Button } from '@tpmjs/ui/Button/Button';
import { ArrowRight } from 'lucide-react';

<Button>
  submit <ArrowRight className="w-4 h-4" />
</Button>
```

Icons in buttons are placed after the label by convention (gap is built into the Button component via `gap-2`).

---

## 9. Layout & Spacing

### Base Unit

**4px** (`0.25rem`). All spacing values are multiples of 4px. This creates consistent vertical and horizontal rhythm.

### Spacing Scale

| Token  | Rem       | Px   | Tailwind   | Common Usage                  |
|--------|-----------|------|------------|-------------------------------|
| `0`    | `0`       | 0    | `p-0`      | Reset                         |
| `0.5`  | `0.125`   | 2    | `p-0.5`    | Hairline gaps                 |
| `1`    | `0.25`    | 4    | `p-1`      | Tight internal spacing        |
| `1.5`  | `0.375`   | 6    | `p-1.5`    | Small control padding         |
| `2`    | `0.5`     | 8    | `p-2`      | Button padding, icon gap      |
| `3`    | `0.75`    | 12   | `p-3`      | Compact component padding     |
| `4`    | `1`       | 16   | `p-4`      | Default component padding     |
| `5`    | `1.25`    | 20   | `p-5`      | Comfortable padding           |
| `6`    | `1.5`     | 24   | `p-6`      | Section internal padding      |
| `8`    | `2`       | 32   | `p-8`      | Large section padding         |
| `10`   | `2.5`     | 40   | `p-10`     | Page margins                  |
| `12`   | `3`       | 48   | `p-12`     | Large gaps                    |
| `16`   | `4`       | 64   | `p-16`     | Section spacing               |
| `20`   | `5`       | 80   | `p-20`     | Hero spacing                  |
| `24`   | `6`       | 96   | `p-24`     | Maximum section spacing       |

### Semantic Spacing (CSS Variables)

| Variable               | Value  | Usage                           |
|------------------------|--------|---------------------------------|
| `--spacing-section`    | `8rem` | Between major page sections     |
| `--spacing-component`  | `4rem` | Between component groups        |
| `--spacing-element`    | `2rem` | Between related elements        |
| `--spacing-tight`      | `1rem` | Between tightly coupled items   |
| `--spacing-comfortable`| `3rem` | Comfortable breathing room      |

### Component Spacing Presets

```ts
import { component } from '@tpmjs/ui/tokens/spacing';

component.padding.sm  // '0.75rem'  (12px)
component.padding.md  // '1rem'     (16px)
component.padding.lg  // '1.25rem'  (20px)

component.gap.sm      // '0.5rem'   (8px)
component.gap.md      // '0.75rem'  (12px)
component.gap.lg      // '1rem'     (16px)

component.margin.sm   // '1rem'     (16px)
component.margin.md   // '1.5rem'   (24px)
component.margin.lg   // '2rem'     (32px)
component.margin.xl   // '3rem'     (48px)
```

### Breakpoints

| Name  | CSS Variable        | Min Width | Tailwind Prefix |
|-------|---------------------|-----------|-----------------|
| SM    | `--breakpoint-sm`   | 640px     | `sm:`           |
| MD    | `--breakpoint-md`   | 768px     | `md:`           |
| LG    | `--breakpoint-lg`   | 1024px    | `lg:`           |
| XL    | `--breakpoint-xl`   | 1280px    | `xl:`           |
| 2XL   | `--breakpoint-2xl`  | 1536px    | `2xl:`          |

Mobile-first: base styles target mobile, breakpoint prefixes add larger screen overrides.

### Container Widths

| Token  | Rem    | Px     | Usage                      |
|--------|--------|--------|----------------------------|
| `xs`   | 20rem  | 320px  | Narrow sidebars            |
| `sm`   | 24rem  | 384px  | Small panels               |
| `md`   | 28rem  | 448px  | Medium panels              |
| `lg`   | 32rem  | 512px  | Content columns            |
| `xl`   | 36rem  | 576px  | Wide content               |
| `2xl`  | 42rem  | 672px  | Article width              |
| `3xl`  | 48rem  | 768px  | Standard container         |
| `4xl`  | 56rem  | 896px  | Wide container             |
| `5xl`  | 64rem  | 1024px | Dashboard container        |
| `6xl`  | 72rem  | 1152px | Full-width container       |
| `7xl`  | 80rem  | 1280px | Maximum content width      |

### Density Modes

Apply via the `data-density` attribute on a container element:

```html
<div data-density="compact">...</div>
<div data-density="comfortable">...</div>  <!-- default -->
<div data-density="spacious">...</div>
```

| Property        | Compact  | Comfortable | Spacious |
|-----------------|----------|-------------|----------|
| Row height      | 36px     | 48px        | 64px     |
| Cell padding X  | 8px      | 16px        | 24px     |
| Cell padding Y  | 6px      | 12px        | 20px     |
| Icon size       | 16px     | 20px        | 24px     |
| Font size       | xs (12px)| sm (14px)   | base (16px)|

Utility classes:

```css
.density-row   /* height + font-size from density vars */
.density-cell  /* padding + font-size from density vars */
.density-icon  /* width + height from density vars */
```

---

## 10. Interaction States

### Hover

- **Buttons (default):** `hover:bg-primary/90` (reduce opacity)
- **Buttons (ghost):** `hover:bg-accent hover:text-accent-foreground`
- **Buttons (outline):** `hover:bg-accent hover:border-border-strong`
- **Cards:** `hover-lift` utility (translate Y -2px + shadow-md)
- **Links:** `hover:underline` (link variant), `hover:text-primary` (general)
- **Transition:** Always use `transition-colors duration-150` minimum

### Focus

Standard focus ring specification used across all interactive elements:

```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-primary        /* copper ring */
focus-visible:ring-offset-2
focus-visible:ring-offset-background
```

Available as utility: `.focus-ring`

Focus ring configuration tokens:

| Token        | CSS Variable           | Value      |
|--------------|------------------------|------------|
| Width        | `--focus-ring-width`   | `2px`      |
| Offset       | `--focus-ring-offset`  | `2px`      |
| Color        | `--focus-ring-color`   | copper     |

Form-specific focus ring (from form tokens):

```ts
import { formRing } from '@tpmjs/ui/tokens/forms';
formRing.width   // '2px'
formRing.offset  // '2px'
formRing.color   // 'hsl(var(--ring))'
formRing.opacity // '0.2'
```

### Active / Pressed

- **Default button:** `active:bg-primary/80`
- **Ghost button:** `active:bg-accent/80`
- **General pattern:** Reduce opacity by 10-20% from hover state

### Disabled

- `disabled:pointer-events-none` (prevent interaction)
- `disabled:opacity-50` (visual dimming via `--opacity-disabled`)
- `cursor-not-allowed` where pointer events are not fully disabled

### Loading

- Button loading state adds `cursor-wait`
- Use the `Spinner` component inline at 16px
- Never disable during loading (allow cancellation where possible)

### Opacity Scale Reference

| Token           | CSS Variable              | Value | Usage                      |
|-----------------|---------------------------|-------|----------------------------|
| 0               | `--opacity-0`             | 0     | Hidden                     |
| Muted           | `--opacity-muted`         | 0.4   | Very de-emphasized         |
| Disabled        | `--opacity-disabled`      | 0.5   | Disabled state             |
| Subtle          | `--opacity-subtle`        | 0.6   | Subtle presence            |
| Overlay         | `--opacity-overlay`       | 0.8   | Backdrop overlays          |
| Hover           | `--opacity-hover`         | 0.9   | Primary button hover       |
| Overlay heavy   | `--opacity-overlay-heavy` | 0.9   | Heavy backdrop             |
| Full            | `--opacity-full`          | 1     | Fully visible              |

---

## 11. Accessibility

### Color Contrast

- All text achieves **WCAG AA** (4.5:1) minimum against its background.
- Large text (>= 18px or >= 14px bold) requires 3:1.
- Interactive controls require 3:1 against adjacent colors.
- Status colors are always paired with text labels or icons; never color-only indicators.

### Touch Targets

- Minimum touch target: **44px x 44px** (aligns with Button `lg` height)
- Default button height: **40px** (`h-10`), meets minimum at `sm` (36px) with adequate spacing
- Icon buttons: **40px x 40px** (`h-10 w-10`)

### Focus Management

- **Never remove focus outlines.** The `:focus-visible` ring is copper-colored and always visible.
- Modals trap focus within their container.
- Drawers return focus to the trigger element on close.
- Use `tabindex="0"` for custom interactive elements.
- Skip links should be the first focusable element.

### Reduced Motion

Globally respected via `prefers-reduced-motion: reduce`. All animations reduce to near-instant (`0.01ms`). No per-component opt-in required.

### Semantic Structure

- Use semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`).
- Headings follow a logical hierarchy (no skipping levels).
- All images have `alt` text.
- Form inputs have associated `<label>` elements (via `FormField` component).
- Use `aria-label` for icon-only buttons.

### Keyboard Navigation

- All interactive elements are keyboard accessible.
- `Enter`/`Space` for buttons and links.
- `Escape` closes modals, drawers, dropdowns, and popovers.
- Arrow keys navigate within composite widgets (tabs, menus, radios).

---

## 12. Components

The `@tpmjs/ui` package contains 48 components. Each follows a consistent file structure:

```
packages/ui/src/<ComponentName>/
  ComponentName.tsx   # Implementation
  tokens.ts           # Component-specific design tokens
  variants.ts         # Variant system (createVariants)
  types.ts            # TypeScript interfaces
  index.ts            # Re-export (if present)
```

Import pattern (no barrel exports):

```tsx
import { Button } from '@tpmjs/ui/Button/Button';
import { Card } from '@tpmjs/ui/Card/Card';
```

### Layout

| Component       | Description                                     |
|-----------------|-------------------------------------------------|
| `Container`     | Max-width wrapper with responsive padding       |
| `GridContainer` | CSS grid wrapper with gap and column props       |
| `Section`       | Semantic section with consistent vertical spacing|

### Navigation

| Component     | Description                                       |
|---------------|---------------------------------------------------|
| `Breadcrumbs` | Path breadcrumb trail with separators             |
| `Header`      | Top navigation bar                                |
| `Pagination`  | Page navigation with prev/next and page numbers   |
| `Tabs`        | Tabbed navigation with panel switching            |

### Data Display

| Component         | Description                                          |
|-------------------|------------------------------------------------------|
| `ActivityStream`  | Chronological event feed with icons and timestamps   |
| `AnimatedCounter` | Number that animates on value change                 |
| `Badge`           | Status/category label (small colored pill)           |
| `CodeBlock`       | Syntax-highlighted code with copy button             |
| `FlowDiagram`     | Visual flow/connection diagram                       |
| `InstallSnippet`  | `npm install` command with one-click copy            |
| `PageHeader`      | Page title with optional description and actions     |
| `ProgressBar`     | Horizontal progress indicator                        |
| `QualityScore`    | Numeric quality score display with visual indicator  |
| `StatCard`        | Metric card with label, value, and trend             |
| `Table`           | Data table with sorting, density support             |
| `ToolCard`        | Tool listing card with name, description, badges     |
| `ToolHealthBadge` | Colored badge showing tool health status             |
| `ToolHealthBanner`| Banner with tool health summary                      |
| `ToolRenderer`    | Full tool detail renderer                            |

### Form Controls

| Component   | Description                                      |
|-------------|--------------------------------------------------|
| `Button`    | Primary interactive element (8 variants, 4 sizes)|
| `Checkbox`  | Boolean toggle with checkmark animation          |
| `FormField` | Label + input + helper/error text wrapper        |
| `Input`     | Text input field                                 |
| `Label`     | Form label element                               |
| `Radio`     | Radio button group item                          |
| `Select`    | Dropdown select input                            |
| `Slider`    | Range slider input                               |
| `Switch`    | Toggle switch (on/off)                           |
| `Textarea`  | Multi-line text input                            |

### Feedback

| Component      | Description                              |
|----------------|------------------------------------------|
| `EmptyState`   | Placeholder for empty lists/pages        |
| `ErrorState`   | Error message display with retry action  |
| `LoadingState` | Loading placeholder with spinner/skeleton|
| `Skeleton`     | Shimmer placeholder for loading content  |
| `Spinner`      | Rotating loading indicator               |
| `Toast`        | Temporary notification message           |
| `Tooltip`      | Hover/focus tooltip with arrow           |

### Overlay

| Component      | Description                                  |
|----------------|----------------------------------------------|
| `Drawer`       | Slide-out panel (left/right/bottom)          |
| `DropdownMenu` | Contextual menu triggered by a button        |
| `Modal`        | Centered dialog overlay with backdrop        |
| `Popover`      | Anchored floating content panel              |

### Visual / Decorative

| Component      | Description                                          |
|----------------|------------------------------------------------------|
| `DitherCanvas` | Canvas-based dithering effect for images             |
| `DitherText`   | Text rendered with dithering visual effect           |
| `Icon`         | Wrapper for Lucide icons with size/color props       |

### Shared System

| Module                | Description                                      |
|-----------------------|--------------------------------------------------|
| `system/variants.ts`  | `createVariants()` utility for type-safe variants|
| `tokens/*`            | Global design tokens (colors, spacing, etc.)     |

### Button Variants (Detail)

The Button component is the most variant-rich component:

**Variants:**

| Variant          | Visual                                              | Usage                          |
|------------------|-----------------------------------------------------|--------------------------------|
| `default`        | Copper background, white text                       | Primary actions                |
| `destructive`    | Red background, white text                          | Delete, remove actions         |
| `outline`        | Transparent, solid border                           | Secondary actions              |
| `outline-dotted` | Transparent, dotted border                          | Tertiary/technical actions     |
| `blueprint`      | Card background, dotted border, blueprint shadow    | Blueprint-aesthetic actions    |
| `secondary`      | Light gray background                               | Low-emphasis actions           |
| `ghost`          | No background, no border                            | Minimal actions, icon buttons  |
| `link`           | Text only, underline on hover                       | Inline links                   |

**Sizes:**

| Size   | Height | Padding     | Font Size |
|--------|--------|-------------|-----------|
| `sm`   | 36px   | `px-3`      | sm (14px) |
| `md`   | 40px   | `px-4`      | base (16px)|
| `lg`   | 44px   | `px-8`      | lg (18px) |
| `icon` | 40px   | `p-0` (40x40)| -        |

All buttons use `font-mono`, `font-medium`, `lowercase`, `rounded-none`.

```tsx
import { Button } from '@tpmjs/ui/Button/Button';

<Button variant="default" size="md">submit</Button>
<Button variant="outline-dotted" size="sm">cancel</Button>
<Button variant="ghost" size="icon"><X className="w-5 h-5" /></Button>
```

### Form Sizing Tokens

All form controls share consistent height tokens (aligned with Button):

```ts
import { formHeight, formControl, formSwitch } from '@tpmjs/ui/tokens/forms';

// Input/select heights match button heights
formHeight.sm  // '2.25rem' (36px)
formHeight.md  // '2.5rem'  (40px)
formHeight.lg  // '2.75rem' (44px)

// Checkbox/radio sizes
formControl.size.sm  // '16px'
formControl.size.md  // '20px'
formControl.size.lg  // '24px'

// Switch dimensions
formSwitch.md.width  // '44px'
formSwitch.md.height // '24px'
formSwitch.md.thumb  // '20px'
```

Form spacing tokens:

```ts
import { formGap } from '@tpmjs/ui/tokens/forms';

formGap.label  // '0.5rem'   (8px)  - between label and input
formGap.helper // '0.25rem'  (4px)  - between input and helper text
formGap.error  // '0.375rem' (6px)  - between input and error message
formGap.field  // '1rem'     (16px) - between form fields
formGap.group  // '0.625rem' (10px) - between radio/checkbox items
```

---

## 13. Theming

### Light / Dark Mode

Themes are controlled by adding the `dark` class to the root `<html>` element (Next.js `next-themes` approach):

```html
<html class="dark">  <!-- Dark mode -->
<html>                <!-- Light mode (default) -->
```

All semantic CSS variables update automatically. Components require no theme-specific props.

### CSS Variable Architecture

Variables are defined in `apps/web/src/app/globals.css` in two blocks:

```css
:root {
  /* Light mode values */
  --background: 0 0% 100%;
  --foreground: 0 0% 4%;
  /* ... */
}

.dark {
  /* Dark mode overrides */
  --background: 0 0% 4%;
  --foreground: 0 0% 93%;
  /* ... */
}
```

All color variables use **HSL values without the `hsl()` wrapper**, allowing alpha composition:

```css
/* Variable stores: 22 57% 41% */
/* Usage with alpha: */
background-color: hsl(var(--primary) / 0.5);
```

### Overriding Tokens

To customize tokens for a section of the page, re-declare CSS variables on a container:

```html
<div style="--primary: 210 92% 45%; --primary-foreground: 0 0% 100%;">
  <!-- Everything inside uses blue as primary instead of copper -->
  <Button>Now I'm blue</Button>
</div>
```

To override radius for a specific section (break from brutalist default):

```html
<div style="--radius-sm: 4px; --radius-md: 6px; --radius-lg: 8px;">
  <!-- Components here get rounded corners -->
</div>
```

### Adding New Theme Variables

1. Add the variable to both `:root` and `.dark` blocks in `globals.css`
2. Reference it in Tailwind config if needed
3. Use via `hsl(var(--your-variable))` in CSS or `className="bg-[hsl(var(--your-variable))]"` in JSX

### Component Variant System

Components use `createVariants()` from `packages/ui/src/system/variants.ts` for type-safe variant composition:

```ts
import { createVariants } from '../system/variants';

export const cardVariants = createVariants({
  base: 'border bg-card text-card-foreground',
  variants: {
    variant: {
      default: 'shadow-sm',
      outline: 'border-border-strong',
      ghost: 'border-transparent shadow-none',
    },
    size: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});
```

---

## 14. Content & Writing

### Voice & Tone

| Attribute   | Guideline                                              |
|-------------|--------------------------------------------------------|
| Technical   | Write for developers. Assume familiarity with npm, APIs, CLI. |
| Concise     | Short sentences. No filler. Every word earns its place. |
| Lowercase   | Button labels and UI actions are lowercase (`submit`, `cancel`, `delete`). |
| Direct      | "Install this tool" not "You might want to consider installing this tool." |
| Neutral     | No exclamation marks in UI text. No "awesome" or "amazing." |

### UI Text Conventions

| Element         | Convention                     | Example                    |
|-----------------|--------------------------------|----------------------------|
| Button labels   | Lowercase, verb-first, mono    | `submit`, `delete tool`    |
| Page titles     | Title case or uppercase        | `Tool Registry`, `TOOLS`   |
| Descriptions    | Sentence case, no period       | `Discover JavaScript tools`|
| Error messages  | Sentence case, actionable      | `Failed to load. Try again`|
| Empty states    | Sentence case, suggest action  | `No tools found. Add one`  |
| Tooltips        | Sentence case, brief           | `Copy to clipboard`        |
| Breadcrumbs     | Title case                     | `Dashboard / Admin / Users`|
| Table headers   | Sentence case or lowercase     | `name`, `last updated`     |
| Placeholders    | Lowercase, descriptive         | `search tools...`          |

### Formatting

- **Numbers:** Use `Intl.NumberFormat` for locale-aware formatting. Use `AnimatedCounter` for dynamic values.
- **Dates:** Relative when recent ("2 hours ago"), absolute when old ("Mar 8, 2026").
- **Code:** Always in `font-mono`. Inline code uses backtick styling; blocks use `CodeBlock` component.
- **Lists:** Use `Table` component for structured data, bullet lists for prose content.

---

## 15. Data Visualization

### Chart Colors

Use the accent palette for data series. Assign in this order for maximum differentiation:

| Series | Color   | Hex       |
|--------|---------|-----------|
| 1      | Blue    | `#60A5FA` |
| 2      | Green   | `#34D399` |
| 3      | Orange  | `#FB923C` |
| 4      | Purple  | `#A78BFA` |
| 5      | Pink    | `#F472B6` |
| 6      | Yellow  | `#FBBF24` |

For single-metric charts, use copper (`--primary`) as the primary data color.

### Typography in Charts

- **Axis labels:** `text-xs font-mono text-foreground-tertiary`
- **Axis values:** `text-xs font-mono text-foreground-secondary`
- **Chart title:** `text-sm font-semibold text-foreground`
- **Data labels:** `text-xs font-mono text-foreground`
- **Legends:** `text-xs text-foreground-secondary`

### Chart Conventions

- Use the `bar-grow` animation for bar charts: `.animate-bar-grow` (800ms ease-out, transform-origin bottom)
- Gridlines use `hsl(var(--border-subtle))` (very light)
- Tooltips use the `Tooltip` component or `Popover` for rich content
- No 3D effects, no gradients in chart fills
- Use solid fills with `opacity-80` for area charts
- Axis lines use `hsl(var(--border))`

---

## 16. Grid Patterns

TPMJS uses background grid patterns as a distinctive visual element. Three patterns are available as CSS utility classes.

### Standard Grid

```html
<div class="grid-background">
  <!-- 24px x 24px grid lines -->
</div>
```

```css
.grid-background {
  background-image:
    linear-gradient(hsl(var(--grid-color)) 1px, transparent 1px),
    linear-gradient(90deg, hsl(var(--grid-color)) 1px, transparent 1px);
  background-size: var(--grid-size) var(--grid-size);  /* 24px */
}
```

### Dotted Grid

```html
<div class="dotted-grid-background">
  <!-- 24px x 24px dot pattern -->
</div>
```

```css
.dotted-grid-background {
  background-image: radial-gradient(
    circle, hsl(var(--grid-color)) 1px, transparent 1px
  );
  background-size: var(--grid-size) var(--grid-size);
}
```

### Blueprint Grid

A two-layer grid with major (4x) and minor (1x) gridlines:

```html
<div class="blueprint-background">
  <!-- 96px major grid + 24px minor grid -->
</div>
```

Major gridlines are at full grid-color opacity; minor gridlines at 30% opacity. This creates a technical blueprint/engineering drawing aesthetic.

### Animated Grid

```html
<div class="grid-background-animated">
  <!-- Standard grid with slow opacity pulse (8s cycle) -->
</div>
```

Pulses between 40% and 60% opacity over 8 seconds. Use sparingly for hero sections.

### Blueprint Scanline

An animated horizontal line that sweeps vertically across a container:

```html
<div class="relative">
  <div class="blueprint-scanline"></div>
  <!-- Content -->
</div>
```

The scanline is a 2px copper-tinted gradient line that traverses the container height over 30 seconds. Position the parent as `relative` and the scanline is absolutely positioned with `pointer-events: none`.

### Grid Color Tokens

| Mode  | CSS Variable    | HSL Value       | Description            |
|-------|-----------------|-----------------|------------------------|
| Light | `--grid-color`  | `0 0% 92%`     | Subtle gray lines      |
| Dark  | `--grid-color`  | `0 0% 12%`     | Subtle dark lines      |

Grid size is controlled by `--grid-size` (default `24px`). Override to change density:

```html
<div class="grid-background" style="--grid-size: 16px;">
  <!-- Tighter 16px grid -->
</div>
```

---

## Z-Index Reference

Complete layering system:

| Layer            | CSS Variable           | Value | Usage                    |
|------------------|------------------------|-------|--------------------------|
| Base             | `--z-base`             | 0     | Default stacking         |
| Dropdown         | `--z-dropdown`         | 100   | Dropdown menus           |
| Sticky           | `--z-sticky`           | 200   | Sticky headers, sidebars |
| Fixed            | `--z-fixed`            | 300   | Fixed position elements  |
| Drawer           | `--z-drawer`           | 350   | Slide-out drawers        |
| Modal backdrop   | `--z-modal-backdrop`   | 400   | Modal overlay background |
| Modal            | `--z-modal`            | 500   | Modal dialog content     |
| Popover          | `--z-popover`          | 600   | Floating popovers        |
| Tooltip          | `--z-tooltip`          | 700   | Tooltips                 |
| Toast            | `--z-toast`            | 800   | Toast notifications      |
| Notification     | `--z-notification`     | 850   | System notifications     |
| Command palette  | `--z-command-palette`  | 900   | Command palette overlay  |

---

## Quick Reference

### Most Common Tailwind Patterns

```tsx
// Page layout
<main className="bg-background min-h-screen">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// Card
<div className="bg-card border border-border p-4">

// Heading
<h1 className="text-2xl font-bold tracking-tight text-foreground">

// Body text
<p className="text-sm text-foreground-secondary leading-relaxed prose-width">

// Muted text
<span className="text-xs text-foreground-muted font-mono">

// Dotted divider
<hr className="border-t-dotted border-border my-6" />

// Primary action
<Button variant="default">submit</Button>

// Secondary action
<Button variant="outline-dotted" size="sm">cancel</Button>

// Status badge
<Badge variant="success">healthy</Badge>

// Focus ring (custom elements)
<div tabIndex={0} className="focus-ring">

// Grid background section
<section className="grid-background p-16">

// Brutalist hero
<h1 className="brutalist-heading">TPMJS</h1>
<h2 className="brutalist-subheading">TOOL REGISTRY</h2>
```

### File Locations

| What                    | Where                                         |
|-------------------------|-----------------------------------------------|
| CSS variables           | `apps/web/src/app/globals.css`                |
| Color tokens            | `packages/ui/src/tokens/colors.ts`            |
| Typography tokens       | `packages/ui/src/tokens/typography.ts`        |
| Spacing tokens          | `packages/ui/src/tokens/spacing.ts`           |
| Border tokens           | `packages/ui/src/tokens/borders.ts`           |
| Shadow tokens           | `packages/ui/src/tokens/shadows.ts`           |
| Animation tokens        | `packages/ui/src/tokens/animations.ts`        |
| Form tokens             | `packages/ui/src/tokens/forms.ts`             |
| Variant system          | `packages/ui/src/system/variants.ts`          |
| Tailwind config         | `packages/ui/tailwind.config.ts`              |
| Components              | `packages/ui/src/<ComponentName>/`            |
