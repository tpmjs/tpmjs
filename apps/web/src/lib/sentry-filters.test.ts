import { describe, expect, it } from 'vitest';
import { isThirdPartyBrowserError, type MinimalErrorEvent } from './sentry-filters';

function eventWithFrames(filenames: string[]): MinimalErrorEvent {
  return {
    exception: {
      values: [{ stacktrace: { frames: filenames.map((filename) => ({ filename })) } }],
    },
  };
}

describe('isThirdPartyBrowserError', () => {
  it('drops the real "Obscura" extension crash captured on the homepage (issue #178)', () => {
    // Exact frame origins from Sentry event 7635640949 — a browser-extension
    // agent that bundles its own React threw `undefined.toLowerCase()` on `/`.
    const event = eventWithFrames([
      'ext:core/01_core.js',
      '<script>',
      '<script>',
      '<obscura:bootstrap>',
      '<script>',
      '<script>',
      '<script>',
      '<script>',
      '<script>',
      '<script>',
      '<script>',
      '<script>',
      '<script>',
      '<script>',
      '<script>',
    ]);
    expect(isThirdPartyBrowserError(event)).toBe(true);
  });

  it('drops errors from every browser-extension scheme', () => {
    for (const scheme of [
      'chrome-extension://abcdef/inject.js',
      'moz-extension://1234/content.js',
      'safari-web-extension://XYZ/agent.js',
    ]) {
      expect(isThirdPartyBrowserError(eventWithFrames([scheme, '<anonymous>']))).toBe(true);
    }
  });

  it('keeps genuine tpmjs errors that include a first-party /_next/ frame', () => {
    const event: MinimalErrorEvent = {
      exception: {
        values: [
          {
            stacktrace: {
              frames: [
                { filename: '<anonymous>' },
                {
                  filename: 'app:///_next/static/chunks/main-app.js',
                  abs_path: 'https://tpmjs.com/_next/static/chunks/main-app.js',
                },
              ],
            },
          },
        ],
      },
    };
    expect(isThirdPartyBrowserError(event)).toBe(false);
  });

  it('keeps errors thrown from an inline script on a tpmjs page', () => {
    const event: MinimalErrorEvent = {
      exception: {
        values: [
          { stacktrace: { frames: [{ filename: '<anonymous>', abs_path: 'https://tpmjs.com/' }] } },
        ],
      },
    };
    expect(isThirdPartyBrowserError(event)).toBe(false);
  });

  it('keeps events with no stack trace (never silences blindly)', () => {
    expect(isThirdPartyBrowserError({})).toBe(false);
    expect(isThirdPartyBrowserError(eventWithFrames([]))).toBe(false);
    expect(isThirdPartyBrowserError({ exception: { values: [] } })).toBe(false);
  });

  it('keeps a mixed stack where the app and an extension both appear', () => {
    // If our code is anywhere on the stack we want to see it, even if an
    // extension is also involved.
    const event: MinimalErrorEvent = {
      exception: {
        values: [
          {
            stacktrace: {
              frames: [
                { filename: 'chrome-extension://abc/inject.js' },
                { abs_path: 'https://tpmjs.com/_next/static/chunks/page.js' },
              ],
            },
          },
        ],
      },
    };
    expect(isThirdPartyBrowserError(event)).toBe(false);
  });
});
