/**
 * Emit a custom Umami event for the activation funnel (search → view → use).
 *
 * Umami is loaded lazily by `DontoAnalytics`; once its script is present it
 * exposes `window.umami.track(name, data)`. This helper is fail-open — analytics
 * must never break the page — and a no-op during SSR / before the script loads.
 */
type UmamiApi = { track?: (name: string, data?: Record<string, unknown>) => void };

export type InstallSurface = 'sdk' | 'mcp' | 'rest' | 'cli' | 'skill';
export type PlaygroundOutcome = 'success' | 'failure';

export function trackEvent(name: string, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    const umami = (window as unknown as { umami?: UmamiApi }).umami;
    umami?.track?.(name, data);
  } catch {
    // analytics must never break the page
  }
}

/** Record a successful copy without sending the copied command itself. */
export function trackInstallCommandCopy(tool: string, surface: InstallSurface): void {
  trackEvent('install_command_copy', { tool, surface });
}

/** Record only the terminal outcome; prompts, output, and errors stay private. */
export function trackPlaygroundExecution(tool: string, outcome: PlaygroundOutcome): void {
  trackEvent('playground_execute', { tool, outcome });
}

/** Build an attempt-scoped recorder so every execution emits exactly one terminal outcome. */
export function createPlaygroundOutcomeRecorder(
  tool: string
): (outcome: PlaygroundOutcome) => void {
  let recorded = false;
  return (outcome) => {
    if (recorded) return;
    recorded = true;
    trackPlaygroundExecution(tool, outcome);
  };
}

/** Record the stable copy surface without sending the collection URL or config. */
export function trackCollectionMcpCopy(collection: string, format: string): void {
  trackEvent('collection_mcp_copy', { collection, format });
}

/** Record signup milestones without attaching user-entered identity data. */
export function trackSignup(stage: 'started' | 'completed'): void {
  trackEvent(`signup_${stage}`, { method: 'email' });
}
