# TPMJS Agent Sandbox Server
FROM denoland/deno:2.1.9

# Install curl for health checks
USER root
RUN apt-get update && apt-get install -y --no-install-recommends curl git openssh-client ca-certificates && rm -rf /var/lib/apt/lists/*

# Create sessions directory with correct permissions
RUN mkdir -p /tmp/tpmjs-sandbox/sessions && chown -R deno:deno /tmp/tpmjs-sandbox

# Set working directory
WORKDIR /app

# Set Deno cache directory
ENV DENO_DIR=/tmp/deno-cache

# Git credential helper (reads GITHUB_TOKEN from env for private repo clones)
COPY git-credential-env /usr/local/bin/git-credential-env
RUN chmod +x /usr/local/bin/git-credential-env && \
    git config --system credential.helper '/usr/local/bin/git-credential-env'

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
