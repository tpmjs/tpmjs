import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tpmjs/ui', '@tpmjs/utils', '@tpmjs/db', '@tpmjs/types', '@tpmjs/env'],
  reactStrictMode: true,
  serverExternalPackages: ['@tpmjs/package-executor'],
};

export default nextConfig;
