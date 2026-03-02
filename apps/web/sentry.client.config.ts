import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://0b61db9cf233f36811d7b33d17757251@o4510869662203904.ingest.us.sentry.io/4510869663055872',
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',

  tracesSampleRate: 0.1,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.httpClientIntegration(),
    Sentry.captureConsoleIntegration({ levels: ['error'] }),
    Sentry.extraErrorDataIntegration(),
  ],

  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
});

Sentry.setTag('runtime', 'browser');
