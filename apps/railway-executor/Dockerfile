# Use official Deno image
FROM denoland/deno:1.39.0

# Set working directory
WORKDIR /app

# Set Deno cache directory to use mounted volume
ENV DENO_DIR=/data

# Copy server file
COPY server.ts .

# Expose port (Railway will set PORT env var)
EXPOSE 3002

# Run the Deno server
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "server.ts"]
