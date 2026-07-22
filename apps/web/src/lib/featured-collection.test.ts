import { describe, expect, it } from 'vitest';
import { collectionActivationValue, selectFeaturedCollection } from './featured-collection';

describe('featured collection selection', () => {
  it('balances proven usage with collection breadth', () => {
    const candidates = [
      { id: 'single-hot-tool', executionCount: 272, likeCount: 1, _count: { tools: 1 } },
      { id: 'proven-collection', executionCount: 126, likeCount: 1, _count: { tools: 60 } },
      { id: 'large-unused-bundle', executionCount: 0, likeCount: 2, _count: { tools: 74 } },
    ] as const;

    expect(selectFeaturedCollection(candidates)?.id).toBe('proven-collection');
  });

  it('returns no selection for an empty candidate set', () => {
    expect(selectFeaturedCollection([])).toBeUndefined();
  });

  it('uses logarithmic breadth so size alone cannot dominate demonstrated use', () => {
    expect(
      collectionActivationValue({ executionCount: 10, likeCount: 0, _count: { tools: 10 } })
    ).toBeGreaterThan(
      collectionActivationValue({ executionCount: 0, likeCount: 0, _count: { tools: 100 } })
    );
  });
});
