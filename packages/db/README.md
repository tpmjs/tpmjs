# @tpmjs/db

Database package for TPMJS NPM Registry. Provides Prisma ORM setup and database client for storing tool metadata.

## Setup

### 1. Start a Local Postgres

Run a local PostgreSQL container for development:

```bash
docker run -d --name tpmjs-dev-pg -p 5432:5432 \
  -e POSTGRES_USER=tpmjs -e POSTGRES_PASSWORD=tpmjs -e POSTGRES_DB=tpmjs \
  postgres:17
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL=postgresql://tpmjs:tpmjs@localhost:5432/tpmjs
```

### 3. Push the Schema

```bash
pnpm db:push
pnpm db:seed
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
- `pnpm db:studio` - Open Prisma Studio GUI
- `pnpm db:seed` - Seed initial data

## Schema

### Tool
Stores NPM packages with TPMJS metadata from their `package.json`.

### SyncCheckpoint
Tracks progress of sync workers (changes feed, keyword search, metrics).

### SyncLog
Audit trail of all sync operations.
