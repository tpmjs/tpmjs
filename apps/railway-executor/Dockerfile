# Use latest Deno LTS image for stability (fully-qualified for podman builds)
FROM docker.io/denoland/deno:2.1.9

# Install OpenSSH client for tools that need SSH access (e.g., exe-dev)
USER root
RUN apt-get update && apt-get install -y --no-install-recommends openssh-client curl pandoc jq postgresql-client && rm -rf /var/lib/apt/lists/*

# Pre-trust exe.dev's host key so exe-dev tools' ssh reaches auth instead of
# dying on interactive host-key verification (|| true: image still builds if
# exe.dev is unreachable at build time)
RUN mkdir -p /etc/ssh && ssh-keyscan -T 10 exe.dev >> /etc/ssh/ssh_known_hosts 2>/dev/null || true

# Set working directory
WORKDIR /app

# Set Deno cache directory (ephemeral, rebuilds on restart)
ENV DENO_DIR=/tmp/deno-cache

# Copy server file and startup script
COPY server.ts .
COPY start.sh .
RUN chmod +x start.sh

# Compile the real production entrypoint during every image build. This keeps
# TypeScript/Deno errors out of deploys and warms the immutable dependency
# cache used at startup.
RUN deno check --no-lock server.ts
# Production's Quadlet deliberately bypasses start.sh and starts as User=deno.
# Give that process ownership of the prewarmed cache so later dynamic npm/HTTP
# imports can extend it without falling back to root.
RUN chown -R deno:deno /tmp/deno-cache

ARG COMMIT_SHA=local
ARG COMMIT_MESSAGE=local
LABEL org.opencontainers.image.revision=${COMMIT_SHA} \
      org.opencontainers.image.title="TPMJS Dynamic Executor"
ENV TPMJS_EXECUTOR_VERSION=${COMMIT_SHA} \
    TPMJS_EXECUTOR_COMMIT_MESSAGE=${COMMIT_MESSAGE}

# Expose the service port (the on-box Quadlet sets PORT when overridden)
EXPOSE 3002

# Docker-level health check as a fallback
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3002}/health || exit 1

# Run startup script that fixes permissions then starts Deno as deno user
CMD ["./start.sh"]
