# Use official Deno image
FROM denoland/deno:1.39.0

# Set working directory
WORKDIR /app

# Set Deno cache directory to persist across requests
ENV DENO_DIR=/app/.deno_cache

# Create cache directory
RUN mkdir -p /app/.deno_cache

# Copy files
COPY server.ts .
COPY deno.json .

# Pre-cache zod-to-json-schema (used by server.ts)
RUN deno cache --reload \
  https://esm.sh/zod-to-json-schema@3.25.0

# Pre-cache common AI SDK dependencies to speed up first loads
RUN deno cache --reload \
  https://esm.sh/ai@5.0.83 \
  https://esm.sh/zod@3.22.0 || true

# Expose port (Railway will set PORT env var)
EXPOSE 3002

# Run the Deno server
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "server.ts"]
