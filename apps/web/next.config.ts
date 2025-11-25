import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tpmjs/ui', '@tpmjs/utils'],
  reactStrictMode: true,
};

export default nextConfig;
