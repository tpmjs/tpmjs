export interface CollectionActivationCandidate {
  executionCount: number;
  likeCount: number;
  _count: { tools: number };
}

/**
 * Balance demonstrated use with the breadth that makes a collection useful.
 * Logarithmic breadth prevents a giant uncurated bundle from winning on size alone.
 */
export function collectionActivationValue(candidate: CollectionActivationCandidate): number {
  return (
    (candidate.executionCount + 1) *
    (candidate.likeCount + 1) *
    Math.log2(candidate._count.tools + 1)
  );
}

export function selectFeaturedCollection<T extends CollectionActivationCandidate>(
  candidates: readonly T[]
): T | undefined {
  return candidates.reduce<T | undefined>((best, candidate) => {
    if (!best) return candidate;
    return collectionActivationValue(candidate) > collectionActivationValue(best)
      ? candidate
      : best;
  }, undefined);
}
