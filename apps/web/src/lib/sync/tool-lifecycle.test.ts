import { describe, expect, it } from 'vitest';
import { newToolLifecycle, refreshedToolLifecycle } from './tool-lifecycle';

describe('tool package-release lifecycle', () => {
  const now = new Date('2026-07-21T16:30:00.000Z');

  it('attributes a new active tool to the observed package version', () => {
    expect(newToolLifecycle('1.2.3', now)).toEqual({
      isActive: true,
      lastSeenVersion: '1.2.3',
      retiredAt: null,
      healthCheckNextAt: now,
    });
  });

  it('does not invalidate evidence during a same-version metadata poll', () => {
    expect(
      refreshedToolLifecycle({ lastSeenVersion: '1.2.3', schemaSource: 'extracted' }, '1.2.3', now)
    ).toEqual({
      isActive: true,
      lastSeenVersion: '1.2.3',
      retiredAt: null,
    });
  });

  it('reactivates and requeues version-sensitive evidence for a new release', () => {
    expect(
      refreshedToolLifecycle({ lastSeenVersion: '1.2.2', schemaSource: 'extracted' }, '1.2.3', now)
    ).toEqual({
      isActive: true,
      lastSeenVersion: '1.2.3',
      retiredAt: null,
      schemaSource: null,
      schemaExtractedAt: null,
      schemaExtractionAttemptAt: null,
      schemaExtractionError: null,
      healthCheckNextAt: now,
      healthCheckLeaseUntil: null,
      healthCheckLeasedBy: null,
    });
  });

  it('preserves author-declared schemas while rechecking a new release', () => {
    expect(
      refreshedToolLifecycle({ lastSeenVersion: '1.2.2', schemaSource: 'author' }, '1.2.3', now)
    ).toEqual({
      isActive: true,
      lastSeenVersion: '1.2.3',
      retiredAt: null,
      healthCheckNextAt: now,
      healthCheckLeaseUntil: null,
      healthCheckLeasedBy: null,
    });
  });
});
