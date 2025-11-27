---
description: Check if database connection is working and show table counts
---

Check if the database connection is working by:

1. Running `pnpm --filter=@tpmjs/db db:studio` in the background to verify Prisma can connect
2. If successful, kill the studio process immediately
3. Report connection status to the user

Then show me the current row counts for all tables (Tool, SyncCheckpoint, SyncLog) by writing a quick script that imports the Prisma client and queries each table.

This helps verify the database is properly configured and shows if any data exists.
