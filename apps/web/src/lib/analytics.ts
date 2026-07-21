/**
 * Emit a custom Umami event for the activation funnel (search → view → use).
 *
 * Umami is loaded lazily by `DontoAnalytics`; once its script is present it
 * exposes `window.umami.track(name, data)`. This helper is fail-open — analytics
 * must never break the page — and a no-op during SSR / before the script loads.
 */
type UmamiApi = { track?: (name: string, data?: Record<string, unknown>) => void };

export function trackEvent(name: string, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    const umami = (window as unknown as { umami?: UmamiApi }).umami;
    umami?.track?.(name, data);
  } catch {
    // analytics must never break the page
  }
}
