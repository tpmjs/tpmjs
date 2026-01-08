/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better serverless performance
  experimental: {
    // Allow dynamic imports from esm.sh
    serverActions: true,
  },
};

module.exports = nextConfig;
