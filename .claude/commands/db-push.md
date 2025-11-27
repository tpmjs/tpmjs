---
description: Push Prisma schema changes to database (dev only)
---

Push the current Prisma schema to the database without creating migrations:

1. Run `pnpm --filter=@tpmjs/db db:push` to sync schema changes to the database
2. After push completes, regenerate the Prisma client with `pnpm --filter=@tpmjs/db db:generate`
3. Report the results to the user

This is useful for development when you want to quickly iterate on schema changes without creating migration files. Do NOT use this in production - use db:migrate instead.
