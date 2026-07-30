import { describe, expect, it } from 'vitest';

import { LATEST_PROTOCOL_VERSION, negotiateProtocolVersion } from './protocol';

describe('negotiateProtocolVersion', () => {
  it('echoes the modern streamable-HTTP version when requested', () => {
    expect(negotiateProtocolVersion('2025-03-26')).toBe('2025-03-26');
  });

  it('echoes the latest version when requested', () => {
    expect(negotiateProtocolVersion('2025-06-18')).toBe('2025-06-18');
  });

  it('still accepts the legacy 2024-11-05 version for old clients', () => {
    expect(negotiateProtocolVersion('2024-11-05')).toBe('2024-11-05');
  });

  it('falls back to the server latest for an unknown version', () => {
    expect(negotiateProtocolVersion('1999-01-01')).toBe(LATEST_PROTOCOL_VERSION);
  });

  it('falls back to the server latest when no version is requested', () => {
    expect(negotiateProtocolVersion(undefined)).toBe(LATEST_PROTOCOL_VERSION);
  });

  it('falls back to the server latest for a non-string value', () => {
    expect(negotiateProtocolVersion(42)).toBe(LATEST_PROTOCOL_VERSION);
  });
});
