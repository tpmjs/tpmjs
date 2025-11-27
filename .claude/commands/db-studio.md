---
description: Open Prisma Studio to view and edit database data
---

Open Prisma Studio, a visual database browser:

1. Run `pnpm --filter=@tpmjs/db db:studio` in the background
2. Wait for the "Prisma Studio is up on http://localhost:5555" message
3. Tell the user that Prisma Studio is now running at http://localhost:5555
4. Remind the user they can view and edit all database tables (Tool, SyncCheckpoint, SyncLog) in the browser
5. Tell them to use Ctrl+C in the terminal or kill the background process when done

This provides a visual interface to browse, search, and edit database records.
