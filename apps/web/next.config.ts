import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@tpmjs/ui',
    '@tpmjs/utils',
    '@tpmjs/db',
    '@tpmjs/types',
    '@tpmjs/env',
    '@tpmjs/config',
    '@tpmjs/registry-search',
    '@tpmjs/registry-execute',
  ],
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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: !process.env.CI,

  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  tunnelRoute: '/monitoring',

  widenClientFileUpload: true,

  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
});
