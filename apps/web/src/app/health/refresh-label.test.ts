import { describe, expect, it } from 'vitest';
import { formatLastRefresh } from './refresh-label';

describe('formatLastRefresh', () => {
  it('keeps the server and initial browser render deterministic', () => {
    expect(formatLastRefresh(null)).toBe('Not checked yet');
  });
});
