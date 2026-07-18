import { describe, expect, it } from 'vitest';
import { assertExecutionEligible, evaluateExecutionEligibility } from './execution-eligibility';
import { createSessionLease } from './session-lease';
import { attachLease, createTradingSession, transitionSession } from './trading-session';
import { TradingSessionStatus } from './trading-session-status';

const createdAt = '2026-07-18T15:10:00.000Z';
const now = '2026-07-18T15:10:05.000Z';

function runningSession() {
  const created = createTradingSession({
    id: 'session-1',
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-1',
    origin: 'manual',
    actorId: 'actor-1',
    idempotencyKey: 'key-1',
    createdAt,
    recordedAt: createdAt,
  });
  const starting = transitionSession(created, TradingSessionStatus.STARTING, createdAt);
  const lease = createSessionLease({
    ownerId: 'worker-1',
    acquiredAt: now,
    expiresAt: '2026-07-18T15:10:35.000Z',
    previousToken: 0,
  });
  return attachLease(transitionSession(starting, TradingSessionStatus.RUNNING, now), lease);
}

describe('US157 — fenced execution eligibility', () => {
  it('allows only RUNNING sessions with the current fencing token', () => {
    const session = runningSession();
    const ok = assertExecutionEligible(session, 1, now);
    expect(ok.eligible).toBe(true);
    expect(ok.fencingToken).toBe(1);

    const paused = transitionSession(session, TradingSessionStatus.PAUSED, now);
    expect(evaluateExecutionEligibility(paused, 1, now)).toMatchObject({
      eligible: false,
      reason: expect.stringContaining('paused'),
    });
  });

  it('rejects stale fencing tokens and expired leases without financial coupling', () => {
    const session = runningSession();
    expect(evaluateExecutionEligibility(session, 99, now)).toMatchObject({
      eligible: false,
      reason: /stale fencing token/,
    });
    expect(evaluateExecutionEligibility(session, 1, '2026-07-18T15:11:00.000Z')).toMatchObject({
      eligible: false,
      reason: /lease expired/,
    });
    expect(JSON.stringify(session)).not.toMatch(/pnl|equity|cashBalance/i);
  });
});
