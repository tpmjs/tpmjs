'use client';

import { useEffect } from 'react';

// Sentry (errors/perf/replay via CDN loader, tpmjs org project) + Umami (visitor analytics).
// Fails open — telemetry must never break the page.
declare global {
  interface Window {
    sentryOnLoad?: () => void;
    Sentry?: { init: (c: Record<string, unknown>) => void };
    __tpmjsAnalytics?: boolean;
  }
}

const SENTRY_KEY = '0b61db9cf233f36811d7b33d17757251';
const UMAMI_ID = '822663c8-1007-4639-b56a-c7b2b0267be1';

export function DontoAnalytics() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.__tpmjsAnalytics) return;
    window.__tpmjsAnalytics = true;
    try {
      const u = document.createElement('script');
      u.src = 'https://analytics.donto.org/script.js';
      u.defer = true;
      u.setAttribute('data-website-id', UMAMI_ID);
      document.head.appendChild(u);
    } catch {
      // analytics must never break the page
    }
    try {
      window.sentryOnLoad = () => {
        try {
          window.Sentry?.init({
            tracesSampleRate: 0.2,
            replaysSessionSampleRate: 0.05,
            replaysOnErrorSampleRate: 1.0,
          });
        } catch {
          // analytics must never break the page
        }
      };
      const s = document.createElement('script');
      s.src = `https://js.sentry-cdn.com/${SENTRY_KEY}.min.js`;
      s.crossOrigin = 'anonymous';
      s.async = true;
      document.head.appendChild(s);
    } catch {
      // analytics must never break the page
    }
  }, []);
  return null;
}
