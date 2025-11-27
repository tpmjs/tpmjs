---
description: Seed the database with initial data
---

Run the database seed script to initialize the database with default data:

1. Run `pnpm --filter=@tpmjs/db db:seed` to execute the seed script
2. The seed script will create initial SyncCheckpoint records for the changes feed and keyword sync
3. Report the results to the user

This should be run once after creating the database to set up the initial sync checkpoints. It's safe to run multiple times - it will only create records if they don't already exist.
