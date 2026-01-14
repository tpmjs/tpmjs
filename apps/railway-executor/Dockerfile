# Use official Deno image
FROM denoland/deno:1.39.0

# Install OpenSSH client for tools that need SSH access (e.g., exe-dev)
USER root
RUN apt-get update && apt-get install -y openssh-client && rm -rf /var/lib/apt/lists/*
USER deno

# Set working directory
WORKDIR /app

# Set Deno cache directory to use mounted volume
ENV DENO_DIR=/data

# Copy server file
COPY server.ts .

# Expose port (Railway will set PORT env var)
EXPOSE 3002

# Run the Deno server
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--allow-run", "server.ts"]
