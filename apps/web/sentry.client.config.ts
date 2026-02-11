import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://JSTtH3BXAb9myCFMxX2kVsh9@s1729722.eu-fsn-3.betterstackdata.com/1729722',
  enabled: process.env.NODE_ENV === 'production',

  tracesSampleRate: 0.1,

  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],

  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
});
