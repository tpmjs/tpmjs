'use client';

import { useEffect } from 'react';

// Umami visitor analytics. Sentry is initialized once by instrumentation-client.ts.
// Fails open — telemetry must never break the page.
declare global {
  interface Window {
    __tpmjsAnalytics?: boolean;
  }
}

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
  }, []);
  return null;
}
