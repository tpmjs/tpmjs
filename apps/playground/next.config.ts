import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tpmjs/ui', '@tpmjs/utils', '@tpmjs/types', '@tpmjs/env'],
  reactStrictMode: true,
};

export default nextConfig;
