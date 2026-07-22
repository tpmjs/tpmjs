# TPMJS Design System Specification

> A technical, precise design system inspired by [turbopuffer.com](https://turbopuffer.com) - warm, monospace-driven, with generous whitespace and fieldset-style containers.

---

## Brand Direction

### Mood & Personality
- **Technical & Precise** - Engineering-focused, trustworthy, developer-first
- **Warm & Distinctive** - Not cold/corporate, the copper accent adds warmth
- **Confident & Minimal** - Let the content speak, reduce visual noise

### Reference Sites
- [turbopuffer.com](https://turbopuffer.com) - Primary inspiration
- Linear, Vercel - Secondary references for technical clarity

---

## Color Palette

### Primary Accent
```css
--color-accent: #A6592D;           /* Copper/terracotta - primary brand color */
--color-accent-hover: #8B4A26;     /* Darker copper for hover states */
--color-accent-light: #D4A574;     /* Light copper for backgrounds/highlights */
```

### Gradient Header
```css
/* Warm gradient for top bar/hero sections */
--gradient-header: linear-gradient(135deg, #D4732A 0%, #8B3D1A 50%, #2D1810 100%);
```

### Neutral Palette
```css
/* Backgrounds */
--color-bg-primary: #FFFFFF;       /* Main background */
--color-bg-secondary: #FAFAFA;     /* Subtle sections */
--color-bg-elevated: #FFFFFF;      /* Cards, elevated surfaces */

/* Text */
--color-text-primary: #1A1A1A;     /* Primary text - near black */
--color-text-secondary: #666666;   /* Secondary/muted text */
--color-text-tertiary: #999999;    /* Placeholder, hints */

/* Borders */
--color-border: #E5E5E5;           /* Default borders */
--color-border-strong: #CCCCCC;    /* Emphasized borders */
--color-border-focus: #A6592D;     /* Focus state - uses accent */
```

### Semantic Colors
```css
--color-success: #22C55E;
--color-error: #EF4444;
--color-warning: #F59E0B;
--color-info: #3B82F6;
```

### Dark Mode (Future)
```css
/* Dark mode should invert while keeping the warm accent */
--color-bg-primary-dark: #0D0D0D;
--color-bg-secondary-dark: #1A1A1A;
--color-text-primary-dark: #F5F5F5;
--color-border-dark: #333333;
```

---

## Typography

### Font Stack

**Headings & Code: Monospace**
```css
--font-mono: 'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', monospace;
```

**Body Text: Sans-serif (for longer reading)**
```css
--font-sans: 'Inter', 'IBM Plex Sans', system-ui, sans-serif;
```

### Type Scale

| Element | Font | Size | Weight | Line Height | Letter Spacing |
|---------|------|------|--------|-------------|----------------|
| H1 | Mono | 48px (3rem) | 600 | 1.1 | -0.02em |
| H2 | Mono | 36px (2.25rem) | 600 | 1.2 | -0.01em |
| H3 | Mono | 24px (1.5rem) | 600 | 1.3 | 0 |
| H4 | Mono | 20px (1.25rem) | 600 | 1.4 | 0 |
| Body Large | Sans | 18px (1.125rem) | 400 | 1.7 | 0 |
| Body | Sans | 16px (1rem) | 400 | 1.7 | 0 |
| Body Small | Sans | 14px (0.875rem) | 400 | 1.6 | 0 |
| Caption | Sans | 12px (0.75rem) | 400 | 1.5 | 0.01em |
| Code | Mono | 14px (0.875rem) | 400 | 1.6 | 0 |

### Typography Rules
1. **Headings are lowercase** - "pricing", "faq", "tools" (not "Pricing", "FAQ", "Tools")
2. **Generous line-height** - Minimum 1.6 for body text, 1.7 preferred
3. **Bold sparingly** - Use weight 600 for emphasis, not 700+
4. **Monospace for data** - Numbers, metrics, technical values always in mono

### CSS Variables
```css
/* Font families */
--font-heading: var(--font-mono);
--font-body: var(--font-sans);
--font-code: var(--font-mono);

/* Font sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 2.25rem;   /* 36px */
--text-4xl: 3rem;      /* 48px */

/* Line heights */
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.7;

/* Font weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
```

---

## Spacing

### Spacing Scale
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Spacing Philosophy
- **Generous whitespace** - When in doubt, add more space
- **Vertical rhythm** - Use consistent spacing between sections (typically `--space-16` to `--space-24`)
- **Component padding** - Cards and containers use `--space-6` to `--space-8`
- **Text spacing** - Paragraphs separated by `--space-4` to `--space-6`

---

## Borders & Containers

### Border Radius
```css
--radius-none: 0;      /* DEFAULT - sharp corners */
--radius-sm: 2px;      /* Use sparingly for special cases */
--radius-md: 4px;      /* Use sparingly for special cases */
```

**Rule: Default to 0 border-radius. Sharp corners are the brand.**

### Border Styles

**Dashed (Primary)**
```css
border: 1px dashed var(--color-border);
```

**Solid (Emphasis)**
```css
border: 2px solid var(--color-text-primary);  /* Featured items */
```

### Fieldset-Style Containers

The signature container style with a label that "cuts into" the border:

```html
<fieldset class="fieldset-container">
  <legend>section title</legend>
  <!-- content -->
</fieldset>
```

```css
.fieldset-container {
  border: 1px dashed var(--color-border);
  padding: var(--space-6);
  margin: 0;
}

.fieldset-container legend {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  padding: 0 var(--space-2);
  text-transform: lowercase;
}
```

### Container Variants

| Variant | Border | Background | Use Case |
|---------|--------|------------|----------|
| Default | 1px dashed | transparent | Most containers |
| Elevated | 1px dashed | white | Cards on gray bg |
| Featured | 2px solid | white | Highlighted item |
| Ghost | none | transparent | Minimal grouping |

---

## Components

### Buttons

**Primary Button (Accent)**
```css
.btn-primary {
  background: var(--color-accent);
  color: white;
  border: none;
  padding: var(--space-3) var(--space-6);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background 150ms ease;
}

.btn-primary:hover {
  background: var(--color-accent-hover);
}
```

**Secondary Button (Outline)**
```css
.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: var(--space-3) var(--space-6);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: border-color 150ms ease;
}

.btn-secondary:hover {
  border-color: var(--color-text-primary);
}
```

**Button Sizes**
| Size | Padding | Font Size |
|------|---------|-----------|
| sm | `--space-2` `--space-4` | `--text-xs` |
| md | `--space-3` `--space-6` | `--text-sm` |
| lg | `--space-4` `--space-8` | `--text-base` |

### Links

```css
a {
  color: var(--color-text-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: opacity 150ms ease;
}

a:hover {
  opacity: 0.7;
}
```

**Rule: Links are underlined, not colored.** Use underline as the primary affordance.

### Inputs

```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-none);
  font-family: var(--font-mono);
  font-size: var(--text-base);
  background: white;
  transition: border-color 150ms ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.input::placeholder {
  color: var(--color-text-tertiary);
}
```

### Cards

```css
.card {
  border: 1px dashed var(--color-border);
  padding: var(--space-6);
  background: white;
}

.card--featured {
  border: 2px solid var(--color-text-primary);
}

.card__title {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  text-transform: lowercase;
  margin-bottom: var(--space-2);
}

.card__description {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}
```

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  border: 1px solid currentColor;
  text-transform: lowercase;
}

.badge--default { color: var(--color-text-secondary); }
.badge--success { color: var(--color-success); }
.badge--error { color: var(--color-error); }
.badge--warning { color: var(--color-warning); }
```

### Tables

```css
.table-container {
  border: 1px dashed var(--color-border);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.table th {
  text-align: left;
  padding: var(--space-4);
  border-bottom: 1px dashed var(--color-border);
  font-weight: var(--font-semibold);
  text-transform: lowercase;
}

.table td {
  padding: var(--space-4);
  border-bottom: 1px dashed var(--color-border);
}

.table tr:last-child td {
  border-bottom: none;
}
```

---

## Layout

### Container Widths
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
```

### Page Structure
```
┌─────────────────────────────────────────────┐
│  Gradient Header Bar (announcement)         │
├─────────────────────────────────────────────┤
│  Navigation (sticky, white bg)              │
├─────────────────────────────────────────────┤
│                                             │
│  Hero Section                               │
│  (generous padding: --space-24)             │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Content Sections                           │
│  (separated by --space-16 to --space-24)    │
│                                             │
│  ┌─ fieldset container ─────────────────┐   │
│  │ section title                        │   │
│  │                                      │   │
│  │  Content with generous padding       │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Interactions

### Hover States
- **Buttons**: Background color change (accent → darker)
- **Links**: Opacity reduction to 0.7
- **Cards**: Border color change (border → border-strong)
- **No transforms** - Avoid scale/translate on hover (too playful)

### Focus States
```css
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### Transitions
```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

**Rule: Keep transitions subtle and fast. No bouncy/spring animations.**

---

## Special Elements

### Gradient Header Bar
```css
.header-bar {
  background: var(--gradient-header);
  color: white;
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  text-align: center;
}
```

### Technical Diagrams
Use ASCII-style box diagrams with monospace font:
```
┌─────────────┐      ┌─────────────┐
│   client    │─────▶│    API      │
└─────────────┘      └─────────────┘
```

### Code Blocks
```css
.code-block {
  background: var(--color-bg-secondary);
  border: 1px dashed var(--color-border);
  padding: var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  overflow-x: auto;
}
```

### Sliders/Range Inputs
Custom styled with accent color, monospace tooltips showing values.

---

## Do's and Don'ts

### Do
- Use lowercase for headings
- Use dashed borders for containers
- Use generous whitespace
- Use monospace for technical content
- Use underlines for links
- Keep interactions subtle and fast
- Use the copper accent sparingly but confidently

### Don't
- Don't use rounded corners (except for special cases)
- Don't use drop shadows
- Don't use gradients (except header bar)
- Don't use icons where text works
- Don't use colored links
- Don't use bouncy animations
- Don't use multiple accent colors

---

## Implementation Priority

### Phase 1: Foundation
1. Update CSS variables (colors, spacing, typography)
2. Install fonts (JetBrains Mono, Inter)
3. Update base styles (reset, typography)

### Phase 2: Core Components
1. Button variants
2. Input/Form elements
3. Card/Container styles
4. Badge variants

### Phase 3: Layout
1. Fieldset-style containers
2. Page layouts with generous spacing
3. Navigation updates
4. Gradient header bar

### Phase 4: Polish
1. Table styles
2. Code blocks
3. Interactive elements (sliders, toggles)
4. Transitions and hover states

---

## References

- **Turbopuffer**: https://turbopuffer.com - Primary design inspiration
- **JetBrains Mono**: https://www.jetbrains.com/lp/mono/
- **Inter**: https://rsms.me/inter/

---

*Last updated: January 2025*
*Version: 1.0*
