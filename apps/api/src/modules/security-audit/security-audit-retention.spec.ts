import { describe, expect, it } from 'vitest';
import { retentionDispositionFor } from './security-audit-retention';

describe('security-audit-retention', () => {
  it('provides deterministic eligibility without deleting history', () => {
    expect(
      retentionDispositionFor({
        eventType: 'vault.lifecycle',
        occurredAt: '2026-08-17T00:00:00.000Z',
      }),
    ).toEqual({
      retention: 'longest',
      expiresAt: '2028-08-16T00:00:00.000Z',
    });
  });

  it('gives platform abuse its shorter interim retention class', () => {
    expect(
      retentionDispositionFor({
        eventType: 'platform.abuse.throttled',
        occurredAt: '2026-08-17T00:00:00.000Z',
      }).retention,
    ).toBe('medium-long');
  });

  it('refuses unclassified event types', () => {
    expect(() =>
      retentionDispositionFor({
        eventType: 'technical.retry',
        occurredAt: '2026-08-17T00:00:00.000Z',
      }),
    ).toThrow('classified event type');
  });
});
