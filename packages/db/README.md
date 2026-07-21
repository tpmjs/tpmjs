# @tpmjs/db

Database package for TPMJS NPM Registry. Provides Prisma ORM setup and database client for storing tool metadata.

## One-command setup

From the repository root:

```bash
pnpm dev:setup
```

This starts PostgreSQL 17 on `127.0.0.1:55433`, waits for its healthcheck,
applies the migration ledger, generates Prisma Client, seeds an executable
starter package, and verifies the registry counter invariants. The named volume
is persistent and the command is safe to rerun.

## Manual setup

The individual steps remain available when you need a custom database.

### 1. Start local PostgreSQL

```bash
docker compose --file compose.dev.yaml up --detach postgres
```

### 2. Configure Environment

```bash
cp .env.example apps/web/.env.local
# The default URL is postgresql://tpmjs:tpmjs@127.0.0.1:55433/tpmjs
```

### 3. Apply migrations and seed

```bash
export DATABASE_URL=postgresql://tpmjs:tpmjs@127.0.0.1:55433/tpmjs
export DATABASE_URL_UNPOOLED="$DATABASE_URL"
pnpm --filter=@tpmjs/db db:migrate:deploy
pnpm --filter=@tpmjs/db db:seed
```

## Usage

```typescript
import { prisma } from '@tpmjs/db';

// Query tools
const tools = await prisma.tool.findMany({
  where: {
    category: 'web-scraping',
    isOfficial: true,
  },
  orderBy: {
    qualityScore: 'desc',
  },
  take: 10,
});

// Update sync checkpoint
await prisma.syncCheckpoint.update({
  where: { source: 'changes-feed' },
  data: {
    checkpoint: {
      sequence: '12345',
      lastProcessed: new Date().toISOString(),
    },
  },
});
```

## Scripts

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database (for development)
- `pnpm db:migrate` - Create and run migrations (for production)
- `pnpm db:migrate:deploy` - Apply existing migrations without creating new ones
- `pnpm db:studio` - Open Prisma Studio GUI
- `pnpm db:seed` - Seed initial data

## Schema

### Tool
Stores NPM packages with TPMJS metadata from their `package.json`.

### SyncCheckpoint
Tracks progress of sync workers (changes feed, keyword search, metrics).

### SyncLog
Audit trail of all sync operations.
