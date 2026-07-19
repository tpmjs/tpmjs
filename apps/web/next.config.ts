import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const nextConfig: NextConfig = {
  // Produce a traced runtime instead of shipping the entire monorepo and its
  // development dependencies in the production container. The tracing root
  // must include workspace packages imported by the web application.
  output: 'standalone',
  outputFileTracingRoot: monorepoRoot,
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
  async rewrites() {
    return [
      {
        source: '/install.sh',
        destination: '/api/setup/install.sh',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/tools-ideas',
        destination: '/tool-ideas',
        permanent: true,
      },
      {
        // /tools is not a route (the browse UI lives at /tool/tool-search)
        // but it's a guessable URL people and crawlers keep hitting
        source: '/tools',
        destination: '/tool/tool-search',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Security headers set here (not in vercel.json, which no longer
        // serves traffic) so they apply regardless of where the app is hosted.
        // SAMEORIGIN (not DENY): TechDiagram frames /isoflow-embed.html same-origin.
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
          },
        ],
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
