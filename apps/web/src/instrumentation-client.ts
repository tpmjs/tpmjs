import * as Sentry from '@sentry/nextjs';
import { isThirdPartyBrowserError } from '~/lib/sentry-filters';

Sentry.init({
  dsn: 'https://0b61db9cf233f36811d7b33d17757251@o4510869662203904.ingest.us.sentry.io/4510869663055872',
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NEXT_PUBLIC_TPMJS_ENV || 'development',

  tracesSampleRate: 0.1,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.httpClientIntegration(),
    Sentry.captureConsoleIntegration({ levels: ['error'] }),
    Sentry.extraErrorDataIntegration(),
  ],

  // Drop exceptions thrown entirely by injected third-party code (browser
  // extensions / automation agents that bundle their own runtime). Our global
  // handler captures them because they fire on our pages, but they are not
  // tpmjs bugs — see apps/web/src/lib/sentry-filters.ts.
  beforeSend(event) {
    if (isThirdPartyBrowserError(event)) return null;
    return event;
  },

  // Defense in depth: never even record errors whose top frame is a known
  // browser-extension scheme.
  denyUrls: [/-extension:\/\//i, /^ext:/i],

  release: process.env.NEXT_PUBLIC_TPMJS_COMMIT_SHA,
});

Sentry.setTag('runtime', 'browser');

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
