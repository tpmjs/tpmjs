# Use official Deno image
FROM denoland/deno:1.39.0

# Install OpenSSH client for tools that need SSH access (e.g., exe-dev)
USER root
RUN apt-get update && apt-get install -y openssh-client && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Set Deno cache directory to use mounted volume
ENV DENO_DIR=/data

# Copy server file and startup script
COPY server.ts .
COPY start.sh .
RUN chmod +x start.sh

# Expose port (Railway will set PORT env var)
EXPOSE 3002

# Run startup script that fixes permissions then starts Deno as deno user
CMD ["./start.sh"]
