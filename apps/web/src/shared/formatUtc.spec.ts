import { describe, expect, it } from 'vitest';
import { formatUtc } from './formatUtc';

describe('formatUtc', () => {
  it('formats ISO timestamps in UTC', () => {
    expect(formatUtc('2026-07-16T12:00:00.000Z')).toBe('2026-07-16 12:00:00 UTC');
  });

  it('returns em dash for empty values', () => {
    expect(formatUtc(null)).toBe('—');
    expect(formatUtc(undefined)).toBe('—');
    expect(formatUtc('')).toBe('—');
  });

  it('passes through unparseable values', () => {
    expect(formatUtc('not-a-date')).toBe('not-a-date');
  });
});
