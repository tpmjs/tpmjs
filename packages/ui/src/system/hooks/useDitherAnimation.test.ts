import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDitherAnimation } from './useDitherAnimation';

describe('useDitherAnimation', () => {
  it('renders a static frame that becomes available after hydration', () => {
    const frame = { width: 20, height: 10 } as ImageData;
    const { result, rerender } = renderHook(
      ({ frames }: { frames: ImageData[] }) => useDitherAnimation({ frames, mode: 'static' }),
      { initialProps: { frames: [] as ImageData[] } }
    );

    expect(result.current).toEqual({ currentFrame: null, isComplete: true, frameIndex: 0 });

    rerender({ frames: [frame] });

    expect(result.current).toEqual({ currentFrame: frame, isComplete: true, frameIndex: 0 });
  });
});
