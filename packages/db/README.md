# @tpmjs/db

Database package for TPMJS NPM Registry. Provides Prisma ORM setup and database client for storing tool metadata.

## Setup

### 1. Create Neon Database

1. Go to https://neon.tech/
2. Create a new project
3. Copy the connection string

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your DATABASE_URL
```

### 3. Run Migrations

```bash
pnpm db:migrate
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
