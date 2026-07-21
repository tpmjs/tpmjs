# @tpmjs/utils

Small shared utilities for [TPMJS](https://tpmjs.com) applications — Tailwind class merging and value formatting.

[![npm version](https://img.shields.io/npm/v/@tpmjs/utils.svg)](https://www.npmjs.com/package/@tpmjs/utils)
[![License: MIT](https://img.shields.io/github/license/tpmjs/tpmjs)](https://github.com/tpmjs/tpmjs/blob/main/LICENSE)

A tiny internal helper library used across the TPMJS web and app packages. It provides a `cn` class-name merger (clsx + tailwind-merge) and a handful of `Intl`-based formatting helpers. Entry points are exposed as subpath exports so you import only what you need.

## Installation

```bash
npm install @tpmjs/utils
```

## Usage

Merge Tailwind class names, resolving conflicts:

```typescript
import { cn } from '@tpmjs/utils/cn';

cn('px-2 py-1', 'px-4');           // => 'py-1 px-4'
cn('text-sm', condition && 'font-bold');
```

Format dates and numbers:

```typescript
import { formatDate, formatNumber, formatTimeAgo } from '@tpmjs/utils/format';

formatDate(new Date('2026-01-15'));  // => 'January 15, 2026'
formatNumber(1234567);               // => '1,234,567'
formatTimeAgo('2026-07-19T00:00:00Z'); // => '2d ago' (relative to now)
```

## API

**`@tpmjs/utils/cn`**

- `cn(...inputs: ClassValue[]): string` — merge class names via `clsx`, then dedupe/resolve Tailwind conflicts via `tailwind-merge`.

**`@tpmjs/utils/format`**

- `formatDate(date: Date): string` — long US date (e.g. `January 15, 2026`).
- `formatNumber(num: number): string` — grouped US number (e.g. `1,234,567`).
- `formatTimeAgo(date: Date | string): string` — compact relative time (`just now`, `5m ago`, `3h ago`, `2d ago`, `1w ago`, `4mo ago`, `2y ago`).

## Links

- Repository: [github.com/tpmjs/tpmjs](https://github.com/tpmjs/tpmjs) (`packages/utils`)
- Website: [tpmjs.com](https://tpmjs.com)

## License

MIT
