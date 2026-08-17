import { describe, expect, it } from 'vitest';
import { normalizeIncomingQuery } from './request-normalization';

describe('request-normalization (V3-S04-a)', () => {
  it('collapses duplicate query values when they agree', () => {
    const result = normalizeIncomingQuery({ page: ['1', '1'] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.query.page).toBe('1');
    }
  });

  it('rejects HTTP parameter pollution when values conflict', () => {
    const result = normalizeIncomingQuery({ role: ['admin', 'reader'] });
    expect(result).toEqual({
      ok: false,
      code: 'parameter_pollution',
      field: 'role',
    });
  });

  it('keeps distinct fields independent', () => {
    const result = normalizeIncomingQuery({ page: '2', limit: '25' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.query).toEqual({ page: '2', limit: '25' });
    }
  });
});
