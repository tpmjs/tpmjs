#!/bin/bash
# Create Deno cache directory with correct permissions (runs as root)
mkdir -p /tmp/deno-cache
chown -R deno:deno /tmp/deno-cache

# Switch to deno user and run the server
exec su deno -c "deno run --allow-net --allow-env --allow-read --allow-write --allow-run server.ts"
