# TPMJS Agent Sandbox Server
FROM denoland/deno:2.1.9

# Install curl for health checks
USER root
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Create sessions directory with correct permissions
RUN mkdir -p /tmp/tpmjs-sandbox/sessions && chown -R deno:deno /tmp/tpmjs-sandbox

# Set working directory
WORKDIR /app

# Set Deno cache directory
ENV DENO_DIR=/tmp/deno-cache

# Copy server file
COPY server.ts .

# Expose port (Railway will set PORT env var)
EXPOSE 3002

# Docker-level health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3002}/health || exit 1

# Run as deno user with filesystem write permissions
USER deno
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write=/tmp", "--allow-run", "server.ts"]
