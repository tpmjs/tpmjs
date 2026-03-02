import * as Sentry from '@sentry/nextjs';

// Defensive guard: some server-side libraries (e.g. @hono/node-server, MCP SDK OAuth)
// may define or freeze `history.pushState` as a non-writable global in Node.js environments.
// Make pushState writable at server startup so SDK-level monkey-patching does not throw.
if (typeof globalThis.history !== 'undefined') {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis.history, 'pushState');
  if (descriptor && !descriptor.writable && !descriptor.set) {
    try {
      Object.defineProperty(globalThis.history, 'pushState', {
        ...descriptor,
        writable: true,
        configurable: true,
      });
    } catch {
      // Environment does not permit redefining history.pushState — ignore
    }
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
