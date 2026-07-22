# syntax=docker/dockerfile:1

# Runtime-only image for the traced Next.js server. Build @tpmjs/web first and
# use apps/web/.next as the container build context; see AGENTS.md.
FROM docker.io/library/node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --chown=node:node standalone ./
COPY --chown=node:node static ./apps/web/.next/static
# This content-addressed marker changes for every release. Keeping it after the
# large standalone copies lets Podman reuse those layers when their content did
# not change while guaranteeing that provenance metadata is never stale.
COPY --chown=node:node .tpmjs-release-provenance ./.tpmjs-release-provenance

ARG COMMIT_SHA=local
ARG COMMIT_MESSAGE=local
LABEL org.opencontainers.image.revision=${COMMIT_SHA} \
      org.opencontainers.image.title="TPMJS Web"

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TPMJS_COMMIT_SHA=${COMMIT_SHA} \
    TPMJS_COMMIT_MESSAGE=${COMMIT_MESSAGE} \
    TPMJS_DEPLOYMENT_URL=https://tpmjs.com

USER node
WORKDIR /app/apps/web
EXPOSE 3000

ENTRYPOINT ["tini", "--"]
CMD ["node", "server.js"]
