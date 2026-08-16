import { describe, expect, it } from 'vitest';
import type { SignInSessionView } from '../shared/api';
import {
  CURRENT_SESSION_LABEL,
  REVOKE_ALL_PROMPT,
  REVOKE_ONE_PROMPT,
  REVOKE_OTHERS_PROMPT,
  SESSIONS_PAGE_DESCRIPTION,
  confirmCopy,
  formatSessionTime,
  networkLabel,
  otherSessions,
} from './sessionManagement';

const sessions: SignInSessionView[] = [
  {
    id: 'current',
    current: true,
    device: 'Computer',
    browser: 'Chrome',
    network: '203.0.113.8',
    lastActiveAt: '2026-08-16T18:15:00.000Z',
    signedInAt: '2026-08-16T18:00:00.000Z',
  },
  {
    id: 'other',
    current: false,
    device: 'Phone or tablet',
    browser: 'Safari',
    network: null,
    lastActiveAt: '2026-08-16T17:00:00.000Z',
    signedInAt: '2026-08-16T17:00:00.000Z',
  },
];

describe('sessionManagement (V3-S01-d)', () => {
  it('describes network location honestly without inventing a city', () => {
    expect(networkLabel('203.0.113.8')).toBe('Network 203.0.113.8');
    expect(networkLabel(null)).toBe('Location unavailable');
    expect(SESSIONS_PAGE_DESCRIPTION).toContain('not a trusted-device list');
  });

  it('formats times and keeps the current session out of revoke-others', () => {
    expect(formatSessionTime('not-a-date')).toBe('Unknown time');
    expect(formatSessionTime('2026-08-16T18:00:00.000Z').length).toBeGreaterThan(4);
    expect(otherSessions(sessions).map((session) => session.id)).toEqual(['other']);
    expect(CURRENT_SESSION_LABEL).toBe('This device');
  });

  it('uses operator confirmation copy', () => {
    expect(confirmCopy({ kind: 'revoke-one', sessionId: 'other' })).toBe(REVOKE_ONE_PROMPT);
    expect(confirmCopy({ kind: 'revoke-others' })).toBe(REVOKE_OTHERS_PROMPT);
    expect(confirmCopy({ kind: 'revoke-all' })).toBe(REVOKE_ALL_PROMPT);
    expect(confirmCopy(null)).toBeNull();
  });
});
