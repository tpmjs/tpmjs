#!/bin/bash
# Create Deno cache directory with correct permissions (runs as root)
mkdir -p /tmp/deno-cache
chown -R deno:deno /tmp/deno-cache

# Switch to deno user and run the server
# Deno 2.x permission flags for tool execution. --allow-sys: many packages read
# os.hostname()/cpus() at import time. --allow-ffi: native addons (canvas etc.)
# via npm: imports. The process already grants --allow-run, so neither widens
# the effective sandbox.
exec su deno -c "deno run --allow-net --allow-env --allow-read --allow-write --allow-run --allow-sys --allow-ffi server.ts"
