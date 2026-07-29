/**
 * Client-side Sentry noise filtering.
 *
 * Our global browser error handler captures *every* uncaught exception that
 * fires on a tpmjs page — including exceptions thrown by third-party code that
 * a visitor's browser injects into our DOM (ad blockers, privacy tools, and
 * automation/agent extensions that bundle their own React runtime). Those are
 * not tpmjs bugs, we cannot fix them, and the Sentry webhook auto-files a
 * GitHub issue for each one, so they have to be dropped at the source.
 *
 * The classifier is intentionally conservative: it only drops an event when the
 * stack trace contains **no** first-party frame at all *and* at least one frame
 * that clearly comes from a browser extension or injected script. Any genuine
 * tpmjs error carries at least one `/_next/…` bundle frame, so it is always
 * kept.
 */

interface MinimalStackFrame {
  filename?: string;
  abs_path?: string;
  module?: string;
}

interface MinimalException {
  stacktrace?: { frames?: MinimalStackFrame[] };
}

/** Structural subset of Sentry's `ErrorEvent` that this module inspects. */
export interface MinimalErrorEvent {
  exception?: { values?: MinimalException[] };
}

/**
 * Frame origins that did NOT come from a tpmjs first-party bundle: browser
 * extensions (every vendor scheme), native runtime module shims (`ext:…`), and
 * synthetic/injected inline scripts with no real source URL.
 */
const FOREIGN_FRAME_PATTERNS: readonly RegExp[] = [
  /-extension:\/\//i, // chrome-extension://, moz-extension://, safari-web-extension://, …
  /^ext:/i, // runtime shim, e.g. `ext:core/01_core.js`
  /^webkit-masked-url:/i,
  /^<anonymous>$/i,
  /^<script>$/i, // inline <script> injected into the page (no source URL)
  /^<[^>]+:[^>]*>$/, // synthetic angle-bracket origins, e.g. `<obscura:bootstrap>`
];

/** Frame origins that ARE our own emitted code. */
const APP_FRAME_PATTERNS: readonly RegExp[] = [
  /\/_next\//, // Next.js emitted client chunks
  /app:\/\//, // Sentry-rewritten first-party frames
  /tpmjs\.com\//, // absolute first-party URLs (incl. inline scripts on our pages)
];

function frameSource(frame: MinimalStackFrame): string {
  return frame.abs_path ?? frame.filename ?? frame.module ?? '';
}

function isAppFrame(source: string): boolean {
  return APP_FRAME_PATTERNS.some((re) => re.test(source));
}

function isForeignFrame(source: string): boolean {
  return source !== '' && FOREIGN_FRAME_PATTERNS.some((re) => re.test(source));
}

/**
 * True when the event was thrown entirely by non-tpmjs code injected into the
 * page (a browser extension or injected agent), so it should be dropped before
 * it reaches Sentry.
 */
export function isThirdPartyBrowserError(event: MinimalErrorEvent): boolean {
  const frames = (event.exception?.values ?? []).flatMap((value) => value.stacktrace?.frames ?? []);

  // No stack to reason about → keep it (never silence a real error blindly).
  if (frames.length === 0) return false;

  const sources = frames.map(frameSource);

  // Any first-party frame means our code is (at least partly) on the stack.
  if (sources.some(isAppFrame)) return false;

  // No first-party frame, and something clearly foreign is present → drop it.
  return sources.some(isForeignFrame);
}
