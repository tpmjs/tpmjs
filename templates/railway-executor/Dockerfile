FROM node:20-slim

# Install npm for tool installation during execution
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy executor files
COPY package.json index.js ./

# Create temp directory for tool executions
RUN mkdir -p /tmp

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "index.js"]
