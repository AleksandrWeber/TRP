import { describe, expect, it } from 'vitest';
import type { AuthSessionRecord } from './auth-session';
import { describeClient, toAuthSessionView } from './auth-session-view';

describe('describeClient (V3-S01-d)', () => {
  it('labels an empty user agent honestly', () => {
    expect(describeClient(null)).toEqual({
      device: 'Unknown device',
      browser: 'Unknown browser',
    });
  });

  it('distinguishes Chrome from Safari and phones from computers', () => {
    expect(
      describeClient(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      ),
    ).toEqual({ device: 'Computer', browser: 'Chrome' });

    expect(
      describeClient(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      ),
    ).toEqual({ device: 'Computer', browser: 'Safari' });

    expect(
      describeClient(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      ),
    ).toEqual({ device: 'Phone or tablet', browser: 'Safari' });
  });
});

describe('toAuthSessionView (V3-S01-d)', () => {
  it('marks the current session and omits refresh material', () => {
    const record: AuthSessionRecord = {
      id: '11111111-1111-4111-8111-111111111111',
      familyId: '22222222-2222-4222-8222-222222222222',
      userId: 'user-1',
      refreshTokenHash: 'should-not-appear',
      expiresAt: new Date('2026-08-23T18:00:00.000Z'),
      revokedAt: null,
      replacedById: null,
      ip: '203.0.113.8',
      userAgent: 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36',
      mfaSatisfied: false,
      createdAt: new Date('2026-08-16T18:15:00.000Z'),
    };

    const view = toAuthSessionView(record, record.id, new Date('2026-08-16T18:00:00.000Z'));
    expect(view.current).toBe(true);
    expect(view.device).toBe('Computer');
    expect(view.browser).toBe('Chrome');
    expect(view.network).toBe('203.0.113.8');
    expect(view.lastActiveAt).toBe('2026-08-16T18:15:00.000Z');
    expect(view.signedInAt).toBe('2026-08-16T18:00:00.000Z');
    expect(JSON.stringify(view)).not.toContain('should-not-appear');
    expect(JSON.stringify(view)).not.toContain('familyId');
    expect(JSON.stringify(view)).not.toContain('mfaSatisfied');
  });
});
