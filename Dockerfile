# syntax=docker/dockerfile:1

# Runtime-only image for the traced Next.js server. Build @tpmjs/web first and
# use apps/web/.next as the container build context; see AGENTS.md.
FROM docker.io/library/node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl tini \
    && rm -rf /var/lib/apt/lists/*

ARG COMMIT_SHA=local
ARG COMMIT_MESSAGE=local
LABEL org.opencontainers.image.revision=${COMMIT_SHA} \
      org.opencontainers.image.title="TPMJS Web"

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    VERCEL_GIT_COMMIT_SHA=${COMMIT_SHA} \
    VERCEL_GIT_COMMIT_MESSAGE=${COMMIT_MESSAGE}

WORKDIR /app
COPY --chown=node:node standalone ./
COPY --chown=node:node static ./apps/web/.next/static

USER node
WORKDIR /app/apps/web
EXPOSE 3000

ENTRYPOINT ["tini", "--"]
CMD ["node", "server.js"]
