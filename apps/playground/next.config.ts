import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tpmjs/ui', '@tpmjs/utils', '@tpmjs/types', '@tpmjs/env'],
  reactStrictMode: true,
  experimental: {
    urlImports: ['https://esm.sh/', 'https://cdn.jsdelivr.net/npm/'],
  },
};

export default nextConfig;
