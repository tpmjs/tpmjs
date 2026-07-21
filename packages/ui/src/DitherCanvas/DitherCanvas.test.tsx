import { act } from 'react';
// eslint-disable-next-line import/no-internal-modules -- Hydration requires React DOM's client entry point.
import { hydrateRoot } from 'react-dom/client';
// eslint-disable-next-line import/no-internal-modules -- SSR requires React DOM's server entry point.
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DitherCanvas } from './DitherCanvas';

const frame = { width: 604, height: 124 } as ImageData;
const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

vi.mock('../system/canvas/DitherEngine', () => ({
  getDitherEngine: () => ({
    ditherText: () => frame,
    generatePulseFrames: () => [frame],
    generateRevealFrames: () => [frame],
  }),
}));

vi.mock('../system/hooks/useDitherAnimation', () => ({
  useDitherAnimation: () => ({ currentFrame: null, isComplete: false, frameIndex: 0 }),
}));

vi.mock('../system/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

beforeEach(() => {
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
  vi.restoreAllMocks();
});

describe('DitherCanvas hydration', () => {
  it('keeps the server and first client render identical before sizing for the browser', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const container = document.createElement('div');

    container.innerHTML = renderToString(<DitherCanvas text="LIVE STATS" mode="pulse" />);
    const serverCanvas = container.querySelector('canvas');
    expect(serverCanvas?.getAttribute('style')).toContain('width:0');
    expect(serverCanvas?.getAttribute('style')).toContain('height:0');

    const root = hydrateRoot(container, <DitherCanvas text="LIVE STATS" mode="pulse" />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(consoleError).not.toHaveBeenCalled();
    const hydratedCanvas = container.querySelector('canvas');
    expect(hydratedCanvas?.style.width).toBe('302px');
    expect(hydratedCanvas?.style.height).toBe('62px');

    await act(async () => root.unmount());
  });
});
