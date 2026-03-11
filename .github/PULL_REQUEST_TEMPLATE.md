## What

<!-- Brief description of the change -->

## Why

<!-- Why is this change needed? Link to issue if applicable -->

## How

<!-- How does this work? Any architectural decisions worth noting? -->

## Checklist

- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] Tests added/updated if applicable
- [ ] No barrel exports (direct imports only)
- [ ] Uses `@tpmjs/ui` components (no raw HTML buttons/inputs/tables)
- [ ] API routes have `export const runtime = 'nodejs'` and `export const maxDuration = 60`
