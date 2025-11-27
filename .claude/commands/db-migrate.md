---
description: Create and apply a Prisma migration
---

Create and apply a new Prisma migration:

1. Run `pnpm --filter=@tpmjs/db db:migrate` to create and apply a migration
2. The migration will be named automatically based on changes
3. After migration completes, regenerate the Prisma client with `pnpm --filter=@tpmjs/db db:generate`
4. Report the results to the user

This is used for production-ready database schema changes that create migration files.
