import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tpmjs/ui', '@tpmjs/utils', '@tpmjs/db', '@tpmjs/types', '@tpmjs/env'],
  reactStrictMode: true,
  serverExternalPackages: ['@tpmjs/package-executor'],
  async redirects() {
    return [
      {
        source: '/tools-ideas',
        destination: '/tool-ideas',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
