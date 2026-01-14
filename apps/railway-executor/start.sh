#!/bin/bash
# Fix permissions on the Deno cache directory (runs as root)
mkdir -p /data
chown -R deno:deno /data

# Switch to deno user and run the server
exec su deno -c "deno run --allow-net --allow-env --allow-read --allow-write --allow-run server.ts"
