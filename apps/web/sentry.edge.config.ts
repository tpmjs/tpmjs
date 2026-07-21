import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://0b61db9cf233f36811d7b33d17757251@o4510869662203904.ingest.us.sentry.io/4510869663055872',
  enabled: process.env.NODE_ENV === 'production',

  tracesSampleRate: 0.05,

  initialScope: {
    tags: { runtime: 'edge' },
  },

  release: process.env.TPMJS_COMMIT_SHA,
});
